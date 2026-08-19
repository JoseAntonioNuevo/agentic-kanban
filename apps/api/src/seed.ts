import {
  addMembership,
  applyMigrations,
  DEMO_PROJECT_ID,
  DEMO_PROJECT_NAME,
  DEMO_WORKSPACE_ID,
  DEMO_WORKSPACE_NAME,
  getUserByEmail,
  upsertProject,
  upsertWorkspace,
} from "@agentic-kanban/db";

import { auth } from "./auth/index.ts";

export const DEMO_PASSWORD = "Demo1234!";

const demoUsers = [
  { name: "Ana", email: "ana@demo.test" },
  { name: "Luis", email: "luis@demo.test" },
] as const;

async function ensureDemoUser(name: string, email: string): Promise<string> {
  const existing = await getUserByEmail(email);
  if (existing) {
    return existing.id;
  }

  try {
    const created = await auth.api.signUpEmail({
      body: { name, email, password: DEMO_PASSWORD },
    });
    return created.user.id;
  } catch {
    const afterConflict = await getUserByEmail(email);
    if (!afterConflict) {
      throw new Error(`Failed to seed demo user ${email}`);
    }
    return afterConflict.id;
  }
}

export async function seedDemoData(): Promise<void> {
  const userIds: string[] = [];
  for (const demo of demoUsers) {
    userIds.push(await ensureDemoUser(demo.name, demo.email));
  }

  await upsertWorkspace({
    id: DEMO_WORKSPACE_ID,
    name: DEMO_WORKSPACE_NAME,
  });
  await upsertProject({
    id: DEMO_PROJECT_ID,
    workspaceId: DEMO_WORKSPACE_ID,
    name: DEMO_PROJECT_NAME,
  });

  for (const userId of userIds) {
    await addMembership({
      workspaceId: DEMO_WORKSPACE_ID,
      userId,
    });
  }
}

if (import.meta.main) {
  await applyMigrations();
  await seedDemoData();
  console.log("Demo data is ready.");
}

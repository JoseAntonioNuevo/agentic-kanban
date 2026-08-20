/**
 * Path del outbox: mismo directorio que el fichero sqlite.
 */
import { describe, expect, it } from "vite-plus/test";

import { outboxPathFromDatabaseUrl } from "./outbox.ts";

describe("outboxPathFromDatabaseUrl", () => {
  it("Compose file:/data/... → /data/outbox.jsonl", () => {
    expect(outboxPathFromDatabaseUrl("file:/data/agentic-kanban.db")).toBe("/data/outbox.jsonl");
  });

  it("host file:<repo>/data/... → <repo>/data/outbox.jsonl", () => {
    expect(
      outboxPathFromDatabaseUrl("file:/Users/jose/Documents/the-power/kanban/data/agentic-kanban.db"),
    ).toBe("/Users/jose/Documents/the-power/kanban/data/outbox.jsonl");
  });
});

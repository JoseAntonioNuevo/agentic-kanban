/**
 * Acento visual del tenant. Sale de `workspace.id`, nunca del usuario.
 * Ana y Luis ven el mismo color en el workspace compartido.
 */
export function workspaceAccentClass(workspaceId: string): string {
  if (workspaceId === "ws_thepower_demo") {
    return "bg-slate-500";
  }

  if (workspaceId === "ws_ana_demo") {
    return "bg-sky-600";
  }

  return "bg-zinc-400";
}

/**
 * El tablero abierto vive en la URL como `?project=<id>`.
 *
 * No hay router: `App` lee el parámetro al montar y lo escribe con la
 * History API. Recargar o pegar el enlace abre el mismo tablero; la API
 * sigue decidiendo el acceso (un id ajeno es 404).
 */
const PROJECT_PARAM = "project";

/** Id del proyecto en `search` (`location.search`), o `null` si falta o está vacío. */
export function readProjectId(search: string): string | null {
  const value = new URLSearchParams(search).get(PROJECT_PARAM)?.trim();
  return value ? value : null;
}

/** `href` con `?project=<id>`, o sin él cuando `projectId` es `null`. Conserva el resto. */
export function projectUrl(href: string, projectId: string | null): string {
  const url = new URL(href);
  if (projectId === null) {
    url.searchParams.delete(PROJECT_PARAM);
  } else {
    url.searchParams.set(PROJECT_PARAM, projectId);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

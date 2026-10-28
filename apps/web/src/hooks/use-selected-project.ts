/**
 * Proyecto abierto sincronizado con `?project=` sin router.
 *
 * El estado inicial sale de la URL, así que recargar o pegar el enlace
 * abre ese tablero. Elegir o cerrar un proyecto hace `pushState`, y
 * `popstate` (atrás/adelante del navegador) vuelve a leer la URL.
 */
import { useEffect, useState } from "react";

import { projectUrl, readProjectId } from "@/lib/project-url.ts";

export function useSelectedProject(): [string | null, (projectId: string | null) => void] {
  const [projectId, setProjectId] = useState(() => readProjectId(window.location.search));

  useEffect(() => {
    function handlePopState() {
      setProjectId(readProjectId(window.location.search));
    }
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  function selectProject(next: string | null) {
    if (next !== readProjectId(window.location.search)) {
      window.history.pushState(null, "", projectUrl(window.location.href, next));
    }
    setProjectId(next);
  }

  return [projectId, selectProject];
}

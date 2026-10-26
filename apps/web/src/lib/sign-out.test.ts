/**
 * El cierre de sesión oculta la UI privada antes de la petición y limpia
 * la caché después. Un QueryClient real y un signOut falso bastan: no hay navegador.
 */
import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vite-plus/test";

import { signOutAndClearPrivateData } from "./sign-out.ts";

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Number.POSITIVE_INFINITY,
      },
    },
  });
}

describe("signOutAndClearPrivateData", () => {
  it("oculta antes de signOut, limpia la query en vuelo y no vuelve a mostrar", async () => {
    const queryClient = createQueryClient();
    const calls: string[] = [];
    let resolveSignOut: (value: { error: null }) => void = () => {};
    let resolveLate: (value: readonly string[]) => void = () => {};
    let capturedSignal: AbortSignal | undefined;

    const pending = queryClient.fetchQuery({
      queryKey: ["workspaces", "A"],
      queryFn: ({ signal }) =>
        new Promise<readonly string[]>((resolve, reject) => {
          capturedSignal = signal;
          resolveLate = resolve;
          signal.addEventListener(
            "abort",
            () => {
              reject(new DOMException("aborted", "AbortError"));
            },
            { once: true },
          );
        }),
    });
    const settled = pending.then(
      () => {
        throw new Error("la query de A no debía resolverse");
      },
      (error: unknown) => error,
    );

    const done = signOutAndClearPrivateData({
      signOut: () => {
        calls.push("signOut");
        return new Promise<{ error: null }>((resolve) => {
          resolveSignOut = resolve;
        });
      },
      queryClient,
      setPrivateVisible: (visible) => {
        calls.push(visible ? "show" : "hide");
      },
    });

    expect(calls).toEqual(["hide", "signOut"]);
    expect(queryClient.getQueryCache().find({ queryKey: ["workspaces", "A"] })).toBeDefined();
    expect(capturedSignal?.aborted).toBe(false);

    resolveSignOut({ error: null });
    await expect(done).resolves.toBe(true);

    expect(calls).toEqual(["hide", "signOut"]);
    expect(queryClient.getQueryCache().find({ queryKey: ["workspaces", "A"] })).toBeUndefined();
    expect(capturedSignal?.aborted).toBe(true);

    resolveLate(["tarde"]);
    await settled;
    expect(queryClient.getQueryData(["workspaces", "A"])).toBeUndefined();
  });

  it("si signOut devuelve error, limpia y vuelve a mostrar", async () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(["workspaces", "A"], ["ana"]);
    const calls: string[] = [];

    const ok = await signOutAndClearPrivateData({
      signOut: () => {
        calls.push("signOut");
        return Promise.resolve({ error: { message: "no se pudo cerrar" } });
      },
      queryClient,
      setPrivateVisible: (visible) => {
        if (visible) {
          expect(queryClient.getQueryData(["workspaces", "A"])).toBeUndefined();
        }
        calls.push(visible ? "show" : "hide");
      },
    });

    expect(ok).toBe(false);
    expect(calls).toEqual(["hide", "signOut", "show"]);
    expect(queryClient.getQueryData(["workspaces", "A"])).toBeUndefined();
  });

  it("si signOut lanza, limpia, vuelve a mostrar y no propaga", async () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(["workspaces", "A"], ["ana"]);
    const calls: string[] = [];

    const ok = await signOutAndClearPrivateData({
      signOut: () => {
        calls.push("signOut");
        throw new Error("red");
      },
      queryClient,
      setPrivateVisible: (visible) => {
        if (visible) {
          expect(queryClient.getQueryData(["workspaces", "A"])).toBeUndefined();
        }
        calls.push(visible ? "show" : "hide");
      },
    });

    expect(ok).toBe(false);
    expect(calls).toEqual(["hide", "signOut", "show"]);
    expect(queryClient.getQueryData(["workspaces", "A"])).toBeUndefined();
  });
});

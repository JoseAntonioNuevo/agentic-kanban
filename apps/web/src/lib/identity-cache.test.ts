/**
 * La caché privada sigue a la identidad: A no deja datos cuando entra B o cuando se sale.
 * Usa un QueryClient real. La promesa diferida respeta el AbortSignal de la query.
 */
import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vite-plus/test";

import { resetCacheForIdentityChange } from "./identity-cache.ts";

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

describe("resetCacheForIdentityChange", () => {
  it("de A a B elimina las queries de A y conserva las de B y health", () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(["workspaces", "A"], [{ id: "ws_ana_demo" }]);
    queryClient.setQueryData(["workspaces", "B"], [{ id: "ws_thepower_demo" }]);
    queryClient.setQueryData(["health"], { status: "ok" });

    resetCacheForIdentityChange(queryClient, "A", "B");

    expect(queryClient.getQueryData(["workspaces", "A"])).toBeUndefined();
    expect(queryClient.getQueryData(["workspaces", "B"])).toEqual([{ id: "ws_thepower_demo" }]);
    expect(queryClient.getQueryData(["health"])).toEqual({ status: "ok" });
  });

  it("de A a null vacía toda la caché", () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(["workspaces", "A"], []);
    queryClient.setQueryData(["health"], { status: "ok" });

    resetCacheForIdentityChange(queryClient, "A", null);

    expect(queryClient.getQueryData(["workspaces", "A"])).toBeUndefined();
    expect(queryClient.getQueryData(["health"])).toBeUndefined();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it("de null a A no toca la caché", () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(["health"], { status: "ok" });
    queryClient.setQueryData(["workspaces", "A"], []);

    resetCacheForIdentityChange(queryClient, null, "A");

    expect(queryClient.getQueryData(["health"])).toEqual({ status: "ok" });
    expect(queryClient.getQueryData(["workspaces", "A"])).toEqual([]);
  });

  it("una respuesta tardía de A no vuelve a la caché y el signal queda aborted", async () => {
    const queryClient = createQueryClient();
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

    expect(capturedSignal).toBeDefined();

    queryClient.setQueryData(["workspaces", "B"], ["b"]);
    queryClient.setQueryData(["health"], { status: "ok" });

    resetCacheForIdentityChange(queryClient, "A", "B");
    resolveLate(["tarde"]);

    await settled;

    expect(queryClient.getQueryData(["workspaces", "A"])).toBeUndefined();
    expect(capturedSignal?.aborted).toBe(true);
    expect(queryClient.getQueryData(["workspaces", "B"])).toEqual(["b"]);
    expect(queryClient.getQueryData(["health"])).toEqual({ status: "ok" });
  });
});

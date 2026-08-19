# Tecnologías frontend

SPA en `apps/web`: React pinta, TanStack Query pide, Zod valida, Vite+ sirve. No hay Next ni router.

```mermaid
flowchart TB
  subgraph ui [UI]
    A["React 19.2.8"]
    B["shadcn 4.18.0"]
    C["Tailwind 4.3.3"]
    D["sonner"]
  end
  subgraph data [Estado y contrato]
    E["TanStack Query 5.101.4"]
    F["Zod 4.4.3 + schemas"]
  end
  subgraph tool [Toolchain]
    G["Vite+ 0.2.9"]
    H["TypeScript 7.0.2"]
  end
  ui --> data --> tool
```

- Un solo `QueryClient`. Estado de servidor → Query. Estado de UI → `useState`.
- `fetch("/api/health")` **relativo**. Vite+ reenvía `/api` a `API_PROXY_TARGET` (`localhost:3000` o `http://api:3000` en Compose).
- El JSON se trata como `unknown` y se parsea con `healthResponseSchema` (el mismo que usa la API).
- Tailwind 4 entra por plugin de Vite (`@import "tailwindcss"`). No hay `tailwind.config`.
- `next-themes` es el helper de tema, **no** es Next.js.

```mermaid
flowchart LR
  subgraph elegido [Elegido]
    e1["React SPA"]
    e2["Vite+"]
    e3["TanStack Query"]
    e4["shadcn y Tailwind 4"]
  end
  subgraph parked [Instalado sin usar]
    p1["better-auth"]
    p2["dnd-kit/react"]
  end
  subgraph nunca [Nunca]
    n1["Next.js"]
    n2["Redux Zustand"]
    n3["React Router"]
    n4["React Hook Form"]
  end
```

> [!tip] Regla de oro
> Nunca `fetch("http://localhost:3000/...")`. URL relativa `/api/...` y el proxy de Vite+ hace el resto. Sin CORS.

| Hoy                                  | Instalado, aún no se usa        | Nunca                                            |
| ------------------------------------ | ------------------------------- | ------------------------------------------------ |
| Health screen, Query, Zod `.parse()` | `better-auth`, `@dnd-kit/react` | Next, Redux, React Router, RHF, ESLint, Prettier |

← [Dependencias](01-dependencias.md) · [Backend →](03-tecnologias-backend.md)

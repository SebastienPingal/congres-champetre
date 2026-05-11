# src/components/providers

React context providers wrapping the entire app (mounted in `src/app/layout.tsx`).

| File | Purpose |
|---|---|
| `auth-provider.tsx` | NextAuth `SessionProvider` wrapper |
| `query-provider.tsx` | TanStack Query `QueryClientProvider` + DevTools. `staleTime=30s`, `gcTime=5min`, `retry=1`, no window focus refetch. |

Order in layout: `AuthProvider` outer → `QueryProvider` inner.

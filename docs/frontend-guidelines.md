# Frontend Guidelines

Covers Next.js-specific and React conventions.

- Prefer App Router and Server Components by default
- Use `use client` only when necessary (client state, event listeners)
- Use Next.js `Image`, `Link`, and `Script` where appropriate
- Default to TypeScript interfaces for component props
- Extract reusable logic into hooks

Performance and behavior:
- Code split and lazy-load non-critical UI
- Use `useMemo`/`useCallback` judiciously
- Avoid client-only features in server components

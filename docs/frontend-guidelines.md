# Frontend Guidelines

Covers Next.js-specific and React conventions.

- Prefer App Router and Server Components by default
- Use `use client` only when necessary (client state, event listeners)
- Use Next.js `Image`, `Link`, and `Script` where appropriate
- Default to TypeScript interfaces for component props
- Extract reusable logic into hooks
- Keep component/page files under 350 lines whenever practical
- Start extracting subcomponents/hooks/helpers once a file approaches 300 lines

When splitting frontend files:
- Move UI blocks into colocated components
- Move stateful logic into custom hooks
- Move pure transformations/formatters into helper modules
- Keep container/page files focused on orchestration and composition

Performance and behavior:
- Code split and lazy-load non-critical UI
- Use `useMemo`/`useCallback` judiciously
- Avoid client-only features in server components

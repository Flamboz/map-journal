# Common Issues

Hydration mismatches:
- Use `useEffect` for client-only behavior
- Use `dynamic` imports with `ssr: false` for browser-only components

Large-list performance:
- Virtualize long lists
- Use pagination or server-side filtering

Type errors in production build:
- Enable TypeScript strict mode
- Fix errors before deploying

# Performance

Frontend:
- Code-splitting and lazy loading
- Optimize images with Next.js `Image`
- Use caching for API responses where appropriate (for example, API-layer memoization)
- Keep client components focused; prefer Server Components when possible

Backend:
- Optimize DB queries
- Keep route handlers thin and move heavier logic into services
- Add focused in-process caching only when profiling shows repeated hot reads

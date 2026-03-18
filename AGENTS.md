## Map‑Journal — quick agent landing

Map‑Journal is a Next.js + Fastify app for creating and managing
location‑based events (pins, photos, filters, user auth).

- **Package manager**: pnpm (pnpm-lock.yaml present)
- **Top-level scripts**: frontend uses `dev`, `build`, `start`, `lint`, `test`, `test:watch` (see frontend/package.json)
- **Tech summary**: Next.js (App Router), React 19, TypeScript strict, Tailwind, Fastify, SQLite

This AGENTS.md is a minimal root index. Detailed guidelines and the
full style & workflow docs live in the `docs/` folder linked below.

Key guardrail:

- Keep source files under 350 lines whenever practical.
- If a file approaches 300 lines, proactively extract components, hooks,
  utilities, or route modules before adding more logic.
- Treat 350+ lines as a refactor trigger, not a target.

Docs:

- [docs/tech-stack.md](docs/tech-stack.md)
- [docs/project-structure.md](docs/project-structure.md)
- [docs/code-style.md](docs/code-style.md)
- [docs/frontend-guidelines.md](docs/frontend-guidelines.md)
- [docs/testing.md](docs/testing.md)
- [docs/backend.md](docs/backend.md)
- [docs/error-validation.md](docs/error-validation.md)
- [docs/performance.md](docs/performance.md)
- [docs/security-accessibility.md](docs/security-accessibility.md)
- [docs/common-issues.md](docs/common-issues.md)

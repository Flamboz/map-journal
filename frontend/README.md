# Map Journal Frontend

Next.js App Router frontend for creating, browsing, and filtering map-based events with photos and authentication.

## Requirements

- Node.js 20+
- pnpm

## Run Locally

Install dependencies:

```bash
pnpm install
```

Start development server:

```bash
pnpm dev
```

Run tests:

```bash
pnpm test
```

Watch tests:

```bash
pnpm test:watch
```

Lint:

```bash
pnpm lint
```

Build and run production:

```bash
pnpm build
pnpm start
```

## Backend Dependency

This frontend expects the Fastify backend in `../backend` to be running for API-backed map and auth flows.

## Project Notes

- Main app routes are under `app/`.
- Shared UI components are in `components/` and `app/components/`.
- Map-specific API clients and view logic are in `app/map/`.
- Test setup is in `test/setup.ts`.

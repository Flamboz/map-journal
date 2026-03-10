# Backend

- Fastify-based API in `backend/`
- Keep API routes and business logic separated
- Use SQLite through `sql.js` for DB access
- Keep route handlers in `backend/src/routes/` focused on HTTP concerns
- Keep business logic in `backend/src/services/`
- Keep DB initialization and migrations in `backend/src/db/`
- Secure endpoints and validate inputs server-side

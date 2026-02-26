# Project Structure

Minimal overview relevant to all contributors:

```
project-root/
├── backend/                  # Fastify backend
│   ├── package.json
│   └── (backend source files)
├── frontend/                 # Next.js + React frontend
│   ├── app/                  # Next.js App Router pages
│   ├── public/               # Static assets
│   └── package.json
├── docs/                     # Expanded agent docs (this folder)
├── .env.example              # Environment variables template
└── AGENTS.md                 # Root agent landing (this file)
```

- Where to look when starting a task: `frontend/` for UI work, `backend/` for API work.
- Top-level build/test scripts are located in each package's `package.json`.

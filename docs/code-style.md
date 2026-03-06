# Code Style

This file contains the stylistic choices that apply repository-wide.

- Indentation: tabs
- Semicolons: keep semicolons
- Max line length: 120 characters
- Max file length: 350 lines (soft cap; refactor before exceeding)
- Use TypeScript strict mode
- Prefer readable, explicit code over micro-optimizations

File size policy:

- Start extraction work when a file is around 300 lines.
- Prefer small, focused modules over large multi-purpose files.
- If a file exceeds 350 lines, split it in the same PR unless there is a documented reason not to.

Naming conventions and small patterns (non-exhaustive):

- Event handlers: `handleX` (e.g., `handleClick`)
- Boolean variables: `is`, `has`, `can` prefixes
- Custom hooks: `use` prefix

When code formatters (Prettier/ESLint) are present prefer their defaults; use this file only for non-automatable preferences.

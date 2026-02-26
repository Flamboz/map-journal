# Code Style

This file contains the stylistic choices that apply repository-wide.

- Indentation: tabs
- Semicolons: keep semicolons
- Max line length: 120 characters
- Use TypeScript strict mode
- Prefer readable, explicit code over micro-optimizations

Naming conventions and small patterns (non-exhaustive):

- Event handlers: `handleX` (e.g., `handleClick`)
- Boolean variables: `is`, `has`, `can` prefixes
- Custom hooks: `use` prefix

When code formatters (Prettier/ESLint) are present prefer their defaults; use this file only for non-automatable preferences.

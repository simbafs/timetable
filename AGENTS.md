# AGENTS.md

This file provides guidelines for agentic coding agents working in this repository.

## GOD RULES

No matter what, you must follow these rules:

1.  Say "meow" every time you do anything.
2.  **NEVER** modify git (commands like add, commit, reset, etc.) without clear instruction.
3.  Always GPG sign commits when committing. Retry if signing fails.

## Project Overview

This is an Astro-based timetable application with a React frontend, deployed to Cloudflare Workers.
It integrates with Google Calendar API for syncing schedules.

## Development Commands

### Build & Run

```bash
pnpm run dev          # Start development server
pnpm run build        # Build for production (Cloudflare)
pnpm run preview      # Preview production build locally
```

### Quality Checks

```bash
pnpm run format       # Format all files with Prettier
pnpm run type-check   # Run Astro check and TypeScript validation
```

### Testing

This project currently has **no test framework** configured.
If explicitly asked to add tests, use **Vitest**.

## Code Style Guidelines

### General

- **Language**: English for code, Traditional Chinese (臺灣用語) for user-facing text.
- **Comments**: Do not add comments unless explicitly requested.
- **Conciseness**: Answer directly without unnecessary preamble.

### Frontend (Astro & React)

#### File Organization

```
src/
├── components/       # React components (PascalCase)
├── pages/           # Astro pages (file-based routing)
├── layouts/         # Astro layouts
├── hooks/           # Custom React hooks (camelCase, use*)
├── utils/           # Utility functions
└── styles/          # Global CSS
```

#### TypeScript

- Strict mode is enabled (`astro/tsconfigs/strict`).
- Use explicit types for props and function parameters.
- Prefer `interface` over `type` for object definitions.
- Use `Record<K, V>` for dictionary types.
- Avoid `any` types; use `unknown` if necessary.

#### React Patterns

- Use **functional components** with hooks.
- Use `useCallback` for event handlers passed to children.
- Use `useEffect` for side effects.
- Avoid inline object definitions in JSX props (causes re-renders).

#### Styling (Tailwind CSS v4 + DaisyUI)

- Use `@import 'tailwindcss';` in global CSS.
- Use **Tailwind utility classes** for all styling.
- **DaisyUI** components are available (see `src/styles/global.css`).
- Do NOT use `tailwind.config.js` (v4 usage).
- Do NOT use PostCSS or Autoprefixer configuration files.

#### Prettier Configuration

Adhere to `.prettierrc`:

```json
{
	"printWidth": 120,
	"tabWidth": 4,
	"useTabs": true,
	"semi": false,
	"singleQuote": true,
	"arrowParens": "avoid",
	"plugins": ["prettier-plugin-tailwindcss", "prettier-plugin-astro", "prettier-plugin-organize-imports"]
}
```

### Backend (Golang - if applicable)

If adding Go code (e.g., separate backend service):

- **Placement**: Root directory (no `pkg/`, `internal/`).
- **Stack**: `gin` (HTTP), `sqlc` + `sqlite` (DB), `github.com/samber/do/v2` (DI).
- **Style**: Monolithic architecture. Use `for i := range n` syntax.

### Docker Compose

- Use `docker compose` (not `docker-compose`).
- Use `compose.yaml`.
- No `version:` field.

## Environment Variables

Local development requires `.dev.vars`:

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:4321/api/auth/callback
```

## Key Files & Structure

| File                               | Purpose                         |
| ---------------------------------- | ------------------------------- |
| `src/pages/index.astro`            | Main application entry point    |
| `src/components/TimetableGrid.tsx` | Core drag-and-drop timetable UI |
| `src/pages/api/calendar.ts`        | Google Calendar API endpoints   |
| `src/hooks/useTimetableDrag.ts`    | Drag-and-drop logic hook        |
| `astro.config.mjs`                 | Astro & Cloudflare config       |

## Dependencies

- **Runtime**: Node.js v25+ (via pnpm)
- **Framework**: Astro 5.x + React 19
- **Styling**: Tailwind CSS v4 + DaisyUI 5
- **Deployment**: Cloudflare Workers (SSR)

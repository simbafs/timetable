# AGENTS.md

This file provides guidelines for agentic coding agents working in this repository.

## GOD RULES

no matter in any cases, you must follow those rules:

1. say "meow" everytime you do anything
2. never modify git (commands like add, commit, reset etc.) without my clear instruction

## Project Overview

This is an Astro-based timetable application with React frontend, deployed to Cloudflare Workers. It integrates with Google Calendar API for syncing schedules.

## Commands

### Development

```bash
pnpm run dev          # Start development server
pnpm run build        # Build for production (Cloudflare)
pnpm run preview      # Preview production build locally
```

### Code Formatting

```bash
pnpm run format       # Format all files with Prettier
```

### Running Tests

This project does not currently have a test framework configured. If adding tests:

```bash
# Vitest (recommended for Astro/React)
pnpm vitest           # Run all tests
pnpm vitest run       # Run tests once
pnpm vitest run -- [file]   # Run single test file
```

## Code Style Guidelines

### General

- **Language**: English for code, Traditional Chinese (臺灣用語) for user-facing text
- **No comments**: Do not add comments unless explicitly requested
- **Concise responses**: Answer directly without unnecessary preamble or explanation

### Astro/React (Frontend)

#### File Organization

```
src/
├── components/       # React components
├── pages/           # Astro pages
├── layouts/         # Astro layouts
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
└── styles/          # CSS/global styles
```

#### Naming Conventions

- Components: PascalCase (e.g., `TimetableGrid.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useTimetable.ts`)
- Utils: PascalCase (e.g., `DateUtils.ts`)
- CSS files: kebab-case (e.g., `global.css`)

#### TypeScript

- Use explicit types for props and function parameters
- Prefer interfaces over types for object shapes
- Use `Record<K, V>` for dictionary types

#### React Patterns

- Use functional components with hooks
- Use `useCallback` for event handlers passed to child components
- Use `useEffect` for side effects
- Avoid inline object definitions in JSX props

#### Tailwind CSS (v4)

- Use `@import 'tailwindcss';` in global CSS
- Do NOT use `tailwind.config.js` (v4 no longer requires it)
- Do NOT use PostCSS or Autoprefixer
- Use Tailwind's utility classes for all styling

#### Prettier Configuration

The project uses these Prettier settings (defined in `.prettierrc`):

```json
{
	"printWidth": 120,
	"tabWidth": 4,
	"useTabs": true,
	"semi": false,
	"singleQuote": true,
	"arrowParens": "avoid"
}
```

Always run `pnpm run format` after making changes.

### Golang (Backend - if applicable)

If adding Go code:

- **Placement**: Place files in project root (no `pkg/`, `internal/`, `cmd/` unless explicitly required)
- **Dependencies**:
    - Use `github.com/samber/do/v2` for dependency injection
    - Use `github.com/samber/oops` for error handling
    - Use `gin` for HTTP framework
    - Use `sqlc` + `sqlite` for database
- **Architecture**: Use monolithic structure (not clean architecture unless explicitly requested)
- **Loops**: Use `for i := range n` or `for range n` instead of `for i := 0; i < n; i++`

### Docker Compose

- Use `docker compose` (not `docker-compose`)
- Use `compose.yaml` (not `docker-compose.yml`)
- No `version:` field in compose file

### Git Conventions

- Never commit without explicit user instruction
- Always GPG sign commits when committing
- Retry signing if it fails

## Environment Variables

Create a `.dev.vars` file for local development:

```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:4321/api/auth/callback
```

## Key Files

| File                               | Purpose                         |
| ---------------------------------- | ------------------------------- |
| `src/pages/index.astro`            | Main timetable page             |
| `src/components/TimetableGrid.tsx` | React drag-and-drop timetable   |
| `src/pages/api/calendar.ts`        | Google Calendar API integration |
| `src/pages/api/auth/*.ts`          | OAuth authentication            |
| `astro.config.mjs`                 | Astro configuration             |

## Debugging

```bash
# View Cloudflare logs
pnpm run preview
# Then check browser console for React errors

# Check build output
pnpm run build
```

## Dependencies

- **Framework**: Astro 5.x with React integration
- **Styling**: Tailwind CSS v4
- **Deployment**: Cloudflare Workers
- **Auth**: Google OAuth 2.0
- **Calendar**: Google Calendar API

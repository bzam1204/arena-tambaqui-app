# Arena Tambaqui App - Project Notes

## Quick start
- Copy `env.example` to `.env` and fill the required values.
- Install dependencies: `npm i`
- Start dev server: `npm run dev` (Vite opens http://localhost:3000)

## Scripts
- `npm run dev` - local dev server
- `npm run build` - production build (outputs to `build/`)
- `npm run preview` - preview the production build

## Environment variables
- `VITE_DATA_BACKEND` - `mock` or `supabase`. If not set, the app defaults to `supabase` and will throw if Supabase vars are missing. For local dev, set `mock` if you do not have Supabase credentials.
- `VITE_SUPABASE_URL` - Supabase project URL (required when using Supabase backend).
- `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` or `VITE_SUPABASE_ANON_KEY` - Supabase public key (required when using Supabase backend).
- `VITE_SUPABASE_STORAGE_BUCKET` - Storage bucket for avatars (defaults to `avatars`).
- `VITE_AUTH_REDIRECT_URL` - Auth redirect base URL (defaults to `window.location.origin`).
- `VITE_API_BASE_URL` - Present in `env.example` but not referenced in the current codebase.

## Tech stack
- Vite + React 18 + TypeScript
- React Router (`createBrowserRouter`) for routing
- TanStack React Query for server state + cache
- Tailwind CSS v4 + custom utilities
- Radix UI primitives + custom UI components
- Supabase JS (optional backend)
- tsyringe for dependency injection
- PWA via `vite-plugin-pwa`

## Project structure
- `src/app` - app features (pages, layouts, hooks, routes, gateways)
- `src/components` - shared UI and feature components
- `src/components/ui` - Radix-based UI primitives
- `src/domain` - domain types/helpers
- `src/infra` - dependency injection, gateway implementations, Supabase client
- `src/styles/globals.css` - global styles + utilities
- `database.sql`, `seed.sql` - DB schema and seed data

## Routing (high-level)
Routes are defined in `src/App.tsx`.
- `/auth` - login
- `/onboarding` - user onboarding
- `/partidas` - matches list
- `/partidas/:id` and `/partidas/:id/chamada` - match checklist
- `/mural/*` - feed and rankings
- `/search` - search
- `/player/:id` - player profile
- `/perfil` - my profile (requires auth)

## Data access + DI
- Gateway interfaces live in `src/app/gateways/*` and expose symbols like `TkAuthGateway`.
- Implementations live in `src/infra/gateways/{mock,supabase}`.
- The container is configured in `src/infra/container.ts` and selects mock vs Supabase based on `VITE_DATA_BACKEND`.
- Use `Inject<T>(token)` from `src/infra/container.ts` to resolve gateways.

## State, errors, and toasts
- Session state is provided by `SessionProvider` in `src/app/context/session-context.tsx`.
- React Query is configured in `src/main.tsx`; global errors surface via Sonner toasts.

## Styling & UI
- Tailwind tokens live in `tailwind.config.ts`.
- Global styles and utilities are in `src/styles/globals.css` (scanline/vignette + tactical utilities).
- Fonts: Chakra Petch (headings), Inter (body), Roboto Mono (mono).

## PWA
- `vite-plugin-pwa` is configured in `vite.config.ts`.
- Service worker registration happens in `src/main.tsx` via `registerSW({ immediate: true })`.

## Conventions for new features
- Add routes/pages under `src/app/pages`.
- Add cross-feature UI to `src/components` or `src/components/ui`.
- Add domain logic to `src/domain`.
- When adding data operations, update the gateway interface and both mock + Supabase implementations.
- Prefer `@/` path alias for imports (configured in `tsconfig.json` and Vite).

## Testing
- No automated tests are configured in the current repo.

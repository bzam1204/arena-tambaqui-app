# Arena Tambaqui App — MVP → Production Prep Plan

## Goal

Turn the current UI-first MVP (everything mocked/in-memory) into a production-ready structure by introducing:

- **Routing** (React Router) instead of view state.
- A **Gateway data layer** to isolate data access (mock now, Supabase later).
- **Dependency Injection** via **tsyringe** so swapping implementations is a container change.
- A shared **reputation rule** (derived, consistent everywhere).

## Current State (today)

- Vite + React (single `App.tsx` driving the whole flow).
- All domain data is mocked inside `src/App.tsx` (`mockPlayerData`, `mockFeedData`) and mutated in-memory.
- No backend integration; “login” is simulated.
- No routing; navigation is handled via local component state.

## Target Route Map (no modal routes)

- `/auth` — register/login (current `MobileRegister` behavior).
- `/onboarding` — profile completion (current `ProfileCompletionStepper`).
- `/mural/feed` — transmissions feed.
- `/mural/rankings` — rankings.
- `/search` — search operators.
- `/perfil` — my profile.
- `/player/:id` — public player profile.

**Guards/redirects**

- Not authenticated → redirect to `/auth`.
- Authenticated but not onboarded → redirect to `/onboarding`.
- Authenticated + onboarded → app routes.

## Reputation Rule

- Range: **0–10**
- Initial/baseline: **6**
- Calculus:
  - Every **5 denúncias** → **-1** reputation
  - Every **5 elogios** → **+1** reputation

Formula:

`reputation = clamp(6 + floor(elogios / 5) - floor(denuncias / 5), 0, 10)`

Reputation should be **derived**, not manually edited.

---

## Implementation Plan (steps)

### 1) Confirm dependencies + approvals ok

- Confirm and install: `react-router-dom`, `tsyringe`, `reflect-metadata`.
- Confirm how we represent session state (mock now; Supabase auth later).

Deliverable: dependencies installed and agreed constraints.

### 2) Repo scaffolding ok

- Add `.gitignore` (at least: `node_modules/`, `build/`, `.env*`, logs, OS files).
- Add `env.example` with:
  - `VITE_SUPABASE_URL=`
  - `VITE_SUPABASE_ANON_KEY=`
  - (optional) `VITE_API_BASE_URL=` if we keep HTTP gateways too.

Deliverable: clean erepo + env template.

### 3) TypeScript + decorators support ok

- Add `tsconfig.json` (paths alias `@/*`, `experimentalDecorators`, etc.).
- Add `src/vite-env.d.ts` if missing.
- Update `vite.config.ts` to enable SWC TS decorators:
  - `react({ tsDecorators: true, ... })`
  - (ensure metadata support used by tsyringe)

Deliverable: DI-ready TypeScript build.

### 4) DI container bootstrap (tsyringe) ok

- Create `src/infra/container.ts`:
  - tokens (symbols) for each gateway
  - `container.register(...)` bindings
  - helper `Inject<T>(token)` similar to your example
- Import `reflect-metadata` and container bootstrap from `src/main.tsx`.

Deliverable: a working DI container and registration pattern.

### 5) Add routing + app layout ok

- Add React Router and define route tree using the route map above.
- Create a shared layout (header + bottom nav) and route guards.
- Replace `currentView` state with navigation (`navigate`, `Link`).

Deliverable: app navigates via URLs and has guarded routes.

### 6) Add domain rule module (reputation)ok

- Create a small, testable function (e.g. `src/domain/reputation.ts`) implementing the formula.
- Update ranking/search/profile displays to use derived reputation.

Deliverable: single source of truth for reputation.

### 7) Define gateway interfaces + tokens

- Create `src/app/gateways/*`:
  - `AuthGateway` (login/logout/session)
  - `ProfileGateway` (complete profile/update profile)
  - `PlayerGateway` (get player, search players, list players)
  - `FeedGateway` (list feed)
  - `TransmissionGateway` (create transmission)

Deliverable: UI depends on interfaces only.

### 8) Implement mock gateways (infra adapters)

- Move `mockPlayerData` / `mockFeedData` out of `src/App.tsx` into `src/infra/gateways/mock/*`.
- Implement CRUD-ish behavior in-memory (same current UX), but behind gateways.
- Compute reputation via the domain function.

Deliverable: same app behavior, but all data access goes through gateways.

### 9) Refactor UI into route pages

- Split `src/App.tsx` into route components/pages.
- Replace direct mock access with injected gateways.
- Keep transmission as a component (not a modal route), opened by state.

Deliverable: clean page structure + gateway-driven UI.

### 10) Supabase skeleton (no full backend implementation)

- Add `src/infra/supabase/client.ts` using env vars.
- Add `src/infra/gateways/supabase/*` stubs implementing the same interfaces.
- Make container choose Mock vs Supabase based on env/config.

Deliverable: ready-to-wire Supabase without rewriting UI.

---

## Notes / Next Decisions

- Confirm the exact authentication approach with Supabase (email/OAuth) and how onboarding completion is stored.
- Confirm anonymity requirements (what is stored, who can see CPF/photo, retention rules).

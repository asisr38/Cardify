# CardVault

Production build. Organize the people you meet — by the rooms where you met them.

## Milestone 1 — what's in the box

- Vite + React 18 + TypeScript + Tailwind
- shadcn/ui primitives (Button, Input, Label) + Sonner toasts
- Supabase client configured (PKCE, session persistence)
- Magic-link email auth (sign-in → email → callback → app)
- Protected routes via `<ProtectedRoute>` + `<AuthProvider>` context
- Warm editorial theme (ink navy / cream / ember orange, Fraunces + Inter)
- Mobile-first shell, safe-area aware, bottom tab nav

## Getting started

1. Copy the env template and fill in your Supabase project details:

   ```bash
   cp .env.example .env
   ```

   - `VITE_SUPABASE_URL` — `https://YOUR-PROJECT.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` — the `anon` / publishable key
   - `VITE_SITE_URL` — `http://localhost:5173` for local dev

2. In the Supabase dashboard:
   - **Authentication → URL Configuration** — add `http://localhost:5173` to Site URL and `http://localhost:5173/auth/callback` to redirect URLs. When you deploy, add your production URL here too.
   - **Authentication → Providers → Email** — make sure Email is enabled and "Confirm email" is on.

3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

4. Visit `http://localhost:5173`, enter your email, click the link that lands in your inbox.

## Scripts

- `npm run dev` — local dev server (host 0.0.0.0, port 5173)
- `npm run build` — type-check + production bundle
- `npm run preview` — preview the production bundle
- `npm run typecheck` — TS only

## Project layout

```
src/
├── main.tsx                    # entry, BrowserRouter
├── App.tsx                     # routes + providers
├── index.css                   # theme tokens (HSL CSS vars) + base styles
├── lib/
│   ├── env.ts                  # env var validation
│   ├── supabase.ts             # Supabase client (PKCE, persistSession)
│   └── utils.ts                # cn() helper
├── hooks/
│   └── use-auth.tsx            # AuthProvider + useAuth (session, signIn, signOut)
├── components/
│   ├── protected-route.tsx     # gate: redirects to /auth/sign-in if no session
│   ├── bottom-nav.tsx          # Events / Contacts / Settings
│   └── ui/
│       ├── button.tsx          # cva variants: default, ember, outline, ghost, …
│       ├── input.tsx
│       ├── label.tsx
│       └── sonner.tsx          # toast portal
└── pages/
    ├── sign-in.tsx             # email → magic link
    ├── auth-callback.tsx       # exchanges PKCE code for session
    ├── home.tsx                # /
    ├── contacts.tsx            # /contacts (placeholder)
    └── settings.tsx            # /settings (account + sign out)
```

## Up next (Milestone 2)

Schema + RLS + CRUD for events, contacts, interactions, email_templates.

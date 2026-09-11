# Falcon Sports

A volleyball match & tournament hosting app. Organise a quick local match or a full
tournament with live-broadcast scoring, or join with a Tournament ID to watch live.

## Tech stack
React + Vite + Tailwind CSS + Supabase (Postgres, Auth, Realtime).

## 1. Set up your environment

```bash
npm install
cp .env.example .env
```

Open `.env` and fill in your Supabase project's URL and anon key
(Supabase dashboard → Project Settings → API):

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Make sure you've already run `falcon-sports-schema.sql` in your Supabase SQL Editor
and enabled Google as an Auth provider (see the setup steps you already completed).

## 2. Run locally

```bash
npm run dev
```

Opens at http://localhost:5173. Google login will only work if
`http://localhost:5173` is added as an Authorized JavaScript origin in your
Google Cloud OAuth client (you already set this up).

## 3. Deploy to GitHub Pages

**Before deploying**, open `vite.config.js` and set `base` to match your repo name
exactly, e.g. if your repo is `github.com/yourname/falcon-sports`:

```js
base: '/falcon-sports/',
```

Then:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/falcon-sports.git
git push -u origin main

npm run deploy
```

`npm run deploy` builds the app and pushes the `dist` folder to a `gh-pages` branch
(via the `gh-pages` package already included). Then in your GitHub repo:
**Settings → Pages → Source → Deploy from branch → `gh-pages` / `root`**.

Your app will be live at `https://YOUR_USERNAME.github.io/falcon-sports/`.

Two things specific to GitHub Pages already handled for you in this project:
- The app uses **HashRouter** instead of BrowserRouter, so routes like
  `#/dashboard` work correctly without needing server-side rewrite rules
  (which GitHub Pages doesn't support for a single-page app).
- Remember to add your live GitHub Pages URL as an **Authorized JavaScript
  origin** in your Google Cloud OAuth client once it's deployed, or Google
  login will fail on the live site.

## Project structure

```
src/
├── lib/supabaseClient.js       # Supabase client init
├── context/AuthContext.jsx     # session + profile + Google sign-in
├── hooks/useLiveMatch.js       # realtime score subscription (+ polling fallback)
├── components/                 # shared UI (TabBar, ScoreBar, ScoreButton, etc.)
└── routes/
    ├── Login.jsx
    ├── Dashboard.jsx
    ├── organise/                # Normal Match + Tournament flows
    └── join/                    # Search by ID + live viewer
```

## Notes
- **Normal Match** scores are local-only (React state) — nothing is written to Supabase.
- **Tournament** matches write to Supabase and broadcast live via Supabase Realtime,
  with an automatic 4-second polling fallback if Realtime isn't available.

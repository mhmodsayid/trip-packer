# Trip Packer

A mobile-friendly web app for coordinating what everyone brings on a trip. Create a trip, share a join link (with PIN), and let participants claim items from a shared packing list — with live updates for everyone.

## Features

- **Create trips** with a name and auto-generated 6-character PIN
- **Join via link** — `/t/<tripId>/join?pin=<PIN>` — no account required, just your name
- **Claim items** — one person per item; unclaim your own assignments
- **Bulk add items** — paste a list, upload Excel/CSV, or quick-add one at a time
- **Filter & search** — All / Unclaimed / Mine tabs plus search
- **Live updates** — Supabase Realtime keeps the list in sync across devices
- **Share link + QR code** — copy the join URL or scan the QR

## Local development

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A [Supabase](https://supabase.com/) project (free tier works)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

This app uses **prefixed tables** (`tp_trips`, `tp_people`, `tp_items`) so it can share a Supabase Postgres instance with other apps (e.g. m3alm_al_aksa) without touching their tables.

1. Use your existing Supabase project (or create a new one).
2. Open **SQL Editor** and run the entire contents of [`supabase/schema.sql`](supabase/schema.sql).
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> **Note:** Apps that use Prisma with `DATABASE_URL` only (no Supabase JS client) still have these API keys in the dashboard — they are just not stored in the repo.

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Build for production

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Push the repo to GitHub (or connect your local project).
2. Import the project in [Vercel](https://vercel.com/new).
3. Add the same environment variables in **Project Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. Vercel detects Next.js automatically.

## How the join link & PIN flow works

1. **Create trip** — Organizer enters a trip name. The app creates a trip row with a random 6-character PIN and shows a shareable link:
   ```
   https://your-app.vercel.app/t/<trip-uuid>/join?pin=ABC123
   ```
2. **Share** — Send the full link (includes both the unguessable trip UUID and PIN).
3. **Join** — Participant opens the link. The app validates the PIN against the trip, asks for a name, creates or reuses a `tp_people` row, and stores `{ id, name }` in `localStorage` keyed by trip ID.
4. **Trip page** — `/t/<tripId>` loads the item list. If no stored person exists, the user is redirected to the join page (they need the full link with PIN again).
5. **Claims** — Anyone on the trip can claim unassigned items. Items assigned to others are visible but not claimable. You can only unclaim your own items.

## Paste list format

One item per line. Supported formats:

| Format | Example |
|--------|---------|
| Plain name | `Tent` |
| Quantity suffix | `Sleeping bag x2` or `Chairs (4)` |
| Category hash | `Headlamp #gear` |
| Comma-separated | `Water, 3, drinks` |
| Tab-separated | `Snacks\t2\tfood` |

## Excel / CSV import

Upload a file with a header row. Column names are case-insensitive:

- **name** (required)
- **quantity** (optional, defaults to 1)
- **category** (optional)

## Security note

This app uses **no user authentication**. Access control relies on the combination of an unguessable trip UUID and a PIN embedded in the join link. Anyone with both can read and modify trip data. This is intentional for lightweight trip coordination — do not use for sensitive data.

## Project structure

```
src/
  app/              # Next.js App Router pages
  components/       # UI components
  lib/              # Supabase client, parsing, storage helpers
  types/            # TypeScript types
supabase/
  schema.sql        # Database schema (run in Supabase SQL editor)
```

## Tech stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) (Postgres + Realtime)
- [SheetJS (xlsx)](https://sheetjs.com/) for spreadsheet import

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

1. Create a dedicated Supabase project for trip-packer.
2. Open **SQL Editor** and run the entire contents of [`supabase/schema.sql`](supabase/schema.sql).
   - Creates `tp_trips`, `tp_people`, and `tp_items`
   - Enables Realtime on `tp_items` and `tp_people`
   - Sets permissive RLS policies for anonymous access (see security note in the SQL file)
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable key** (`sb_publishable_...`) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Legacy projects may use `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead; the app accepts either.

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
ADMIN_PASSWORD=your-strong-password
ADMIN_SESSION_SECRET=random-secret-for-cookie-signing
```

Generate a long random string for each admin secret (e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`).

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
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY` on legacy projects)
   - `ADMIN_PASSWORD`
   - `ADMIN_SESSION_SECRET`
4. Deploy. Vercel detects Next.js automatically.

## Admin

Trip Packer includes a password-protected admin area at [`/admin/login`](http://localhost:3000/admin/login).

### Environment variables (server-only)

| Variable | Description |
|----------|-------------|
| `ADMIN_PASSWORD` | Password for the admin login form (never use `NEXT_PUBLIC_`) |
| `ADMIN_SESSION_SECRET` | Secret used to HMAC-sign the `admin_session` httpOnly cookie |

Set both in `.env.local` for development and in the **Vercel dashboard** for production.

### What admin can do

- View **all trips** with item/people counts, PIN, and created date
- Open any trip to **rename** it, **set or regenerate PIN**, or **delete the entire trip**
- **Edit any item** (name, quantity, category, assignment)
- **Delete any item** regardless of who added it (bypasses the participant creator-only delete rule)

### Security caveat

Participant access uses permissive Supabase RLS with the public publishable key — anyone with a trip link can modify that trip's data directly via the API. The admin area adds a **server-verified session gate** (constant-time password check + signed cookie) so the management UI is not open to casual visitors. It does **not** change Supabase RLS; treat `ADMIN_PASSWORD` as sensitive and rotate it if exposed.

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
  app/              # Next.js App Router pages (including /admin)
  components/       # UI components
  lib/              # Supabase client, parsing, storage, admin auth
  middleware.ts     # Protects /admin routes (signed cookie)
  types/            # TypeScript types
supabase/
  schema.sql        # Database schema (run in Supabase SQL editor)
```

## Tech stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) (Postgres + Realtime)
- [SheetJS (xlsx)](https://sheetjs.com/) for spreadsheet import

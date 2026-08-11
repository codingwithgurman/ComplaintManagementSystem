# CampusDesk — College Complaint Management System

A Next.js (App Router) rebuild of the original static site, backed by **Supabase**
(auth + database + storage) and an **AI Help Desk** powered by **Groq**.

Staff accounts have been removed — every complaint now goes straight to the
admin, who can move it through **Pending → In Progress → Resolved** directly.

## 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** and run, in order:
   - `sql/01_schema.sql` — tables, RLS policies, triggers, storage bucket.
   - `sql/02_seed_data.sql` — the 5 default departments (read the comments
     at the bottom for how to migrate your old demo data and create your
     first admin account).
3. Go to **Project Settings → API** and copy your **Project URL** and
   **anon public key** — you'll need them in step 3 below.

## 2. Get a Groq API key (for the AI Help Desk)

Sign up free at [console.groq.com](https://console.groq.com/keys) and create
an API key.

## 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your Supabase URL/key and Groq key.

## 4. Install and run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## 5. Create your first admin

1. Register a normal account at `/register`.
2. In Supabase's SQL Editor:
   ```sql
   update profiles set role = 'admin' where email = 'you@college.edu';
   ```
3. Log in at `/admin/login` with that same email + password.

## 6. Deploy to Vercel

1. Push this project to a GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Add the same three environment variables from `.env.local` in the
   Vercel project's **Settings → Environment Variables**.
4. Deploy. Vercel auto-detects Next.js — no extra config needed.

## Project structure

```
app/
  page.js                 Home page (marketing)
  login/                  Student login
  register/                Student registration
  dashboard/              Student dashboard
  complaints/             My complaints, complaint details
  complaints/new/         File a new complaint
  track/                  Track a complaint by ID
  notifications/          Notifications
  profile/                Profile + change password
  chatbot/                AI Help Desk (Groq-powered)
  admin/login/            Admin login
  admin/dashboard/        Admin dashboard
  admin/complaints/       Manage all complaints (resolve directly)
  admin/departments/      Manage departments
  api/chat/route.js       Server route that calls the Groq API
  globals.css             Design system (Inter font, ticket-stub theme)
components/               Shared UI (Navbar, Sidebar, Topbar, AppShell...)
lib/                      Supabase client, auth context, data helpers
sql/                      Schema + seed SQL for Supabase
```

## Notes

- **Auth & security**: route access is guarded on the client for UX, but the
  real security boundary is Postgres **Row Level Security** — students can
  only ever see their own complaints; only admins can update/delete any
  complaint. Review `sql/01_schema.sql` before going to production.
- **Images**: complaint photos upload to a public Supabase Storage bucket
  (`complaint-images`), created automatically by the schema script.
- **Fonts**: the whole site uses **Inter**, loaded via `next/font/google`,
  with **IBM Plex Mono** reserved for complaint ticket IDs.

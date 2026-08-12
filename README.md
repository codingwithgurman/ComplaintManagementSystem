# CampusDesk - College Complaint Management System

CampusDesk is a Next.js App Router application for filing, tracking, and resolving college complaints.

- **Authentication:** Firebase Authentication (email/password)
- **Database and image storage:** Supabase Postgres + Storage
- **AI help desk:** Groq

Firebase is the only user/session authority. The Supabase client attaches the current Firebase ID token to data and storage requests, so Supabase Row Level Security still protects each user's records. There are no Supabase Auth SDK calls in the application.

## Setup

Follow [FIREBASE_SUPABASE_SETUP.md](./FIREBASE_SUPABASE_SETUP.md) for the complete Firebase, Supabase, local environment, existing-database migration, admin, and Vercel deployment steps.

After the online services and `.env.local` are configured:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Database scripts

- `sql/01_schema.sql`: fresh Supabase database schema, RLS, triggers, and storage bucket
- `sql/02_seed_data.sql`: default departments and admin notes
- `sql/03_migrate_supabase_auth_to_firebase.sql`: converts an existing CampusDesk schema from Supabase Auth UUIDs to Firebase UIDs

Do not run the migration on a brand-new database created with the current `01_schema.sql`.

## Main project areas

```text
app/                    Pages and API routes
  api/auth/             Secure Firebase-to-Supabase claim setup
  admin/                Admin login and management pages
components/             Shared UI and protected app shell
lib/firebaseClient.js   Browser Firebase initialization
lib/firebaseAdmin.js    Server-only Firebase Admin initialization
lib/firebaseAuth.js     Firebase authentication operations
lib/supabaseClient.js   Supabase data client using Firebase ID tokens
lib/AuthProvider.js     Firebase session/profile context
sql/                    Supabase schema and migrations
```

## Security model

Client-side route redirects improve UX, but Supabase RLS is the data security boundary. Firebase UIDs are read from the verified JWT `sub` claim. Student policies allow access only to their own profile, complaints, notifications, and upload folder; admin access comes from the `profiles.role` value in Supabase.

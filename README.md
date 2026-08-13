# CampusDesk - College Complaint Management System

CampusDesk is a Next.js App Router application for filing, tracking, and resolving college complaints.

- **Authentication:** Supabase email/password authentication
- **Database:** Supabase Postgres with Row Level Security
- **Image storage:** Supabase Storage
- **AI help desk:** Groq

Authentication and data now use the same Supabase session. There is no Firebase SDK, Firebase Admin route, custom-token bridge, or second identity ID to synchronize.

## Setup

Follow [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for the complete online Supabase configuration, database installation/migration, environment variables, admin creation, troubleshooting, and Vercel deployment steps.

After Supabase and `.env.local` are configured:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Database scripts

- `sql/01_schema.sql`: fresh schema, Auth profile trigger, RLS, database triggers, and storage bucket
- `sql/02_seed_data.sql`: default departments and administrator instructions
- `sql/03_migrate_firebase_auth_to_supabase.sql`: one-time migration only for a previously deployed Firebase-oriented database

## Main project areas

```text
app/                    Pages and server routes
components/             Shared UI and protected application shell
lib/supabaseClient.js   Supabase Auth/database/storage client
lib/AuthProvider.js     Supabase session and profile context
lib/data.js             Database and storage helpers
sql/                    Fresh schema, seed data, and migration
```

Client-side redirects improve UX, while Supabase Row Level Security is the data security boundary. Students can access only their own profile, complaints, notifications, and upload folder. Administrators are authorized through the protected `public.profiles.role` column.

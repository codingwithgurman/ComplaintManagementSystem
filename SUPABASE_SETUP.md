# CampusDesk Supabase Setup

CampusDesk uses one backend for simplicity:

- **Supabase Auth** for email/password registration, login, sessions, and password changes.
- **Supabase Postgres** for profiles, departments, complaints, and notifications.
- **Supabase Storage** for complaint images.

Firebase is not required. Complete these steps in order.

## 1. Create the Supabase project

1. Open the [Supabase dashboard](https://supabase.com/dashboard) and create a project.
2. Wait for the project to finish provisioning.
3. Open **Project Settings > API Keys** and copy:
   - Project URL
   - Publishable key (`sb_publishable_...`)

Never put the secret key or `service_role` key in this frontend project.

## 2. Configure email/password authentication

1. Open **Authentication > Sign In / Providers**.
2. Make sure the **Email** provider is enabled.
3. Decide whether **Confirm email** should be enabled:
   - Enabled is recommended for production. New users receive a confirmation email before login.
   - Disabled is convenient while testing locally. New users are signed in immediately.
4. Open **Authentication > URL Configuration**.
5. Set **Site URL** to `http://localhost:3000` while developing.
6. Add `http://localhost:3000/**` to **Redirect URLs**.

After deploying, change Site URL to the production URL and add both of these redirect URLs:

```text
https://your-domain.example/**
https://your-vercel-project.vercel.app/**
```

For production email confirmation, configure a custom SMTP provider under **Project Settings > Authentication > SMTP Settings**. Supabase's default mail service is intended for testing and is rate limited.

## 3. Create the database

Choose one path.

### Fresh database

Open **SQL Editor > New query** and run the complete contents of these files in order:

1. `sql/01_schema.sql`
2. `sql/02_seed_data.sql`

The schema creates:

- Application tables and indexes.
- A trigger that automatically creates `public.profiles` when a Supabase Auth user registers.
- Row Level Security policies based on `auth.uid()`.
- Complaint status and notification triggers.
- The public `complaint-images` storage bucket with authenticated upload rules.

### Database that previously used Firebase Authentication

Back up the database first. Then:

1. In **Authentication > Users**, create or invite a Supabase Auth user for every existing profile email. Firebase passwords cannot be copied, so use temporary passwords or invitations.
2. Run the preflight query documented at the top of `sql/03_migrate_firebase_auth_to_supabase.sql` and confirm it returns zero rows.
3. Run `sql/03_migrate_firebase_auth_to_supabase.sql` once.
4. Run `sql/02_seed_data.sql` (it is safe to re-run).

The migration matches profiles to Supabase Auth users by email, replaces Firebase text UIDs with Supabase UUIDs, relinks complaints and notifications, restores `auth.users` foreign keys, and replaces Firebase-token RLS policies.

Do not run the migration on a fresh database created with the current `01_schema.sql`.

## 4. Configure the local project

From the project directory, create `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

On macOS or Linux:

```bash
cp .env.example .env.local
```

Fill in the Supabase values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
```

If an old `.env` or deployment contains `FIREBASE_*` variables, remove them. The application no longer reads them.

The Groq variables are optional unless the AI Help Desk is used:

```dotenv
GROQ_API_KEY=your-key
GROQ_MODEL=llama-3.1-8b-instant
```

Restart the development server whenever environment variables change.

## 5. Install, run, and verify

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and test in this order:

1. Register at `/register` using an email and password.
2. If confirmation is enabled, open the email link and then log in.
3. Confirm the user exists under **Authentication > Users**.
4. In **Table Editor > profiles**, confirm a row exists with the same UUID.
5. File a complaint and upload an image.
6. Sign out and log in again.
7. Change the password from the Profile page using the current password.

## 6. Create an administrator

1. Register the administrator through `/register` first.
2. In Supabase SQL Editor run:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@college.edu';
```

3. Sign out and log in through `/admin/login` with the same email and password.

Do not place the admin role in user-editable Auth metadata. CampusDesk stores authorization in `public.profiles.role`, protected by RLS.

## 7. Deploy to Vercel

1. Push the project to GitHub.
2. Import it at [Vercel](https://vercel.com/new).
3. Add these variables under **Project Settings > Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `GROQ_API_KEY` and `GROQ_MODEL` if using the chatbot
4. Deploy.
5. In Supabase **Authentication > URL Configuration**, update Site URL and Redirect URLs with the deployed hostname.
6. Register a new test student and verify login, complaints, uploads, notifications, password change, and admin access.

## Troubleshooting

### `Invalid login credentials`

- Verify the email and password.
- If Confirm email is enabled, confirm the email before logging in.
- Confirm that the user appears in **Authentication > Users**.

### User exists but no profile row exists

The profile trigger was not installed. Run `sql/01_schema.sql`. For an existing Auth user missing a profile, either recreate that test user after installing the trigger or insert a matching profile carefully with the same Auth UUID.

### `new row violates row-level security policy`

- Confirm the user is logged in.
- Confirm `profiles.id` exactly matches the UUID under **Authentication > Users**.
- If the project previously used Firebase, run `sql/03_migrate_firebase_auth_to_supabase.sql`.

### Registration reports a database error

- Look for a duplicate roll number in `public.profiles`.
- Re-run the schema to ensure `public.handle_new_user()` and `on_auth_user_created` exist.
- Check **Logs > Postgres Logs** in Supabase for the exact trigger error.

### Confirmation email is not delivered

- Check Auth logs and spam folders.
- Verify Site URL and Redirect URLs.
- Configure custom SMTP for production and review its sending limits.

### Image upload is denied

- Confirm the `complaint-images` bucket exists.
- Re-run the storage section of `sql/01_schema.sql`.
- Confirm the upload folder begins with the signed-in user's UUID.

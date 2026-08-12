# CampusDesk Firebase + Supabase Setup

This guide configures Firebase as the **only authentication provider** while keeping Supabase for the database and complaint image storage. Complete the steps in order.

## 1. Create and configure Firebase

1. Open the [Firebase console](https://console.firebase.google.com/) and create a project.
2. In **Project overview**, choose **Add app > Web** and register the web app.
3. Keep the displayed Firebase configuration open; its values go into `.env.local` in step 4.
4. Open **Build > Authentication > Get started > Sign-in method**.
5. Enable **Email/Password** (the first option). The passwordless email-link option is not required.
6. Open **Authentication > Settings > Authorized domains** and add:
   - `localhost` for local development.
   - Your production hostname after deployment, for example `campusdesk.vercel.app`.

### Create server credentials for the claim bridge

Supabase requires Firebase ID tokens to contain `role: authenticated`. CampusDesk adds this fixed claim through a server-only API route after registration/login.

1. In Firebase, open **Project settings > Service accounts**.
2. Choose **Generate new private key**, confirm, and download the JSON file.
3. Copy these JSON fields for step 4:
   - `project_id` -> `FIREBASE_ADMIN_PROJECT_ID`
   - `client_email` -> `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `private_key` -> `FIREBASE_ADMIN_PRIVATE_KEY`
4. Keep the JSON private. Never commit it, place it in `public/`, or use `NEXT_PUBLIC_` for these three variables.

## 2. Configure Supabase for Firebase identities

1. Create or open a project in the [Supabase dashboard](https://supabase.com/dashboard).
2. Open **Authentication > Third-Party Auth**.
3. Add a **Firebase** integration and enter the exact Firebase **Project ID** from step 1.
4. Save the integration. Supabase will now verify Firebase ID tokens sent by this app.
5. Open **Project Settings > API** and copy:
   - Project URL -> `NEXT_PUBLIC_SUPABASE_URL`
   - Publishable key -> `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Do not configure Supabase email/password login for this app. Supabase Auth may still appear in the dashboard because the platform cannot disable that product, but CampusDesk does not call it or create Supabase Auth sessions.

## 3. Install or migrate the Supabase database

Choose exactly one path.

### New Supabase project

In **SQL Editor**, run these files in order:

1. `sql/01_schema.sql`
2. `sql/02_seed_data.sql`

Do not run `03_migrate_supabase_auth_to_firebase.sql` on a fresh schema.

### Existing CampusDesk Supabase project

If the old `01_schema.sql` was already installed, back up the database and then run:

1. `sql/03_migrate_supabase_auth_to_firebase.sql`
2. `sql/02_seed_data.sql` (safe to re-run)

The migration changes user ID columns from UUID to text, removes the foreign key to `auth.users`, and updates every RLS policy to compare the verified Firebase JWT `sub` claim. It preserves existing application rows.

Existing Supabase Auth passwords do not automatically move to Firebase. For each existing account:

1. In **Firebase Authentication > Users**, create the user with the same email and a temporary password.
2. Copy the new Firebase UID.
3. In Supabase SQL Editor run:

```sql
update profiles
set id = 'PASTE_FIREBASE_UID_HERE'
where email = 'student@college.edu';
```

Complaints and notifications follow automatically through cascading foreign keys. The user can log in with the temporary password and change it on the Profile page.

## 4. Configure local environment variables

From the project folder, create `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

On macOS/Linux use `cp .env.example .env.local`.

Fill every Firebase and Supabase value. Copy the six `NEXT_PUBLIC_FIREBASE_*` values from **Firebase Project settings > General > Your apps > SDK setup and configuration**.

For the Admin private key, keep it on one line with literal `\n` separators:

```dotenv
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

The Groq values are needed only for the AI help desk:

```dotenv
GROQ_API_KEY=your-key
GROQ_MODEL=llama-3.1-8b-instant
```

Restart `npm run dev` whenever `.env.local` changes.

## 5. Run and verify locally

```bash
npm install
npm run dev
```

Test in this order:

1. Register at `http://localhost:3000/register`.
2. Confirm the user appears in **Firebase Authentication > Users**.
3. Confirm the same UID appears in the Supabase `profiles.id` column.
4. File a complaint and confirm it appears in Supabase `complaints`.
5. Sign out and sign back in. Test **Remember me** both selected and cleared.
6. Change the password from the Profile page using the current password.

If registration creates neither a Firebase user nor a Supabase profile, inspect the terminal running Next.js. The most common causes are missing Firebase Admin variables or a Firebase Project ID mismatch in Supabase Third-Party Auth.

## 6. Create the first administrator

1. Register the account normally through `/register` so Firebase and Supabase use the same UID.
2. In Supabase SQL Editor run:

```sql
update profiles
set role = 'admin'
where email = 'admin@college.edu';
```

3. Sign out and use `/admin/login` with the same Firebase email and password.

The Firebase custom claim remains `role: authenticated`; the application's student/admin authorization remains in `profiles.role`. These are intentionally separate.

## 7. Deploy on Vercel

1. Push the project to a private or public Git repository.
2. Import it at [Vercel](https://vercel.com/new).
3. In **Project Settings > Environment Variables**, add every variable from `.env.local` for Production (and Preview if desired).
4. Paste `FIREBASE_ADMIN_PRIVATE_KEY` as the full key. Vercel accepts multiline values; the application also supports the one-line `\n` form.
5. Deploy.
6. Copy the deployed hostname and add it to **Firebase Authentication > Settings > Authorized domains**.
7. Register a test student and verify profile, complaint, image upload, sign-out, sign-in, and admin access.

Never add a Supabase service-role key or Firebase Admin private key to a `NEXT_PUBLIC_` variable. Only Firebase Web App configuration and the Supabase publishable key belong in browser-visible variables.

## Troubleshooting

### `Authentication setup is incomplete on the server`

Check all three `FIREBASE_ADMIN_*` values. Ensure the service-account Project ID is the same Firebase project used by the browser app.

### Supabase returns `401`, `permission denied`, or an RLS error

- Confirm the Firebase integration exists under Supabase **Third-Party Auth**.
- Confirm its Project ID exactly matches `NEXT_PUBLIC_FIREBASE_PROJECT_ID`.
- Existing databases must run `03_migrate_supabase_auth_to_firebase.sql`.
- Sign out and back in to force a fresh Firebase ID token containing `role: authenticated`.

### `invalid input syntax for type uuid`

The old UUID schema is still active. Run `sql/03_migrate_supabase_auth_to_firebase.sql`.

### Firebase rejects the domain

Add the exact hostname (without `https://` or a path) under Firebase Authentication **Authorized domains**.

### An account can log in but has no profile

For a migrated account, update `profiles.id` to its Firebase UID using the SQL in step 3. For a new account, register through the application rather than creating it only in the Firebase console.

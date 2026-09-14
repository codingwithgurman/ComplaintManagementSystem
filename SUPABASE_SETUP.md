# CampusDesk Supabase Database & Storage Setup

CampusDesk uses **Supabase** as its cloud database and file storage engine:

- **Supabase Postgres**: Stores student/admin profiles, departments, complaints, and status notifications.
- **Supabase Storage**: Stores complaint attachment photos in the `complaint-images` bucket.
- **Local Authentication**: Handled directly by the application using secure password hashing and signed session cookies (no external GoTrue or email confirmation dependencies).

---

## 1. Create a Supabase Project

1. Go to the [Supabase Dashboard](https://supabase.com/dashboard) and click **New Project**.
2. Give your project a name (e.g. `campusdesk`) and set a strong database password.
3. Choose a region close to you and wait for the project to provision.

---

## 2. Obtain Your API Keys

1. In your project dashboard, navigate to **Project Settings** > **API Keys**.
2. Copy the following values:
   - **Project URL** (e.g., `https://xyzcompany.supabase.co`)
   - **anon / public key** or **publishable key** (`sb_publishable_...` or JWT anon key)

---

## 3. Run the Database Schema & Seed Data

1. In your Supabase dashboard, click on **SQL Editor** from the left sidebar.
2. Click **New query**.
3. Open `sql/01_schema.sql` from this repository, copy its entire contents, paste it into the SQL editor, and click **Run**.
   - This creates the `profiles`, `departments`, `complaints`, and `notifications` tables.
   - It sets up automatic `updated_at` triggers and status change notification triggers.
   - It creates the `complaint-images` storage bucket.
4. Click **New query** again.
5. Open `sql/02_seed_data.sql`, paste its contents, and click **Run**.
   - This seeds the standard campus departments (Computer Science, Hostel, Library, IT Support, Accounts).

---

## 4. Set Up Environment Variables

In your project root directory, create a `.env.local` file by copying the example:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-or-anon-key
SESSION_SECRET=a-secure-random-32-character-secret-key

# Optional (for AI Help Desk):
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=llama-3.1-8b-instant
```

---

## 5. Create an Administrator Account

1. Start the application locally:
   ```bash
   npm run dev
   ```
2. Navigate to `http://localhost:3000/register` and register a new account (e.g. with email `admin@college.edu`).
3. Open the Supabase **SQL Editor** and promote that account to an administrator:
   ```sql
   update public.profiles
   set role = 'admin'
   where email = 'admin@college.edu';
   ```
4. Now log out and log in via `http://localhost:3000/admin/login` using your admin credentials!

---

## 6. Verification Checklist

- [x] Student registration works at `/register` and logs in directly.
- [x] Profile details are visible at `/profile`.
- [x] Filing a complaint at `/complaints/new` successfully uploads attachments to the Supabase `complaint-images` bucket.
- [x] Admin dashboard displays open complaints and department analytics.
- [x] Changing complaint status automatically adds a student notification row in Supabase.

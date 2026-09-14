-- =========================================================
-- CampusDesk seed data
-- Run after 01_schema.sql. Safe to re-run.
-- =========================================================

-- ---------- default departments ----------
insert into public.departments (name, head) values
  ('Computer Science', 'Dr. A. Mehta'),
  ('Hostel & Warden Office', 'Mr. R. Singh'),
  ('Library', 'Ms. P. Kaur'),
  ('IT Support', 'Mr. S. Verma'),
  ('Accounts', 'Mrs. N. Sharma')
on conflict (name) do nothing;

-- ---------- administrator setup ----------
-- To create your first administrator:
-- 1. Register an account through the app at http://localhost:3000/register
--    (e.g., email: admin@college.edu, password: YourSecurePassword123!)
-- 2. In Supabase SQL Editor, run:
--
-- update public.profiles
-- set role = 'admin'
-- where email = 'admin@college.edu';
--
-- 3. Now log in via http://localhost:3000/admin/login with those credentials.

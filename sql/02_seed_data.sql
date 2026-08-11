-- =========================================================
-- CampusDesk — seed data
-- Run AFTER 01_schema.sql. Safe to re-run (uses ON CONFLICT).
-- =========================================================

-- ---------- Departments (same 5 as the original local version) ----------
insert into departments (name, head) values
  ('Computer Science', 'Dr. A. Mehta'),
  ('Hostel & Warden Office', 'Mr. R. Singh'),
  ('Library', 'Ms. P. Kaur'),
  ('IT Support', 'Mr. S. Verma'),
  ('Accounts', 'Mrs. N. Sharma')
on conflict (name) do nothing;

-- =========================================================
-- Migrating your OLD localStorage demo data (optional)
-- =========================================================
-- Complaints and profiles can't be seeded directly with plain SQL,
-- because every complaint must belong to a real Supabase Auth user
-- (student_id references auth.users). Auth users can only be created
-- through Supabase Auth (sign-up), not a plain INSERT statement.
--
-- To migrate your old demo data:
--
-- 1. Register real accounts through the app's /register page
--    (this creates both an auth.users row and a matching profiles row).
--
-- 2. Then run inserts like the example below, replacing
--    'STUDENT_UUID_HERE' with that user's id from:
--      select id, email from auth.users;
--
-- Example — recreating the old demo complaints for one student:
--
-- insert into complaints (title, category, department, priority, description, status, remarks, student_id, student_name, student_roll)
-- values
--   ('Wi-Fi not working in Block C', 'Wi-Fi / Network', 'IT Support', 'High',
--    'Wi-Fi has been down in Block C hostel rooms for 3 days, affecting online classes.',
--    'In Progress', 'Router being replaced by vendor, ETA 2 days.',
--    'STUDENT_UUID_HERE', 'Aarav Sharma', 'CS21045'),
--
--   ('Library book renewal not reflecting', 'Library', 'Library', 'Low',
--    'Renewed book online but the due date still shows the old date on my account.',
--    'Resolved', 'Fixed — system sync issue resolved.',
--    'STUDENT_UUID_HERE', 'Aarav Sharma', 'CS21045'),
--
--   ('Mess food quality complaint', 'Canteen', 'Hostel & Warden Office', 'Medium',
--    'Food quality in the evening mess has declined over the past week.',
--    'Pending', '', 'STUDENT_UUID_HERE', 'Aarav Sharma', 'CS21045');

-- =========================================================
-- Creating your first admin account
-- =========================================================
-- 1. Register normally through /register (this always creates a 'student' profile).
-- 2. In the SQL Editor, promote that account to admin:
--
-- update profiles set role = 'admin' where email = 'admin@college.edu';
--
-- They can now log in from /admin/login using the same email + password.

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
-- because every complaint should belong to a real Firebase Authentication
-- user whose Firebase UID matches the profile ID stored in Supabase.
--
-- To migrate your old demo data:
--
-- 1. Register real accounts through the app's /register page
--    (this creates a Firebase Auth user and a matching Supabase profile row).
--
-- 2. Then run inserts like the example below, replacing
--    'FIREBASE_UID_HERE' with that user's UID from the Firebase console.
--
-- Example — recreating the old demo complaints for one student:
--
-- insert into complaints (title, category, department, priority, description, status, remarks, student_id, student_name, student_roll)
-- values
--   ('Wi-Fi not working in Block C', 'Wi-Fi / Network', 'IT Support', 'High',
--    'Wi-Fi has been down in Block C hostel rooms for 3 days, affecting online classes.',
--    'In Progress', 'Router being replaced by vendor, ETA 2 days.',
--    'FIREBASE_UID_HERE', 'Aarav Sharma', 'CS21045'),
--
--   ('Library book renewal not reflecting', 'Library', 'Library', 'Low',
--    'Renewed book online but the due date still shows the old date on my account.',
--    'Resolved', 'Fixed — system sync issue resolved.',
--    'FIREBASE_UID_HERE', 'Aarav Sharma', 'CS21045'),
--
--   ('Mess food quality complaint', 'Canteen', 'Hostel & Warden Office', 'Medium',
--    'Food quality in the evening mess has declined over the past week.',
--    'Pending', '', 'FIREBASE_UID_HERE', 'Aarav Sharma', 'CS21045');

-- =========================================================
-- Creating your first admin account
-- =========================================================
-- 1. Register normally through /register (this always creates a 'student' profile).
-- 2. In the SQL Editor, promote that account to admin:
--
-- update profiles set role = 'admin' where email = 'admin@college.edu';
--
-- They can now log in from /admin/login using the same email + password.

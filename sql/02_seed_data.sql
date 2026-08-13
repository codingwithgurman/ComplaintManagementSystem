-- =========================================================
-- CampusDesk seed data
-- Run after 01_schema.sql. Safe to re-run.
-- =========================================================

insert into public.departments (name, head) values
  ('Computer Science', 'Dr. A. Mehta'),
  ('Hostel & Warden Office', 'Mr. R. Singh'),
  ('Library', 'Ms. P. Kaur'),
  ('IT Support', 'Mr. S. Verma'),
  ('Accounts', 'Mrs. N. Sharma')
on conflict (name) do nothing;

-- Create users through /register so Supabase Auth and public.profiles receive
-- the same UUID. To make the first administrator, register normally and run:
--
-- update public.profiles
-- set role = 'admin'
-- where email = 'admin@college.edu';

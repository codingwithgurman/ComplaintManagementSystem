-- =========================================================
-- CampusDesk - Supabase Database Schema (Local Authentication)
-- Run once in Supabase Dashboard > SQL Editor > New query.
-- =========================================================

-- Enable pgcrypto extension for UUID generation
create extension if not exists "pgcrypto";

-- ---------- profiles ----------
-- Stores student and administrator accounts managed by local authentication.
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  role text not null default 'student' check (role in ('student','admin')),
  name text not null,
  roll text unique,
  email text not null unique,
  password_hash text not null,
  phone text,
  department text,
  course text,
  semester text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles(lower(email));
create index if not exists profiles_roll_idx on public.profiles(roll);

-- ---------- departments ----------
create table if not exists public.departments (
  id bigserial primary key,
  name text not null unique,
  head text not null,
  created_at timestamptz not null default now()
);

-- ---------- complaints ----------
create table if not exists public.complaints (
  id bigserial primary key,
  title text not null,
  category text not null,
  department text not null,
  priority text not null default 'Medium' check (priority in ('Low','Medium','High')),
  description text not null,
  image_url text,
  status text not null default 'Pending' check (status in ('Pending','In Progress','Resolved')),
  remarks text default '',
  student_id uuid not null references public.profiles(id) on update cascade on delete cascade,
  student_name text not null,
  student_roll text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists complaints_student_id_idx on public.complaints(student_id);
create index if not exists complaints_status_idx on public.complaints(status);
create index if not exists complaints_department_idx on public.complaints(department);

-- ---------- notifications ----------
create table if not exists public.notifications (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on update cascade on delete cascade,
  text text not null,
  type text not null default 'info',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications(user_id);

-- ---------- triggers & automation ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists complaints_set_updated_at on public.complaints;
create trigger complaints_set_updated_at
before update on public.complaints
for each row execute function public.set_updated_at();

create or replace function public.notify_on_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.notifications (user_id, text, type)
    values (
      new.student_id,
      'Complaint C' || (100 + new.id) || ' status updated to ' || new.status || '.',
      case when new.status = 'Resolved' then 'resolved' else 'assigned' end
    );
  end if;
  return new;
end;
$$;

drop trigger if exists complaints_notify_status on public.complaints;
create trigger complaints_notify_status
after update on public.complaints
for each row execute function public.notify_on_status_change();

-- =========================================================
-- Permissions & Policies
-- Authentication and session checks are handled by the application.
-- Enable policies for anonymous/public access via Supabase client.
-- =========================================================

alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.complaints enable row level security;
alter table public.notifications enable row level security;

-- Profiles policies
drop policy if exists "allow_all_profiles_read" on public.profiles;
create policy "allow_all_profiles_read" on public.profiles
  for select to anon, authenticated using (true);

drop policy if exists "allow_all_profiles_insert" on public.profiles;
create policy "allow_all_profiles_insert" on public.profiles
  for insert to anon, authenticated with check (true);

drop policy if exists "allow_all_profiles_update" on public.profiles;
create policy "allow_all_profiles_update" on public.profiles
  for update to anon, authenticated using (true) with check (true);

-- Departments policies
drop policy if exists "allow_all_departments" on public.departments;
create policy "allow_all_departments" on public.departments
  for all to anon, authenticated using (true) with check (true);

-- Complaints policies
drop policy if exists "allow_all_complaints" on public.complaints;
create policy "allow_all_complaints" on public.complaints
  for all to anon, authenticated using (true) with check (true);

-- Notifications policies
drop policy if exists "allow_all_notifications" on public.notifications;
create policy "allow_all_notifications" on public.notifications
  for all to anon, authenticated using (true) with check (true);

-- =========================================================
-- Storage bucket for complaint images
-- =========================================================

insert into storage.buckets (id, name, public)
values ('complaint-images', 'complaint-images', true)
on conflict (id) do update set public = true;

drop policy if exists "complaint images: public read" on storage.objects;
create policy "complaint images: public read"
  on storage.objects for select to public
  using (bucket_id = 'complaint-images');

drop policy if exists "complaint images: public upload" on storage.objects;
create policy "complaint images: public upload"
  on storage.objects for insert to public
  with check (bucket_id = 'complaint-images');

drop policy if exists "complaint images: public update" on storage.objects;
create policy "complaint images: public update"
  on storage.objects for update to public
  using (bucket_id = 'complaint-images');

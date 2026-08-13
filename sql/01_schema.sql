-- =========================================================
-- CampusDesk - Supabase Auth, database, and storage schema
-- Run once in Supabase Dashboard > SQL Editor > New query.
-- =========================================================

-- ---------- profiles ----------
-- One row per Supabase Auth user.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on update cascade on delete cascade,
  role text not null default 'student' check (role in ('student','admin')),
  name text not null,
  roll text unique,
  email text not null,
  phone text,
  department text,
  course text,
  semester text,
  created_at timestamptz not null default now()
);

-- Create the app profile in the same transaction as Auth registration. This
-- also works when email confirmation is enabled and signUp returns no session.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id, role, name, roll, email, phone, department, course, semester
  )
  values (
    new.id,
    'student',
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
    nullif(upper(new.raw_user_meta_data->>'roll'), ''),
    new.email,
    nullif(new.raw_user_meta_data->>'phone', ''),
    nullif(new.raw_user_meta_data->>'department', ''),
    nullif(new.raw_user_meta_data->>'course', ''),
    nullif(new.raw_user_meta_data->>'semester', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

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

-- ---------- complaint automation ----------
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
-- Row Level Security
-- =========================================================

alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.complaints enable row level security;
alter table public.notifications enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- ---------- profile policies ----------
drop policy if exists "profiles: view own or admin" on public.profiles;
create policy "profiles: view own or admin"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id or public.is_admin());

drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id and role = 'student');

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check (
    (select auth.uid()) = id
    and (role = 'student' or public.is_admin())
  );

-- ---------- department policies ----------
drop policy if exists "departments: read by any signed-in user" on public.departments;
create policy "departments: read by any signed-in user"
  on public.departments for select to authenticated
  using (true);

drop policy if exists "departments: admin manages" on public.departments;
create policy "departments: admin manages"
  on public.departments for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- complaint policies ----------
drop policy if exists "complaints: student views own or admin views all" on public.complaints;
create policy "complaints: student views own or admin views all"
  on public.complaints for select to authenticated
  using (student_id = (select auth.uid()) or public.is_admin());

drop policy if exists "complaints: student inserts own" on public.complaints;
create policy "complaints: student inserts own"
  on public.complaints for insert to authenticated
  with check (student_id = (select auth.uid()));

drop policy if exists "complaints: admin updates any" on public.complaints;
create policy "complaints: admin updates any"
  on public.complaints for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "complaints: admin deletes any" on public.complaints;
create policy "complaints: admin deletes any"
  on public.complaints for delete to authenticated
  using (public.is_admin());

-- ---------- notification policies ----------
drop policy if exists "notifications: user views own" on public.notifications;
create policy "notifications: user views own"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "notifications: user updates own (mark read)" on public.notifications;
create policy "notifications: user updates own (mark read)"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "notifications: any signed-in user can insert" on public.notifications;
create policy "notifications: any signed-in user can insert"
  on public.notifications for insert to authenticated
  with check (user_id = (select auth.uid()) or public.is_admin());

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

drop policy if exists "complaint images: authenticated upload" on storage.objects;
create policy "complaint images: authenticated upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'complaint-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

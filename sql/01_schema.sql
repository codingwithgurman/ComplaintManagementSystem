-- =========================================================
-- CampusDesk — Supabase schema
-- Run this once in: Supabase Dashboard → SQL Editor → New query
-- =========================================================

-- ---------- profiles ----------
-- One row per Firebase Authentication user. Firebase UIDs are text strings.
create table if not exists profiles (
  id text primary key,
  role text not null default 'student' check (role in ('student','admin')),
  name text not null,
  roll text unique,                 -- roll number, only used by students
  email text not null,
  phone text,
  department text,
  course text,
  semester text,
  created_at timestamptz not null default now()
);

-- ---------- departments ----------
create table if not exists departments (
  id bigserial primary key,
  name text not null unique,
  head text not null,
  created_at timestamptz not null default now()
);

-- ---------- complaints ----------
create table if not exists complaints (
  id bigserial primary key,
  title text not null,
  category text not null,
  department text not null,
  priority text not null default 'Medium' check (priority in ('Low','Medium','High')),
  description text not null,
  image_url text,
  status text not null default 'Pending' check (status in ('Pending','In Progress','Resolved')),
  remarks text default '',
  student_id text not null references profiles(id) on update cascade on delete cascade,
  student_name text not null,
  student_roll text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists complaints_student_id_idx on complaints(student_id);
create index if not exists complaints_status_idx on complaints(status);
create index if not exists complaints_department_idx on complaints(department);

-- ---------- notifications ----------
create table if not exists notifications (
  id bigserial primary key,
  user_id text not null references profiles(id) on update cascade on delete cascade,
  text text not null,
  type text not null default 'info',   -- 'info' | 'assigned' | 'resolved'
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on notifications(user_id);

-- ---------- keep updated_at fresh on complaints ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists complaints_set_updated_at on complaints;
create trigger complaints_set_updated_at
before update on complaints
for each row execute function public.set_updated_at();

-- ---------- notify student whenever a complaint's status changes ----------
create or replace function public.notify_on_status_change()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    insert into notifications (user_id, text, type)
    values (
      new.student_id,
      'Complaint C' || (100 + new.id) || ' status updated to ' || new.status || '.',
      case when new.status = 'Resolved' then 'resolved' else 'assigned' end
    );
  end if;
  return new;
end;
$$;

drop trigger if exists complaints_notify_status on complaints;
create trigger complaints_notify_status
after update on complaints
for each row execute function public.notify_on_status_change();

-- =========================================================
-- Row Level Security
-- =========================================================

alter table profiles enable row level security;
alter table departments enable row level security;
alter table complaints enable row level security;
alter table notifications enable row level security;

-- Firebase puts its UID in the JWT subject (`sub`). Do not use auth.uid()
-- because Supabase's helper casts the subject to UUID.
create or replace function public.request_user_id()
returns text
language sql
stable
as $$
  select nullif(auth.jwt()->>'sub', '');
$$;

-- Helper: is the current user an admin? (security definer avoids recursive RLS)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = public.request_user_id() and role = 'admin'
  );
$$;

-- ---------- profiles policies ----------
drop policy if exists "profiles: view own or admin" on profiles;
create policy "profiles: view own or admin"
  on profiles for select to authenticated
  using (public.request_user_id() = id or public.is_admin());

drop policy if exists "profiles: insert own" on profiles;
create policy "profiles: insert own"
  on profiles for insert to authenticated
  with check (public.request_user_id() = id and role = 'student');

drop policy if exists "profiles: update own" on profiles;
create policy "profiles: update own"
  on profiles for update to authenticated
  using (public.request_user_id() = id)
  with check (
    public.request_user_id() = id
    and (role = 'student' or public.is_admin())
  );

-- ---------- departments policies ----------
drop policy if exists "departments: read by any signed-in user" on departments;
create policy "departments: read by any signed-in user"
  on departments for select to authenticated
  using (true);

drop policy if exists "departments: admin manages" on departments;
create policy "departments: admin manages"
  on departments for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- complaints policies ----------
drop policy if exists "complaints: student views own or admin views all" on complaints;
create policy "complaints: student views own or admin views all"
  on complaints for select to authenticated
  using (student_id = public.request_user_id() or public.is_admin());

drop policy if exists "complaints: student inserts own" on complaints;
create policy "complaints: student inserts own"
  on complaints for insert to authenticated
  with check (student_id = public.request_user_id());

drop policy if exists "complaints: admin updates any" on complaints;
create policy "complaints: admin updates any"
  on complaints for update to authenticated
  using (public.is_admin());

drop policy if exists "complaints: admin deletes any" on complaints;
create policy "complaints: admin deletes any"
  on complaints for delete to authenticated
  using (public.is_admin());

-- ---------- notifications policies ----------
drop policy if exists "notifications: user views own" on notifications;
create policy "notifications: user views own"
  on notifications for select to authenticated
  using (user_id = public.request_user_id());

drop policy if exists "notifications: user updates own (mark read)" on notifications;
create policy "notifications: user updates own (mark read)"
  on notifications for update to authenticated
  using (user_id = public.request_user_id());

drop policy if exists "notifications: any signed-in user can insert" on notifications;
create policy "notifications: any signed-in user can insert"
  on notifications for insert to authenticated
  with check (user_id = public.request_user_id() or public.is_admin());

-- =========================================================
-- Storage bucket for complaint attachment images
-- =========================================================
insert into storage.buckets (id, name, public)
values ('complaint-images', 'complaint-images', true)
on conflict (id) do nothing;

drop policy if exists "complaint images: public read" on storage.objects;
create policy "complaint images: public read"
  on storage.objects for select
  using (bucket_id = 'complaint-images');

drop policy if exists "complaint images: authenticated upload" on storage.objects;
create policy "complaint images: authenticated upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'complaint-images'
    and (storage.foldername(name))[1] = public.request_user_id()
  );

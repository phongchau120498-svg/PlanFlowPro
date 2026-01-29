-- Tạo bảng Hạng mục
create table public.categories (
  id text not null primary key,
  title text,
  color jsonb,
  collapsed boolean default false,
  position integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tạo bảng Công việc
create table public.tasks (
  id text not null primary key,
  title text not null,
  description text,
  date text,
  time text,
  is_completed boolean default false,
  category_id text references public.categories(id) on delete cascade,
  repeat text default 'none',
  series_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bật bảo mật (Bắt buộc để Supabase cho phép đọc/ghi từ web)
alter table public.categories enable row level security;
alter table public.tasks enable row level security;
create policy "Enable access to all users" on public.categories for all using (true);
create policy "Enable access to all users" on public.tasks for all using (true);
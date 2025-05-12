create table if not exists practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) not null,
  page_id text not null,
  file_name text not null,
  started_at timestamp with time zone not null,
  duration_seconds integer not null,
  created_at timestamp with time zone default now()
);
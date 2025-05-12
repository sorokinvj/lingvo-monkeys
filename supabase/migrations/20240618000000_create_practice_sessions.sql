-- Создаем таблицу practice_sessions
create table if not exists practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references "User" (id) not null,
  page_id text not null,
  file_name text not null,
  started_at timestamp with time zone not null,
  duration_seconds integer not null,
  created_at timestamp with time zone default now()
);

-- Добавляем политики безопасности
alter table practice_sessions enable row level security;

-- Политика для вставки данных
create policy "Users can insert their own practice sessions"
  on practice_sessions for insert
  with check (user_id IN (
    SELECT id FROM "User" WHERE id = auth.uid()
  ));

-- Политика для чтения данных  
create policy "Users can view their own practice sessions"
  on practice_sessions for select
  using (user_id IN (
    SELECT id FROM "User" WHERE id = auth.uid()
  ));

-- Политика для сервисной роли
create policy "Service role can manage all practice sessions"
  on practice_sessions for all
  to service_role
  using (true);

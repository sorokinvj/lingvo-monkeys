-- Миграция для восстановления таблицы FileListeningEvent с дополнительным полем totalPlaybackTimeMs

-- 1. Создаем таблицу для отслеживания прослушивания файлов
CREATE TABLE IF NOT EXISTS "FileListeningEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "fileId" UUID NOT NULL REFERENCES "File"("id") ON DELETE CASCADE,
  "startTime" TIMESTAMP WITH TIME ZONE,
  "endTime" TIMESTAMP WITH TIME ZONE,
  "durationSeconds" INTEGER,
  "totalPlaybackTimeMs" INTEGER, -- Новое поле для хранения точного времени прослушивания в миллисекундах
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Создаем индексы для оптимизации запросов
CREATE INDEX file_listening_user_idx ON "FileListeningEvent" ("userId");
CREATE INDEX file_listening_file_idx ON "FileListeningEvent" ("fileId");
CREATE INDEX file_listening_created_idx ON "FileListeningEvent" ("createdAt");

-- 3. Включаем Row Level Security
ALTER TABLE "FileListeningEvent" ENABLE ROW LEVEL SECURITY;

-- 4. Создаем политики безопасности
-- Пользователи могут видеть только свои данные
CREATE POLICY "Users can view only their own listening events"
ON "FileListeningEvent" FOR SELECT
USING (auth.uid() = "userId");

-- Аутентифицированные пользователи могут вставлять события
CREATE POLICY "Authenticated users can insert listening events"
ON "FileListeningEvent" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = "userId");

-- Сервисная роль может читать и вставлять любые события
CREATE POLICY "Service role can read any listening events"
ON "FileListeningEvent" FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Service role can insert any listening events"
ON "FileListeningEvent" FOR INSERT
TO service_role
WITH CHECK (true);

-- 5. Обновляем функцию для получения всех данных аудита пользователя
CREATE OR REPLACE FUNCTION get_user_audit_events(user_id UUID, limit_per_table INT DEFAULT 100)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'upload_events', (
      SELECT coalesce(json_agg(e), '[]') 
      FROM (
        SELECT * 
        FROM "FileUploadEvent" 
        WHERE "userId" = user_id 
        ORDER BY "createdAt" DESC 
        LIMIT limit_per_table
      ) e
    ),
    'player_events', (
      SELECT coalesce(json_agg(e), '[]') 
      FROM (
        SELECT * 
        FROM "PlayerInteractionEvent" 
        WHERE "userId" = user_id 
        ORDER BY "createdAt" DESC 
        LIMIT limit_per_table
      ) e
    ),
    'settings_events', (
      SELECT coalesce(json_agg(e), '[]') 
      FROM (
        SELECT * 
        FROM "SettingsChangeEvent" 
        WHERE "userId" = user_id 
        ORDER BY "createdAt" DESC 
        LIMIT limit_per_table
      ) e
    ),
    'page_view_events', (
      SELECT coalesce(json_agg(e), '[]') 
      FROM (
        SELECT * 
        FROM "PageViewEvent" 
        WHERE "userId" = user_id 
        ORDER BY "createdAt" DESC 
        LIMIT limit_per_table
      ) e
    ),
    'listening_events', (
      SELECT coalesce(json_agg(e), '[]') 
      FROM (
        SELECT * 
        FROM "FileListeningEvent" 
        WHERE "userId" = user_id 
        ORDER BY "createdAt" DESC 
        LIMIT limit_per_table
      ) e
    ),
    'daily_stats', (
      SELECT get_user_listening_stats(user_id, 30)
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_audit_events IS 'Получает все события аудита пользователя в одном запросе, включая загрузки файлов, взаимодействия с плеером, изменения настроек, просмотры страниц, события прослушивания и агрегированную статистику прослушивания';

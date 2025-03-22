-- Миграция для стандартизации колонки createdAt во всех таблицах аудита

-- 1. Добавляем createdAt в FileListeningEvent
ALTER TABLE "FileListeningEvent" 
ADD COLUMN "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Заполняем новую колонку, комбинируя date и startTime
UPDATE "FileListeningEvent"
SET "createdAt" = 
  CASE 
    WHEN "startTime" IS NOT NULL THEN "startTime"
    ELSE ("date"::text || ' 00:00:00')::timestamp with time zone
  END;

-- 2. Добавляем createdAt в PageViewEvent (клонируя enteredAt)
ALTER TABLE "PageViewEvent" 
ADD COLUMN "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Заполняем новую колонку из enteredAt
UPDATE "PageViewEvent"
SET "createdAt" = "enteredAt";

-- 3. Обновляем RPC-функцию для использования стандартизированной колонки
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
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Обновляем функцию для получения файлов пользователя (для полноты)
CREATE OR REPLACE FUNCTION get_user_files(user_id UUID)
RETURNS SETOF "File" AS $$
  SELECT * FROM "File" WHERE "userId" = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Предоставляем доступ к функциям для сервисной роли
GRANT EXECUTE ON FUNCTION get_user_audit_events TO service_role;
GRANT EXECUTE ON FUNCTION get_user_files TO service_role; 
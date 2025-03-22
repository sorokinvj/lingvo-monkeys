-- Миграция для оптимизации аналитических таблиц

-- 1. Добавляем fileName в PlayerInteractionEvent для удобства анализа
ALTER TABLE "PlayerInteractionEvent" 
ADD COLUMN "fileName" TEXT;

-- Заполняем существующие записи, извлекая fileName из metadata
UPDATE "PlayerInteractionEvent" 
SET "fileName" = metadata->>'fileName'
WHERE metadata->>'fileName' IS NOT NULL;

-- 2. Создаем таблицу для агрегированной статистики пользователя по дням
CREATE TABLE IF NOT EXISTS "UserDailyStats" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "date" DATE NOT NULL,
  "totalListeningSeconds" INTEGER DEFAULT 0,
  "totalFilesUploaded" INTEGER DEFAULT 0,
  "totalPageViews" INTEGER DEFAULT 0,
  "filesListened" JSONB DEFAULT '[]', -- Массив {fileId, fileName, seconds}
  "lastUpdated" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", "date")
);

-- Индексы для новой таблицы
CREATE INDEX user_daily_stats_user_idx ON "UserDailyStats" ("userId");
CREATE INDEX user_daily_stats_date_idx ON "UserDailyStats" ("date");

-- 3. Функция для обновления статистики на основе событий PlayerInteractionEvent
CREATE OR REPLACE FUNCTION update_user_daily_stats_from_player_events()
RETURNS TRIGGER AS $$
DECLARE
  file_id UUID;
  file_name TEXT;
  duration_seconds INTEGER;
  curr_date DATE;
BEGIN
  -- Только для событий pause и playback_complete обновляем статистику
  IF NEW.actionType IN ('pause', 'playback_complete') THEN
    file_id := NEW."fileId";
    file_name := NEW."fileName";
    
    -- Получаем последнее событие play для этого файла
    WITH last_play AS (
      SELECT 
        e."position" as start_position,
        e."createdAt" as start_time
      FROM "PlayerInteractionEvent" e
      WHERE e."userId" = NEW."userId"
        AND e."fileId" = file_id
        AND e."actionType" = 'play'
        AND e."createdAt" < NEW."createdAt"
      ORDER BY e."createdAt" DESC
      LIMIT 1
    )
    SELECT 
      CASE 
        WHEN NEW."position" IS NOT NULL AND lp.start_position IS NOT NULL 
        THEN ROUND(NEW."position" - lp.start_position)::INTEGER
        ELSE NULL
      END INTO duration_seconds
    FROM last_play lp;
    
    -- Если удалось рассчитать длительность прослушивания
    IF duration_seconds IS NOT NULL AND duration_seconds > 0 THEN
      curr_date := DATE(NEW."createdAt");
      
      -- Вставляем или обновляем статистику за день
      INSERT INTO "UserDailyStats" ("userId", "date", "totalListeningSeconds", "filesListened")
      VALUES (
        NEW."userId", 
        curr_date, 
        duration_seconds, 
        jsonb_build_array(jsonb_build_object('fileId', file_id, 'fileName', file_name, 'seconds', duration_seconds))
      )
      ON CONFLICT ("userId", "date") DO UPDATE
      SET 
        "totalListeningSeconds" = "UserDailyStats"."totalListeningSeconds" + duration_seconds,
        "filesListened" = "UserDailyStats"."filesListened" || 
                          jsonb_build_array(jsonb_build_object('fileId', file_id, 'fileName', file_name, 'seconds', duration_seconds)),
        "lastUpdated" = CURRENT_TIMESTAMP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер на вставку в PlayerInteractionEvent
CREATE TRIGGER player_event_stats_trigger
AFTER INSERT ON "PlayerInteractionEvent"
FOR EACH ROW
EXECUTE FUNCTION update_user_daily_stats_from_player_events();

-- 4. Функция для агрегирования статистики за последние 30 дней
CREATE OR REPLACE FUNCTION get_user_listening_stats(user_id UUID, days_limit INT DEFAULT 30)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- Сначала проверим существование колонки totalListeningSeconds
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'UserDailyStats' 
    AND column_name = 'totalListeningSeconds'
  ) THEN
    -- Если колонка существует, используем ее
    SELECT json_build_object(
      'total_seconds', COALESCE(SUM("totalListeningSeconds"), 0),
      'total_files_listened', COALESCE(COUNT(DISTINCT jsonb_array_elements("filesListened")->>'fileId'), 0),
      'daily_stats', (
        SELECT json_agg(stats)
        FROM (
          SELECT 
            "date", 
            "totalListeningSeconds",
            "totalFilesUploaded",
            "filesListened"
          FROM "UserDailyStats"
          WHERE "userId" = user_id
          AND "date" >= CURRENT_DATE - days_limit * INTERVAL '1 day'
          ORDER BY "date" DESC
        ) stats
      ),
      'streak', (
        SELECT COUNT(*)::INTEGER
        FROM (
          SELECT "date"
          FROM "UserDailyStats"
          WHERE "userId" = user_id
          AND "totalListeningSeconds" > 0
          AND "date" <= CURRENT_DATE
          ORDER BY "date" DESC
        ) consecutive_dates
        WHERE "date" = CURRENT_DATE - (row_number() OVER (ORDER BY "date" DESC) - 1) * INTERVAL '1 day'
      )
    ) INTO result;
  ELSE
    -- Если колонки нет, вернем пустой объект
    SELECT json_build_object(
      'total_seconds', 0,
      'total_files_listened', 0,
      'daily_stats', '[]'::json,
      'streak', 0
    ) INTO result;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Предоставляем доступ к новой функции
GRANT EXECUTE ON FUNCTION get_user_listening_stats TO service_role;

-- 5. Обновляем RPC для получения всех данных аудита пользователя
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
    'daily_stats', (
      SELECT get_user_listening_stats(user_id, 30)
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Политики безопасности RLS для новой таблицы
ALTER TABLE "UserDailyStats" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view only their own daily stats"
ON "UserDailyStats"
FOR SELECT
USING (auth.uid() = "userId");

-- 7. Политики для вставки и обновления (автоматически через триггер)
CREATE POLICY "Service role can manage daily stats"
ON "UserDailyStats"
USING (true)
WITH CHECK (true);

-- 8. Удаляем устаревшую таблицу FileListeningEvent
DROP TABLE IF EXISTS "FileListeningEvent";

-- 9. Обновляем комментарий к функции get_user_audit_events
COMMENT ON FUNCTION get_user_audit_events IS 'Получает все события аудита пользователя в одном запросе, включая загрузки файлов, взаимодействия с плеером, изменения настроек, просмотры страниц и агрегированную статистику прослушивания'; 
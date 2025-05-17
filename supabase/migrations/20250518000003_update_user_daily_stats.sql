-- Обновление таблицы UserDailyStats для интеграции с новой таблицей FileListeningEvent

-- 1. Создание нового триггера для обновления UserDailyStats из FileListeningEvent
CREATE OR REPLACE FUNCTION update_user_daily_stats_from_listening_events()
RETURNS TRIGGER AS $$
DECLARE
  curr_date DATE;
  file_id UUID;
  file_name TEXT;
  duration_seconds INTEGER;
BEGIN
  file_id := NEW."fileId";
  file_name := COALESCE(NEW."fileName", 'Неизвестный файл');
  duration_seconds := NEW."durationSeconds";
  curr_date := DATE(NEW."startTime");
  
  -- Обновляем статистику пользователя
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Создание триггера на вставку в FileListeningEvent
DROP TRIGGER IF EXISTS file_listening_stats_trigger ON "FileListeningEvent";
CREATE TRIGGER file_listening_stats_trigger
AFTER INSERT ON "FileListeningEvent"
FOR EACH ROW
EXECUTE FUNCTION update_user_daily_stats_from_listening_events();

-- 3. Обновление функции get_user_listening_stats - убираем streak
CREATE OR REPLACE FUNCTION get_user_listening_stats(user_id UUID, days_limit INT DEFAULT 30)
RETURNS json AS $$
DECLARE
  result json;
  total_seconds INTEGER;
BEGIN
  -- Получаем общее время прослушивания
  SELECT COALESCE(SUM("totalListeningSeconds"), 0)
  INTO total_seconds
  FROM "UserDailyStats"
  WHERE "userId" = user_id;

  -- Формируем результат без streak
  SELECT json_build_object(
    'total_seconds', total_seconds,
    'total_files_listened', (
      SELECT COUNT(DISTINCT elem->>'fileId')
      FROM "UserDailyStats",
      jsonb_array_elements("filesListened") as elem
      WHERE "userId" = user_id
    ),
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
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Предоставляем доступ к новой функции
GRANT EXECUTE ON FUNCTION get_user_listening_stats TO service_role;

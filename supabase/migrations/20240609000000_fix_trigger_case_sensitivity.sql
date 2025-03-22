-- Миграция для исправления чувствительности к регистру в триггере

-- ВАЖНО: полностью пересоздаем триггеры и функции

-- Удаляем существующий триггер, если он есть
DROP TRIGGER IF EXISTS player_event_stats_trigger ON "PlayerInteractionEvent";

-- Пересоздаем функцию триггера с корректным синтаксисом для регистра
CREATE OR REPLACE FUNCTION update_user_daily_stats_from_player_events()
RETURNS TRIGGER AS $$
DECLARE
  file_id UUID;
  file_name TEXT;
  duration_seconds INTEGER;
  curr_date DATE;
  action_type TEXT;
BEGIN
  -- Для доступа к полям в NEW используем доступ как к записи
  -- В PostgreSQL обязательно нужно заключать CamelCase поля в кавычки
  action_type := NEW."actionType";
  
  -- Логирование для диагностики
  RAISE NOTICE 'Trigger executing with action=%', action_type;
  
  -- Обрабатываем только события паузы и завершения
  IF action_type IN ('pause', 'playback_complete') THEN
    file_id := NEW."fileId";
    file_name := COALESCE(NEW."fileName", 'Unknown File');
    curr_date := DATE(NEW."createdAt");
    
    -- Находим последнее событие play для этого файла
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
        THEN GREATEST(ROUND(NEW."position" - lp.start_position)::INTEGER, 0)
        ELSE 0
      END INTO duration_seconds
    FROM last_play lp;
    
    -- Если нет события начала или неверное время, используем минимум
    IF duration_seconds IS NULL OR duration_seconds <= 0 THEN
      -- Для достоверной статистики
      duration_seconds := 5;
    END IF;
    
    RAISE NOTICE 'Calculated duration = % seconds', duration_seconds;
    
    -- Записываем данные в статистику
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер заново с правильными параметрами
CREATE TRIGGER player_event_stats_trigger
AFTER INSERT ON "PlayerInteractionEvent"
FOR EACH ROW
EXECUTE FUNCTION update_user_daily_stats_from_player_events();

-- Запускаем обработку существующих событий
DO $$
BEGIN
  -- Очищаем текущие агрегированные данные для чистой статистики
  DELETE FROM "UserDailyStats";

  -- Запускаем агрегацию событий для каждой записи
  RAISE NOTICE 'Starting event aggregation...';
  
  -- Автоматическое обновление через триггер не сработает для существующих событий,
  -- поэтому используем прямой SQL для агрегации
  INSERT INTO "UserDailyStats" ("userId", "date", "totalListeningSeconds", "filesListened")
  WITH player_events AS (
    SELECT
      e."userId",
      e."fileId",
      COALESCE(e."fileName", 'Unknown File') as fileName,
      DATE(e."createdAt") as event_date,
      -- Для каждого события паузы находим предыдущее событие play
      LAG(e."position", 1) OVER (PARTITION BY e."userId", e."fileId" ORDER BY e."createdAt") as prev_position,
      LAG(e."actionType", 1) OVER (PARTITION BY e."userId", e."fileId" ORDER BY e."createdAt") as prev_action,
      e."position" as curr_position,
      e."actionType" as curr_action
    FROM "PlayerInteractionEvent" e
    WHERE e."actionType" IN ('play', 'pause', 'playback_complete')
    ORDER BY e."userId", e."fileId", e."createdAt"
  ),
  listening_segments AS (
    SELECT
      "userId",
      "fileId",
      fileName,
      event_date,
      CASE 
        WHEN curr_action IN ('pause', 'playback_complete') AND prev_action = 'play' AND curr_position > prev_position
        THEN GREATEST(curr_position - prev_position, 0)
        ELSE 5 -- минимальное время прослушивания
      END as duration_seconds
    FROM player_events
    WHERE curr_action IN ('pause', 'playback_complete')
  ),
  user_daily_listening AS (
    SELECT
      "userId",
      event_date as "date",
      SUM(duration_seconds) as "totalListeningSeconds",
      jsonb_agg(jsonb_build_object(
        'fileId', "fileId", 
        'fileName', fileName, 
        'seconds', duration_seconds
      )) as "filesListened"
    FROM listening_segments
    GROUP BY "userId", event_date
  )
  SELECT * FROM user_daily_listening;
  
  RAISE NOTICE 'Event aggregation completed!';
END;
$$ LANGUAGE plpgsql; 
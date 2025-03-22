-- ФИНАЛЬНОЕ исправление всех проблем с триггером для учета времени прослушивания

-- 1. Удаляем существующий триггер, если он существует
DROP TRIGGER IF EXISTS player_event_stats_trigger ON "PlayerInteractionEvent";

-- 2. Пересоздаем функцию и исправляем все проблемы с регистром полей
CREATE OR REPLACE FUNCTION update_user_daily_stats_from_player_events()
RETURNS TRIGGER AS $$
DECLARE
  debug_info TEXT; 
BEGIN
  -- Логируем вход в триггер для диагностики
  RAISE LOG 'Trigger called for % action: % with content: %', TG_OP, NEW."actionType", NEW;
  
  -- Проверяем регистр без преобразования - используем точное имя поля
  IF NEW."actionType" IN ('pause', 'playback_complete') THEN
    -- Для диагностики сохраняем все поля
    debug_info := format('User: %s, File: %s, Action: %s, Position: %s', 
                         NEW."userId", NEW."fileId", NEW."actionType", NEW."position");
    RAISE LOG 'Processing event: %', debug_info;
    
    -- Вычисляем длительность прослушивания
    DECLARE
      file_id UUID := NEW."fileId";
      file_name TEXT := COALESCE(NEW."fileName", 'Unnamed File');
      duration_seconds INTEGER;
      current_date DATE := DATE(NEW."createdAt");
    BEGIN
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
          THEN GREATEST(ROUND(NEW."position" - lp.start_position)::INTEGER, 0)
          ELSE 0
        END INTO duration_seconds
      FROM last_play lp;
      
      -- Если нет данных о начале или некорректные данные, используем значение по умолчанию
      IF duration_seconds IS NULL OR duration_seconds <= 0 THEN
        duration_seconds := 5; -- минимальное время прослушивания
      END IF;
      
      RAISE LOG 'Calculated duration: % seconds for user %', duration_seconds, NEW."userId";
      
      -- Обновляем статистику пользователя
      INSERT INTO "UserDailyStats" ("userId", "date", "totalListeningSeconds", "filesListened")
      VALUES (
        NEW."userId", 
        current_date,
        duration_seconds,
        jsonb_build_array(jsonb_build_object(
          'fileId', file_id, 
          'fileName', file_name, 
          'seconds', duration_seconds
        ))
      )
      ON CONFLICT ("userId", "date") DO UPDATE
      SET 
        "totalListeningSeconds" = "UserDailyStats"."totalListeningSeconds" + EXCLUDED."totalListeningSeconds",
        "filesListened" = "UserDailyStats"."filesListened" || EXCLUDED."filesListened",
        "lastUpdated" = CURRENT_TIMESTAMP;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Создаем новый триггер
CREATE TRIGGER player_event_stats_trigger
AFTER INSERT ON "PlayerInteractionEvent"
FOR EACH ROW
EXECUTE FUNCTION update_user_daily_stats_from_player_events();

-- 5. Логируем успешное создание триггера
DO $$
BEGIN
  RAISE LOG 'Player events trigger successfully recreated';
END $$; 
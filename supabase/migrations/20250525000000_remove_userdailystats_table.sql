-- Миграция для удаления таблицы UserDailyStats и обновления RPC-функций

-- 1. Сначала удаляем триггеры, связанные с UserDailyStats
DROP TRIGGER IF EXISTS update_user_daily_stats_from_file_listening ON "FileListeningEvent";
DROP TRIGGER IF EXISTS update_user_stats_from_listening ON "FileListeningEvent";
DROP TRIGGER IF EXISTS update_user_daily_stats ON "FileListeningEvent";
-- Удаляем все возможные триггеры, которые могут использовать функцию
DROP TRIGGER IF EXISTS user_daily_stats_update ON "FileListeningEvent";

-- 2. Теперь безопасно удаляем функцию
DROP FUNCTION IF EXISTS update_user_daily_stats_from_listening_events() CASCADE;

-- 3. Удаляем таблицу UserDailyStats
DROP TABLE IF EXISTS "UserDailyStats" CASCADE;

-- 4. Обновляем функцию get_user_listening_stats для использования только FileListeningEvent
CREATE OR REPLACE FUNCTION get_user_listening_stats(user_id UUID, days_limit INT DEFAULT 30)
RETURNS json AS $$
DECLARE
  total_seconds integer;
  total_files integer;
  daily_stats json;
BEGIN
  -- Считаем общее время прослушивания напрямую из FileListeningEvent
  SELECT COALESCE(SUM("durationSeconds"), 0) 
  INTO total_seconds
  FROM "FileListeningEvent" 
  WHERE "userId" = user_id;
  
  -- Получаем количество уникальных файлов из FileListeningEvent
  SELECT COUNT(DISTINCT "fileId") 
  INTO total_files
  FROM "FileListeningEvent"
  WHERE "userId" = user_id;
  
  -- Получаем дневную статистику
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'date', day_data.date,
        'totalSeconds', day_data.seconds,
        'filesCount', day_data.files_count
      )
      ORDER BY day_data.date DESC
    ),
    '[]'::json
  )
  INTO daily_stats
  FROM (
    SELECT 
      date_trunc('day', "createdAt")::date as date,
      SUM("durationSeconds") as seconds,
      COUNT(DISTINCT "fileId") as files_count
    FROM "FileListeningEvent" 
    WHERE "userId" = user_id
    GROUP BY date_trunc('day', "createdAt")
    ORDER BY date_trunc('day', "createdAt") DESC
    LIMIT days_limit
  ) as day_data;
  
  -- Собираем финальный результат
  RETURN json_build_object(
    'totalSeconds', total_seconds,
    'totalFilesListened', total_files,
    'dailyStats', daily_stats
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Обновляем комментарий для функции
COMMENT ON FUNCTION get_user_listening_stats IS 'Получает статистику прослушивания пользователя напрямую из таблицы FileListeningEvent';

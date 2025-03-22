-- Финальное исправление функций аналитики
-- Включает исправленную функцию для подсчета времени прослушивания и получения статистики

-- Исправление функции получения статистики прослушивания
CREATE OR REPLACE FUNCTION get_user_listening_stats(user_id uuid, days_limit integer DEFAULT 30)
RETURNS json AS $$
DECLARE
  total_seconds integer;
  total_files integer;
  daily_stats json;
BEGIN
  -- Подсчитываем общее время прослушивания
  SELECT COALESCE(SUM("totalListeningSeconds"), 0) 
  INTO total_seconds
  FROM "UserDailyStats" 
  WHERE "userId" = user_id;
  
  -- Получаем количество уникальных файлов
  WITH file_ids AS (
    SELECT DISTINCT elem->>'fileId' as file_id
    FROM "UserDailyStats",
    jsonb_array_elements("filesListened") as elem
    WHERE "userId" = user_id
  )
  SELECT COUNT(*) INTO total_files FROM file_ids;
  
  -- Получаем дневную статистику
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'date', date_data.date,
        'totalSeconds', date_data.seconds,
        'filesCount', date_data.files_count
      )
      ORDER BY date_data.date DESC
    ),
    '[]'::json
  )
  INTO daily_stats
  FROM (
    SELECT 
      "date",
      "totalListeningSeconds" as seconds,
      jsonb_array_length("filesListened") as files_count
    FROM "UserDailyStats" 
    WHERE "userId" = user_id
    ORDER BY "date" DESC
    LIMIT days_limit
  ) as date_data;
  
  -- Собираем финальный результат
  RETURN json_build_object(
    'totalSeconds', total_seconds,
    'totalFilesListened', total_files,
    'dailyStats', daily_stats,
    'streak', 0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Обновляем основную функцию для получения всех данных аудита
CREATE OR REPLACE FUNCTION get_user_audit_events(user_id uuid, limit_per_table integer DEFAULT 100)
RETURNS json AS $$
BEGIN
  RETURN json_build_object(
    'upload_events', (
      SELECT coalesce(json_agg(e), '[]'::json) 
      FROM (
        SELECT * 
        FROM "FileUploadEvent" 
        WHERE "userId" = user_id 
        ORDER BY "createdAt" DESC 
        LIMIT limit_per_table
      ) e
    ),
    'player_events', (
      SELECT coalesce(json_agg(e), '[]'::json) 
      FROM (
        SELECT * 
        FROM "PlayerInteractionEvent" 
        WHERE "userId" = user_id 
        ORDER BY "createdAt" DESC 
        LIMIT limit_per_table
      ) e
    ),
    'settings_events', (
      SELECT coalesce(json_agg(e), '[]'::json) 
      FROM (
        SELECT * 
        FROM "SettingsChangeEvent" 
        WHERE "userId" = user_id 
        ORDER BY "createdAt" DESC 
        LIMIT limit_per_table
      ) e
    ),
    'page_view_events', (
      SELECT coalesce(json_agg(e), '[]'::json) 
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
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
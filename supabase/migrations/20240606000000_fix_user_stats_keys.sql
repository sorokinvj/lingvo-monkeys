-- Миграция для исправления имен полей в статистике прослушивания

-- Обновляем функцию для агрегирования статистики
CREATE OR REPLACE FUNCTION get_user_listening_stats(user_id UUID, days_limit INT DEFAULT 30)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- Проверяем есть ли записи в таблице
  IF EXISTS (SELECT 1 FROM "UserDailyStats" WHERE "userId" = user_id) THEN
    SELECT json_build_object(
      'totalSeconds', COALESCE(SUM("totalListeningSeconds"), 0),
      'totalFilesListened', COALESCE((
        SELECT COUNT(DISTINCT jsonb_array_elements("filesListened")->>'fileId')
        FROM "UserDailyStats"
        WHERE "userId" = user_id
      ), 0),
      'dailyStats', (
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
    -- Если данных нет, возвращаем пустые значения
    SELECT json_build_object(
      'totalSeconds', 0,
      'totalFilesListened', 0,
      'dailyStats', '[]'::json,
      'streak', 0
    ) INTO result;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Обновляем RPC для получения всех данных аудита пользователя
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
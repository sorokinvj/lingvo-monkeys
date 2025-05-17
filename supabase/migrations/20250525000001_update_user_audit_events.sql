-- Обновление функции get_user_audit_events - удаление ссылок на daily_stats

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
    'listening_events', (
      SELECT coalesce(json_agg(e), '[]'::json) 
      FROM (
        SELECT * 
        FROM "FileListeningEvent" 
        WHERE "userId" = user_id 
        ORDER BY "createdAt" DESC 
        LIMIT limit_per_table
      ) e
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_audit_events IS 'Возвращает все события аудита пользователя без агрегированных данных';

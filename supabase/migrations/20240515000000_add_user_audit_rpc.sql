-- Добавление RPC-функций для оптимизации аудита пользователей

-- Функция для получения всех файлов пользователя
CREATE OR REPLACE FUNCTION get_user_files(user_id UUID)
RETURNS SETOF "File" AS $$
  SELECT * FROM "File" WHERE "userId" = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Добавляем комментарий к функции
COMMENT ON FUNCTION get_user_files IS 'Получает все файлы, принадлежащие указанному пользователю';

-- Функция для получения всех событий пользователя одним запросом
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
        ORDER BY "enteredAt" DESC 
        LIMIT limit_per_table
      ) e
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Добавляем комментарий к функции
COMMENT ON FUNCTION get_user_audit_events IS 'Получает все события аудита пользователя в одном запросе, включая загрузки файлов, прослушивания, взаимодействия с плеером, изменения настроек и просмотры страниц';

-- Предоставляем доступ к функциям для сервисной роли
GRANT EXECUTE ON FUNCTION get_user_files TO service_role;
GRANT EXECUTE ON FUNCTION get_user_audit_events TO service_role; 
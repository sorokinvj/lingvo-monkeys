-- Обновляем функцию подсчета библиотечных файлов, прослушанных пользователем,
-- удаляя ограничение по минимальному времени прослушивания
CREATE OR REPLACE FUNCTION get_library_count_for_user(user_id_param UUID)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  WITH listened_files AS (
    -- Подсчитываем файлы, которые пользователь слушал (без ограничения по времени)
    SELECT 
      "fileId",
      SUM("durationSeconds") AS total_seconds
    FROM "FileListeningEvent"
    WHERE "userId" = user_id_param
    GROUP BY "fileId"
    -- Убрано ограничение "HAVING SUM("durationSeconds") >= 60"
  ),
  library_files AS (
    -- Выбираем только файлы из библиотеки
    SELECT COUNT(*) AS count
    FROM "File" f
    JOIN listened_files lf ON f.id = lf."fileId"
    WHERE f."is_library" = true
  )
  -- Формируем результат
  SELECT json_build_object(
    'count', COALESCE((SELECT count FROM library_files), 0)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Предоставляем доступ к обновленной функции
GRANT EXECUTE ON FUNCTION get_library_count_for_user TO service_role;

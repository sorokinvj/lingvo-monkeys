-- Добавляем столбец fileName в таблицу FileListeningEvent
ALTER TABLE "FileListeningEvent" ADD COLUMN IF NOT EXISTS "fileName" TEXT;

-- Обновляем кеш схемы для PostgREST
NOTIFY pgrst, 'reload schema';

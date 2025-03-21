-- Добавление поля status и errorMessage в FileUploadEvent
ALTER TABLE "FileUploadEvent"
ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'uploading',
ADD COLUMN IF NOT EXISTS "errorMessage" TEXT;

-- Сначала проверим, существует ли таблица перед миграцией данных
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'TranscriptInteractionEvent') THEN
    -- Перенести данные из TranscriptInteractionEvent в PlayerInteractionEvent (если есть)
    INSERT INTO "PlayerInteractionEvent" ("userId", "fileId", "actionType", "position", "metadata", "createdAt")
    SELECT 
      "userId", 
      "fileId", 
      'transcript_seek' as "actionType", 
      "timestamp" as "position", 
      jsonb_build_object('wordIndex', "wordIndex", 'source', 'transcript') as "metadata",
      "createdAt"
    FROM "TranscriptInteractionEvent"
    ON CONFLICT DO NOTHING;

    -- Удаление политик RLS для ненужной таблицы (перед удалением таблицы)
    DROP POLICY IF EXISTS "Users can view only their own transcript interactions" ON "TranscriptInteractionEvent";
    DROP POLICY IF EXISTS "Authenticated users can insert transcript interactions" ON "TranscriptInteractionEvent";
    DROP POLICY IF EXISTS "Service role can read any transcript interactions" ON "TranscriptInteractionEvent";
    DROP POLICY IF EXISTS "Service role can insert any transcript interactions" ON "TranscriptInteractionEvent";

    -- Удаление таблицы TranscriptInteractionEvent
    DROP TABLE IF EXISTS "TranscriptInteractionEvent";
  END IF;
END
$$;

-- Обновление индексов для PlayerInteractionEvent
DROP INDEX IF EXISTS player_interaction_action_idx;
CREATE INDEX IF NOT EXISTS player_interaction_action_idx ON "PlayerInteractionEvent" ("actionType"); 
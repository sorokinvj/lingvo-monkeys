# Миграция для системы аналитики

Данный документ содержит SQL-код миграции для создания таблиц системы аналитики пользовательских действий.

## Миграция

Файл миграции для Supabase (`<timestamp>_analytics_system.sql`):

```sql
-- Create UserAction table
CREATE TABLE IF NOT EXISTS "UserAction" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "actionType" TEXT NOT NULL,
  "entityId" UUID,
  "entityType" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "sessionId" UUID,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX user_action_user_id_idx ON "UserAction" ("userId");
CREATE INDEX user_action_action_type_idx ON "UserAction" ("actionType");
CREATE INDEX user_action_entity_id_idx ON "UserAction" ("entityId");
CREATE INDEX user_action_created_at_idx ON "UserAction" ("createdAt");

-- Create UserSession table
CREATE TABLE IF NOT EXISTS "UserSession" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "startTime" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "endTime" TIMESTAMP WITH TIME ZONE,
  "duration" INTEGER,
  "deviceInfo" JSONB,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX user_session_user_id_idx ON "UserSession" ("userId");
CREATE INDEX user_session_start_time_idx ON "UserSession" ("startTime");

-- Create FilePlaybackStats table
CREATE TABLE IF NOT EXISTS "FilePlaybackStats" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "fileId" UUID NOT NULL,
  "totalListeningTime" INTEGER DEFAULT 0,
  "completionCount" INTEGER DEFAULT 0,
  "lastListenedAt" TIMESTAMP WITH TIME ZONE,
  "listeningProgress" FLOAT DEFAULT 0,
  "date" DATE NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE,
  UNIQUE ("userId", "fileId", "date")
);

-- Create index for faster queries
CREATE INDEX file_playback_stats_user_id_idx ON "FilePlaybackStats" ("userId");
CREATE INDEX file_playback_stats_file_id_idx ON "FilePlaybackStats" ("fileId");
CREATE INDEX file_playback_stats_date_idx ON "FilePlaybackStats" ("date");

-- Create PageView table
CREATE TABLE IF NOT EXISTS "PageView" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "path" TEXT NOT NULL,
  "duration" INTEGER,
  "enteredAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "exitedAt" TIMESTAMP WITH TIME ZONE,
  "sessionId" UUID,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX page_view_user_id_idx ON "PageView" ("userId");
CREATE INDEX page_view_path_idx ON "PageView" ("path");
CREATE INDEX page_view_entered_at_idx ON "PageView" ("enteredAt");

-- Create function to update aggregated stats
CREATE OR REPLACE FUNCTION update_file_playback_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."actionType" = 'play' AND NEW."entityType" = 'file' THEN
    INSERT INTO "FilePlaybackStats" ("userId", "fileId", "lastListenedAt", "date")
    VALUES (NEW."userId", NEW."entityId"::UUID, NOW(), CURRENT_DATE)
    ON CONFLICT ("userId", "fileId", "date")
    DO UPDATE SET "lastListenedAt" = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update stats on user action
CREATE TRIGGER update_stats_on_action
AFTER INSERT ON "UserAction"
FOR EACH ROW
EXECUTE FUNCTION update_file_playback_stats();

-- Set RLS policies
ALTER TABLE "UserAction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FilePlaybackStats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PageView" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view only their own actions"
ON "UserAction"
FOR SELECT
USING (auth.uid() = "userId");

CREATE POLICY "Users can view only their own sessions"
ON "UserSession"
FOR SELECT
USING (auth.uid() = "userId");

CREATE POLICY "Users can view only their own file stats"
ON "FilePlaybackStats"
FOR SELECT
USING (auth.uid() = "userId");

CREATE POLICY "Users can view only their own page views"
ON "PageView"
FOR SELECT
USING (auth.uid() = "userId");

-- Allow service role to manage all data
CREATE POLICY "Service role can manage all actions"
ON "UserAction"
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage all sessions"
ON "UserSession"
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage all file stats"
ON "FilePlaybackStats"
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage all page views"
ON "PageView"
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');
```

## Применение миграции

1. Сохраните файл в каталоге `supabase/migrations/` с именем, начинающимся с метки времени.
2. Примените миграцию с помощью CLI Supabase:

```bash
supabase db reset
```

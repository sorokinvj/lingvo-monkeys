-- 1. Загрузка файлов
CREATE TABLE IF NOT EXISTS "FileUploadEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "fileId" UUID NOT NULL REFERENCES "File"("id") ON DELETE CASCADE,
  "fileName" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Прослушивание файлов
CREATE TABLE IF NOT EXISTS "FileListeningEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "fileId" UUID NOT NULL REFERENCES "File"("id") ON DELETE CASCADE,
  "startTime" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "endTime" TIMESTAMP WITH TIME ZONE,
  "durationSeconds" INTEGER,
  "date" DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 3. Просмотр страниц с heartbeat-механизмом
CREATE TABLE IF NOT EXISTS "PageViewEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "path" TEXT NOT NULL,
  "enteredAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "isActive" BOOLEAN DEFAULT TRUE,
  "lastActivityAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "exitedAt" TIMESTAMP WITH TIME ZONE,
  "duration" INTEGER
);

-- 4. Взаимодействие с плеером
CREATE TABLE IF NOT EXISTS "PlayerInteractionEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "fileId" UUID NOT NULL REFERENCES "File"("id") ON DELETE CASCADE,
  "actionType" TEXT NOT NULL, -- play, pause, seek, speed_change, playback_complete
  "position" FLOAT, -- текущая позиция в секундах
  "value" FLOAT, -- для speed_change - новая скорость
  "metadata" JSONB, -- дополнительные данные
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Взаимодействие с транскрипцией
CREATE TABLE IF NOT EXISTS "TranscriptInteractionEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "fileId" UUID NOT NULL REFERENCES "File"("id") ON DELETE CASCADE,
  "wordIndex" INTEGER, -- индекс слова в транскрипции
  "timestamp" FLOAT, -- временная метка в аудио
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Изменение настроек
CREATE TABLE IF NOT EXISTS "SettingsChangeEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "settingKey" TEXT NOT NULL,
  "oldValue" JSONB,
  "newValue" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для оптимизации запросов
CREATE INDEX file_upload_user_idx ON "FileUploadEvent" ("userId");
CREATE INDEX file_upload_created_idx ON "FileUploadEvent" ("createdAt");

CREATE INDEX file_listening_user_idx ON "FileListeningEvent" ("userId");
CREATE INDEX file_listening_file_idx ON "FileListeningEvent" ("fileId");
CREATE INDEX file_listening_date_idx ON "FileListeningEvent" ("date");

CREATE INDEX page_view_user_idx ON "PageViewEvent" ("userId");
CREATE INDEX page_view_path_idx ON "PageViewEvent" ("path");
CREATE INDEX page_view_entered_idx ON "PageViewEvent" ("enteredAt");

CREATE INDEX player_interaction_user_idx ON "PlayerInteractionEvent" ("userId");
CREATE INDEX player_interaction_file_idx ON "PlayerInteractionEvent" ("fileId");
CREATE INDEX player_interaction_action_idx ON "PlayerInteractionEvent" ("actionType");
CREATE INDEX player_interaction_created_idx ON "PlayerInteractionEvent" ("createdAt");

CREATE INDEX transcript_interaction_user_idx ON "TranscriptInteractionEvent" ("userId");
CREATE INDEX transcript_interaction_file_idx ON "TranscriptInteractionEvent" ("fileId");

CREATE INDEX settings_change_user_idx ON "SettingsChangeEvent" ("userId");
CREATE INDEX settings_change_key_idx ON "SettingsChangeEvent" ("settingKey");

-- Политики безопасности RLS
ALTER TABLE "FileUploadEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FileListeningEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PageViewEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlayerInteractionEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TranscriptInteractionEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SettingsChangeEvent" ENABLE ROW LEVEL SECURITY;

-- Пользователи могут видеть только свои данные
CREATE POLICY "Users can view only their own upload events"
ON "FileUploadEvent"
FOR SELECT
USING (auth.uid() = "userId");

CREATE POLICY "Users can view only their own listening events"
ON "FileListeningEvent"
FOR SELECT
USING (auth.uid() = "userId");

CREATE POLICY "Users can view only their own page views"
ON "PageViewEvent"
FOR SELECT
USING (auth.uid() = "userId");

CREATE POLICY "Users can view only their own player interactions"
ON "PlayerInteractionEvent"
FOR SELECT
USING (auth.uid() = "userId");

CREATE POLICY "Users can view only their own transcript interactions"
ON "TranscriptInteractionEvent"
FOR SELECT
USING (auth.uid() = "userId");

CREATE POLICY "Users can view only their own settings changes"
ON "SettingsChangeEvent"
FOR SELECT
USING (auth.uid() = "userId");

-- Временная политика для всех действий (потом настроим сервисную роль)
CREATE POLICY "Authenticated users can insert analytics events"
ON "FileUploadEvent" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Authenticated users can insert listening events"
ON "FileListeningEvent" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Authenticated users can insert page views"
ON "PageViewEvent" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Authenticated users can insert and update page views"
ON "PageViewEvent" FOR UPDATE
TO authenticated
USING (auth.uid() = "userId");

CREATE POLICY "Authenticated users can insert player interactions"
ON "PlayerInteractionEvent" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Authenticated users can insert transcript interactions"
ON "TranscriptInteractionEvent" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Authenticated users can insert settings changes"
ON "SettingsChangeEvent" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = "userId"); 
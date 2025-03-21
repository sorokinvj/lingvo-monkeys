-- Предоставление прав на таблицы аналитики для сервисной роли
GRANT SELECT, INSERT, UPDATE ON 
  "FileUploadEvent", 
  "FileListeningEvent", 
  "PageViewEvent", 
  "PlayerInteractionEvent", 
  "TranscriptInteractionEvent", 
  "SettingsChangeEvent"
TO service_role;

-- Политики доступа для сервисной роли
CREATE POLICY "Service role can read any analytics data"
ON "FileUploadEvent" FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Service role can insert any analytics data"
ON "FileUploadEvent" FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can read any listening events"
ON "FileListeningEvent" FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Service role can insert any listening events"
ON "FileListeningEvent" FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update any listening events"
ON "FileListeningEvent" FOR UPDATE
TO service_role
USING (true);

CREATE POLICY "Service role can read any page views"
ON "PageViewEvent" FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Service role can insert any page views"
ON "PageViewEvent" FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update any page views"
ON "PageViewEvent" FOR UPDATE
TO service_role
USING (true);

CREATE POLICY "Service role can read any player interactions"
ON "PlayerInteractionEvent" FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Service role can insert any player interactions"
ON "PlayerInteractionEvent" FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can read any transcript interactions"
ON "TranscriptInteractionEvent" FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Service role can insert any transcript interactions"
ON "TranscriptInteractionEvent" FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can read any settings changes"
ON "SettingsChangeEvent" FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Service role can insert any settings changes"
ON "SettingsChangeEvent" FOR INSERT
TO service_role
WITH CHECK (true); 
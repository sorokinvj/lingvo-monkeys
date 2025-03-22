

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."get_user_audit_events"("user_id" "uuid", "limit_per_table" integer DEFAULT 100) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_user_audit_events"("user_id" "uuid", "limit_per_table" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_audit_events"("user_id" "uuid", "limit_per_table" integer) IS 'Получает все события аудита пользователя в одном запросе, включая загрузки файлов, взаимодействия с плеером, изменения настроек, просмотры страниц и агрегированную статистику прослушивания';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."File" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "path" "text" NOT NULL,
    "size" integer NOT NULL,
    "mimeType" "text" NOT NULL,
    "publicUrl" "text",
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "userId" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "transcriptionId" "uuid",
    "language" "text",
    "languageLevel" "text",
    "contentType" "text",
    CONSTRAINT "File_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'transcribing'::"text", 'transcribed'::"text", 'error'::"text"])))
);

ALTER TABLE ONLY "public"."File" REPLICA IDENTITY FULL;


ALTER TABLE "public"."File" OWNER TO "postgres";


COMMENT ON COLUMN "public"."File"."language" IS 'Language code, e.g. EN (UK), EN (US), RU';



COMMENT ON COLUMN "public"."File"."languageLevel" IS 'Language proficiency level: Beginner, Intermediate, or Advanced';



COMMENT ON COLUMN "public"."File"."contentType" IS 'Type of content: Речь (Speech), Книга (Book), or Рассказ (Story)';



CREATE OR REPLACE FUNCTION "public"."get_user_files"("user_id" "uuid") RETURNS SETOF "public"."File"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT * FROM "File" WHERE "userId" = user_id;
$$;


ALTER FUNCTION "public"."get_user_files"("user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_files"("user_id" "uuid") IS 'Получает все файлы, принадлежащие указанному пользователю';



CREATE OR REPLACE FUNCTION "public"."get_user_listening_stats"("user_id" "uuid", "days_limit" integer DEFAULT 30) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_user_listening_stats"("user_id" "uuid", "days_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public."User" (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Anonymous'), NEW.email);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
   NEW."updatedAt" = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_daily_stats_from_player_events"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  file_id UUID;
  file_name TEXT;
  duration_seconds INTEGER;
  curr_date DATE;
  action_type TEXT;
BEGIN
  -- Для доступа к полям в NEW используем доступ как к записи
  -- В PostgreSQL обязательно нужно заключать CamelCase поля в кавычки
  action_type := NEW."actionType";
  
  -- Логирование для диагностики
  RAISE NOTICE 'Trigger executing with action=%', action_type;
  
  -- Обрабатываем только события паузы и завершения
  IF action_type IN ('pause', 'playback_complete') THEN
    file_id := NEW."fileId";
    file_name := COALESCE(NEW."fileName", 'Unknown File');
    curr_date := DATE(NEW."createdAt");
    
    -- Находим последнее событие play для этого файла
    WITH last_play AS (
      SELECT 
        e."position" as start_position,
        e."createdAt" as start_time
      FROM "PlayerInteractionEvent" e
      WHERE e."userId" = NEW."userId"
        AND e."fileId" = file_id
        AND e."actionType" = 'play'
        AND e."createdAt" < NEW."createdAt"
      ORDER BY e."createdAt" DESC
      LIMIT 1
    )
    SELECT 
      CASE 
        WHEN NEW."position" IS NOT NULL AND lp.start_position IS NOT NULL 
        THEN GREATEST(ROUND(NEW."position" - lp.start_position)::INTEGER, 0)
        ELSE 0
      END INTO duration_seconds
    FROM last_play lp;
    
    -- Если нет события начала или неверное время, используем минимум
    IF duration_seconds IS NULL OR duration_seconds <= 0 THEN
      -- Для достоверной статистики
      duration_seconds := 5;
    END IF;
    
    RAISE NOTICE 'Calculated duration = % seconds', duration_seconds;
    
    -- Записываем данные в статистику
    INSERT INTO "UserDailyStats" ("userId", "date", "totalListeningSeconds", "filesListened")
    VALUES (
      NEW."userId", 
      curr_date, 
      duration_seconds, 
      jsonb_build_array(jsonb_build_object('fileId', file_id, 'fileName', file_name, 'seconds', duration_seconds))
    )
    ON CONFLICT ("userId", "date") DO UPDATE
    SET 
      "totalListeningSeconds" = "UserDailyStats"."totalListeningSeconds" + duration_seconds,
      "filesListened" = "UserDailyStats"."filesListened" || 
                        jsonb_build_array(jsonb_build_object('fileId', file_id, 'fileName', file_name, 'seconds', duration_seconds)),
      "lastUpdated" = CURRENT_TIMESTAMP;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_daily_stats_from_player_events"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."FileUploadEvent" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "userId" "uuid" NOT NULL,
    "fileId" "uuid" NOT NULL,
    "fileName" "text" NOT NULL,
    "fileSize" integer NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "status" "text" DEFAULT 'uploading'::"text",
    "errorMessage" "text"
);


ALTER TABLE "public"."FileUploadEvent" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."PageViewEvent" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "userId" "uuid" NOT NULL,
    "path" "text" NOT NULL,
    "enteredAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "isActive" boolean DEFAULT true,
    "lastActivityAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "exitedAt" timestamp with time zone,
    "duration" integer,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."PageViewEvent" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."PlayerInteractionEvent" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "userId" "uuid" NOT NULL,
    "fileId" "uuid" NOT NULL,
    "actionType" "text" NOT NULL,
    "position" double precision,
    "value" double precision,
    "metadata" "jsonb",
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "fileName" "text"
);


ALTER TABLE "public"."PlayerInteractionEvent" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."SettingsChangeEvent" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "userId" "uuid" NOT NULL,
    "settingKey" "text" NOT NULL,
    "oldValue" "jsonb",
    "newValue" "jsonb",
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."SettingsChangeEvent" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Transcription" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content" "text",
    "isTranscribing" boolean DEFAULT false,
    "error" "text",
    "fullTranscription" "jsonb",
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "fileId" "uuid" NOT NULL,
    "userId" "uuid" NOT NULL
);

ALTER TABLE ONLY "public"."Transcription" REPLICA IDENTITY FULL;


ALTER TABLE "public"."Transcription" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."Transcription_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."Transcription_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."Transcription_id_seq" OWNED BY "public"."Transcription"."id";



CREATE TABLE IF NOT EXISTS "public"."User" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."User" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."UserDailyStats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "userId" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "totalListeningSeconds" integer DEFAULT 0,
    "totalFilesUploaded" integer DEFAULT 0,
    "totalPageViews" integer DEFAULT 0,
    "filesListened" "jsonb" DEFAULT '[]'::"jsonb",
    "lastUpdated" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."UserDailyStats" OWNER TO "postgres";


ALTER TABLE ONLY "public"."FileUploadEvent"
    ADD CONSTRAINT "FileUploadEvent_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."File"
    ADD CONSTRAINT "File_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."PageViewEvent"
    ADD CONSTRAINT "PageViewEvent_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."PlayerInteractionEvent"
    ADD CONSTRAINT "PlayerInteractionEvent_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."SettingsChangeEvent"
    ADD CONSTRAINT "SettingsChangeEvent_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Transcription"
    ADD CONSTRAINT "Transcription_fileId_key" UNIQUE ("fileId");



ALTER TABLE ONLY "public"."Transcription"
    ADD CONSTRAINT "Transcription_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."UserDailyStats"
    ADD CONSTRAINT "UserDailyStats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."UserDailyStats"
    ADD CONSTRAINT "UserDailyStats_userId_date_key" UNIQUE ("userId", "date");



ALTER TABLE ONLY "public"."User"
    ADD CONSTRAINT "User_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");



CREATE INDEX "file_upload_created_idx" ON "public"."FileUploadEvent" USING "btree" ("createdAt");



CREATE INDEX "file_upload_user_idx" ON "public"."FileUploadEvent" USING "btree" ("userId");



CREATE INDEX "page_view_entered_idx" ON "public"."PageViewEvent" USING "btree" ("enteredAt");



CREATE INDEX "page_view_path_idx" ON "public"."PageViewEvent" USING "btree" ("path");



CREATE INDEX "page_view_user_idx" ON "public"."PageViewEvent" USING "btree" ("userId");



CREATE INDEX "player_interaction_action_idx" ON "public"."PlayerInteractionEvent" USING "btree" ("actionType");



CREATE INDEX "player_interaction_created_idx" ON "public"."PlayerInteractionEvent" USING "btree" ("createdAt");



CREATE INDEX "player_interaction_file_idx" ON "public"."PlayerInteractionEvent" USING "btree" ("fileId");



CREATE INDEX "player_interaction_user_idx" ON "public"."PlayerInteractionEvent" USING "btree" ("userId");



CREATE INDEX "settings_change_key_idx" ON "public"."SettingsChangeEvent" USING "btree" ("settingKey");



CREATE INDEX "settings_change_user_idx" ON "public"."SettingsChangeEvent" USING "btree" ("userId");



CREATE INDEX "user_daily_stats_date_idx" ON "public"."UserDailyStats" USING "btree" ("date");



CREATE INDEX "user_daily_stats_user_idx" ON "public"."UserDailyStats" USING "btree" ("userId");



CREATE OR REPLACE TRIGGER "player_event_stats_trigger" AFTER INSERT ON "public"."PlayerInteractionEvent" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_daily_stats_from_player_events"();



CREATE OR REPLACE TRIGGER "update_file_updated_at" BEFORE UPDATE ON "public"."File" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_transcription_updated_at" BEFORE UPDATE ON "public"."Transcription" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_updated_at" BEFORE UPDATE ON "public"."User" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."FileUploadEvent"
    ADD CONSTRAINT "FileUploadEvent_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "public"."File"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."FileUploadEvent"
    ADD CONSTRAINT "FileUploadEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."File"
    ADD CONSTRAINT "File_transcriptionId_fkey" FOREIGN KEY ("transcriptionId") REFERENCES "public"."Transcription"("id");



ALTER TABLE ONLY "public"."File"
    ADD CONSTRAINT "File_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id");



ALTER TABLE ONLY "public"."PageViewEvent"
    ADD CONSTRAINT "PageViewEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."PlayerInteractionEvent"
    ADD CONSTRAINT "PlayerInteractionEvent_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "public"."File"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."PlayerInteractionEvent"
    ADD CONSTRAINT "PlayerInteractionEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."SettingsChangeEvent"
    ADD CONSTRAINT "SettingsChangeEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Transcription"
    ADD CONSTRAINT "Transcription_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "public"."File"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Transcription"
    ADD CONSTRAINT "Transcription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id");



ALTER TABLE ONLY "public"."UserDailyStats"
    ADD CONSTRAINT "UserDailyStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE;



CREATE POLICY "Authenticated users can insert analytics events" ON "public"."FileUploadEvent" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "userId"));



CREATE POLICY "Authenticated users can insert and update page views" ON "public"."PageViewEvent" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "userId"));



CREATE POLICY "Authenticated users can insert page views" ON "public"."PageViewEvent" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "userId"));



CREATE POLICY "Authenticated users can insert player interactions" ON "public"."PlayerInteractionEvent" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "userId"));



CREATE POLICY "Authenticated users can insert settings changes" ON "public"."SettingsChangeEvent" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "userId"));



ALTER TABLE "public"."FileUploadEvent" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."PageViewEvent" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."PlayerInteractionEvent" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Service role can insert any analytics data" ON "public"."FileUploadEvent" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service role can insert any page views" ON "public"."PageViewEvent" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service role can insert any player interactions" ON "public"."PlayerInteractionEvent" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service role can insert any settings changes" ON "public"."SettingsChangeEvent" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service role can manage daily stats" ON "public"."UserDailyStats" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can read any analytics data" ON "public"."FileUploadEvent" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "Service role can read any page views" ON "public"."PageViewEvent" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "Service role can read any player interactions" ON "public"."PlayerInteractionEvent" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "Service role can read any settings changes" ON "public"."SettingsChangeEvent" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "Service role can update any page views" ON "public"."PageViewEvent" FOR UPDATE TO "service_role" USING (true);



ALTER TABLE "public"."SettingsChangeEvent" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."UserDailyStats" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Users can view only their own daily stats" ON "public"."UserDailyStats" FOR SELECT USING (("auth"."uid"() = "userId"));



CREATE POLICY "Users can view only their own page views" ON "public"."PageViewEvent" FOR SELECT USING (("auth"."uid"() = "userId"));



CREATE POLICY "Users can view only their own player interactions" ON "public"."PlayerInteractionEvent" FOR SELECT USING (("auth"."uid"() = "userId"));



CREATE POLICY "Users can view only their own settings changes" ON "public"."SettingsChangeEvent" FOR SELECT USING (("auth"."uid"() = "userId"));



CREATE POLICY "Users can view only their own upload events" ON "public"."FileUploadEvent" FOR SELECT USING (("auth"."uid"() = "userId"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


CREATE PUBLICATION "supabase_realtime_messages_publication" WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION "supabase_realtime_messages_publication" OWNER TO "supabase_admin";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."File";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."Transcription";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."get_user_audit_events"("user_id" "uuid", "limit_per_table" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_audit_events"("user_id" "uuid", "limit_per_table" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_audit_events"("user_id" "uuid", "limit_per_table" integer) TO "service_role";



GRANT ALL ON TABLE "public"."File" TO "anon";
GRANT ALL ON TABLE "public"."File" TO "authenticated";
GRANT ALL ON TABLE "public"."File" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_files"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_files"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_files"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_listening_stats"("user_id" "uuid", "days_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_listening_stats"("user_id" "uuid", "days_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_listening_stats"("user_id" "uuid", "days_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_daily_stats_from_player_events"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_daily_stats_from_player_events"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_daily_stats_from_player_events"() TO "service_role";


















GRANT ALL ON TABLE "public"."FileUploadEvent" TO "anon";
GRANT ALL ON TABLE "public"."FileUploadEvent" TO "authenticated";
GRANT ALL ON TABLE "public"."FileUploadEvent" TO "service_role";



GRANT ALL ON TABLE "public"."PageViewEvent" TO "anon";
GRANT ALL ON TABLE "public"."PageViewEvent" TO "authenticated";
GRANT ALL ON TABLE "public"."PageViewEvent" TO "service_role";



GRANT ALL ON TABLE "public"."PlayerInteractionEvent" TO "anon";
GRANT ALL ON TABLE "public"."PlayerInteractionEvent" TO "authenticated";
GRANT ALL ON TABLE "public"."PlayerInteractionEvent" TO "service_role";



GRANT ALL ON TABLE "public"."SettingsChangeEvent" TO "anon";
GRANT ALL ON TABLE "public"."SettingsChangeEvent" TO "authenticated";
GRANT ALL ON TABLE "public"."SettingsChangeEvent" TO "service_role";



GRANT ALL ON TABLE "public"."Transcription" TO "anon";
GRANT ALL ON TABLE "public"."Transcription" TO "authenticated";
GRANT ALL ON TABLE "public"."Transcription" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Transcription_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Transcription_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Transcription_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."User" TO "anon";
GRANT ALL ON TABLE "public"."User" TO "authenticated";
GRANT ALL ON TABLE "public"."User" TO "service_role";



GRANT ALL ON TABLE "public"."UserDailyStats" TO "anon";
GRANT ALL ON TABLE "public"."UserDailyStats" TO "authenticated";
GRANT ALL ON TABLE "public"."UserDailyStats" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;

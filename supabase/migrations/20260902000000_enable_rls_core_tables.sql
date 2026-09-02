-- Включаем Row Level Security на таблицах File, Transcription, User.
-- До этой миграции RLS на них не было: роль anon (её ключ лежит в публичном
-- бандле фронтенда) имела SELECT/INSERT/UPDATE/DELETE на все строки —
-- то есть любой мог прочитать все email'ы, все файлы и удалить чужие записи.
-- Supabase Security Advisor: rls_disabled_in_public.

-- ---------------------------------------------------------------------------
-- Вспомогательные функции
-- ---------------------------------------------------------------------------

-- Админ определяется по email из JWT.
-- Источник правды в коде: app/(withFooter)/admin/helpers.ts (isAdminEmail)
-- + app/api/admin/stats/route.ts (ADMIN_EMAIL / домен @lingvomonkeys.com).
-- При изменении списка админов правим оба места.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'email') IN ('sorokinvj@gmail.com', 'bichiko@gmail.com')
    OR (auth.jwt() ->> 'email') LIKE '%@lingvomonkeys.com',
    false
  );
$$;

-- Владелец публичной коллекции (страница /collection и её файлы доступны всем,
-- в том числе неавторизованным). Email продублирован в app/api/collection/route.ts.
CREATE OR REPLACE FUNCTION public.library_owner_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public."User" WHERE email = 'christrobs@gmail.com';
$$;

-- Функции вызываются внутри policy-выражений, поэтому EXECUTE нужен всем ролям.
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.library_owner_id() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- File
-- ---------------------------------------------------------------------------

ALTER TABLE public."File" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own or library files" ON public."File";
CREATE POLICY "Users can read own or library files"
  ON public."File" FOR SELECT
  USING (
    auth.uid() = "userId"
    OR is_library = true
    OR "userId" = public.library_owner_id()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Users can insert own files" ON public."File";
CREATE POLICY "Users can insert own files"
  ON public."File" FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can update own files" ON public."File";
CREATE POLICY "Users can update own files"
  ON public."File" FOR UPDATE TO authenticated
  USING (auth.uid() = "userId")
  WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can delete own files" ON public."File";
CREATE POLICY "Users can delete own files"
  ON public."File" FOR DELETE TO authenticated
  USING (auth.uid() = "userId");

-- ---------------------------------------------------------------------------
-- Transcription
-- ---------------------------------------------------------------------------

ALTER TABLE public."Transcription" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own or library transcriptions" ON public."Transcription";
CREATE POLICY "Users can read own or library transcriptions"
  ON public."Transcription" FOR SELECT
  USING (
    auth.uid() = "userId"
    OR "userId" = public.library_owner_id()
    OR EXISTS (
      SELECT 1 FROM public."File" f
      WHERE f.id = "Transcription"."fileId" AND f.is_library = true
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Users can insert own transcriptions" ON public."Transcription";
CREATE POLICY "Users can insert own transcriptions"
  ON public."Transcription" FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can update own transcriptions" ON public."Transcription";
CREATE POLICY "Users can update own transcriptions"
  ON public."Transcription" FOR UPDATE TO authenticated
  USING (auth.uid() = "userId")
  WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can delete own transcriptions" ON public."Transcription";
CREATE POLICY "Users can delete own transcriptions"
  ON public."Transcription" FOR DELETE TO authenticated
  USING (auth.uid() = "userId");

-- ---------------------------------------------------------------------------
-- User
-- ---------------------------------------------------------------------------
-- Вставка строки при регистрации идёт триггером handle_new_user()
-- (SECURITY DEFINER), он RLS не касается — отдельная policy не нужна.

ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public."User";
CREATE POLICY "Users can read own profile"
  ON public."User" FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- ---------------------------------------------------------------------------
-- SECURITY DEFINER RPC: убираем доступ у ролей, которым он не нужен.
-- Эти функции обходят RLS и принимают user_id параметром, то есть остаются
-- дырой того же класса, если оставить их вызываемыми из браузера.
-- ---------------------------------------------------------------------------

-- Не используются приложением вообще.
REVOKE EXECUTE ON FUNCTION public.get_user_files(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_library_count_for_user(uuid) FROM anon, authenticated;

-- Вызывается только из /api/admin/user-audit сервисным ключом.
REVOKE EXECUTE ON FUNCTION public.get_user_audit_events(uuid, integer) FROM anon, authenticated;

-- Вызываются из /api/admin/stats/user-details клиентом с сессией пользователя,
-- поэтому authenticated оставляем; anon — нет.
REVOKE EXECUTE ON FUNCTION public.count_page_views() FROM anon;
REVOKE EXECUTE ON FUNCTION public.count_player_interactions() FROM anon;

-- Админский дашборд (/api/admin/stats/*) ходит в аналитические таблицы
-- клиентом с сессией пользователя, а там RLS "только свои строки".
-- Из-за этого часть цифр в дашборде занижена — например settingsChanges
-- в /api/admin/stats/user-details считался только по строкам самого админа.
-- Добавляем админу право на чтение. Политики аддитивны: обычный пользователь
-- по-прежнему видит только свои события.

DROP POLICY IF EXISTS "Admins can read all upload events" ON public."FileUploadEvent";
CREATE POLICY "Admins can read all upload events"
  ON public."FileUploadEvent" FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can read all listening events" ON public."FileListeningEvent";
CREATE POLICY "Admins can read all listening events"
  ON public."FileListeningEvent" FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can read all page views" ON public."PageViewEvent";
CREATE POLICY "Admins can read all page views"
  ON public."PageViewEvent" FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can read all player interactions" ON public."PlayerInteractionEvent";
CREATE POLICY "Admins can read all player interactions"
  ON public."PlayerInteractionEvent" FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can read all settings changes" ON public."SettingsChangeEvent";
CREATE POLICY "Admins can read all settings changes"
  ON public."SettingsChangeEvent" FOR SELECT USING (public.is_admin());

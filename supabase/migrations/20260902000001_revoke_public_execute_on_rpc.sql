-- Дополнение к 20260902000000: REVOKE у anon/authenticated не сработал,
-- потому что EXECUTE на этих функциях выдан ещё и роли PUBLIC
-- (в ACL это запись "=X/postgres"), а она наследуется всеми.
-- Проверено на проде: после первой миграции анонимный ключ всё ещё получал
-- ответ от get_user_files и get_user_audit_events по чужому user_id.

REVOKE EXECUTE ON FUNCTION public.get_user_files(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_library_count_for_user(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_audit_events(uuid, integer)
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.count_page_views() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.count_player_interactions() FROM PUBLIC, anon;

-- Вызываются из /api/admin/stats/user-details клиентом с сессией пользователя.
GRANT EXECUTE ON FUNCTION public.count_page_views() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.count_player_interactions() TO authenticated, service_role;

-- Вызывается из /api/admin/user-audit сервисным ключом.
GRANT EXECUTE ON FUNCTION public.get_user_audit_events(uuid, integer) TO service_role;

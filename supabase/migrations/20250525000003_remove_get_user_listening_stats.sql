-- Удаление функции get_user_listening_stats, так как ее функциональность
-- теперь реализована через get_user_audit_events в коде приложения

DROP FUNCTION IF EXISTS get_user_listening_stats(UUID, INT);

COMMENT ON FUNCTION get_user_audit_events IS 'Возвращает все события аудита пользователя, которые используются для расчета статистики прослушивания';

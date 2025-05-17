-- Удаление устаревшей RPC-функции для получения статистики прослушивания
DROP FUNCTION IF EXISTS get_user_listening_stats(user_id UUID);

-- Примечание: функции count_player_interactions и count_page_views 
-- сохраняем, так как они все еще используются в API

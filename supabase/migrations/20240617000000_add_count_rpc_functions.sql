-- Функция для подсчета взаимодействий с плеером, сгруппированных по пользователям
CREATE OR REPLACE FUNCTION count_player_interactions()
RETURNS TABLE(userId UUID, count BIGINT) AS $$
BEGIN
  RETURN QUERY 
    SELECT "PlayerInteractionEvent"."userId"::UUID, COUNT(*)::BIGINT
    FROM "PlayerInteractionEvent"
    GROUP BY "PlayerInteractionEvent"."userId";
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для подсчета просмотров страниц, сгруппированных по пользователям
CREATE OR REPLACE FUNCTION count_page_views()
RETURNS TABLE(userId UUID, count BIGINT) AS $$
BEGIN
  RETURN QUERY 
    SELECT "PageViewEvent"."userId"::UUID, COUNT(*)::BIGINT
    FROM "PageViewEvent"
    GROUP BY "PageViewEvent"."userId";
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Предоставляем доступ к функциям для сервисной роли
GRANT EXECUTE ON FUNCTION count_player_interactions TO service_role;
GRANT EXECUTE ON FUNCTION count_page_views TO service_role;

-- Заполняем FileListeningEvent данными на основе пар play-pause из PlayerInteractionEvent
WITH play_events AS (
  SELECT 
    id, 
    "userId", 
    "fileId", 
    "fileName", 
    "createdAt" AS play_time,
    position
  FROM "PlayerInteractionEvent"
  WHERE "actionType" = 'play'
),

-- Находим ближайшие события pause для каждого play
play_with_next_pause AS (
  SELECT 
    play.id AS play_id,
    play."userId",
    play."fileId",
    play."fileName",
    play.play_time,
    (
      SELECT MIN(p."createdAt")
      FROM "PlayerInteractionEvent" p
      WHERE 
        p."actionType" = 'pause' AND
        p."userId" = play."userId" AND 
        p."fileId" = play."fileId" AND
        p."createdAt" > play.play_time
    ) AS pause_time
  FROM play_events play
),

-- Фильтруем и проверяем что нет других событий между play и pause
valid_play_pause_pairs AS (
  SELECT 
    play_id,
    p."userId",
    p."fileId",
    p."fileName",
    p.play_time AS start_time,
    p.pause_time AS end_time,
    -- Вычисляем разницу во времени в секундах между timestamp событий
    EXTRACT(EPOCH FROM (p.pause_time - p.play_time))::INTEGER AS duration_seconds
  FROM play_with_next_pause p
  WHERE 
    -- Проверяем, что событие pause существует
    p.pause_time IS NOT NULL AND
    -- Проверяем, что нет других событий между play и pause
    NOT EXISTS (
      SELECT 1 
      FROM "PlayerInteractionEvent" o
      WHERE 
        o."userId" = p."userId" AND
        o."fileId" = p."fileId" AND
        o."createdAt" > p.play_time AND
        o."createdAt" < p.pause_time AND
        o."actionType" NOT IN ('play', 'pause')
    )
)

-- Вставляем данные в таблицу FileListeningEvent
INSERT INTO "FileListeningEvent" (
  "userId", 
  "fileId", 
  "fileName", 
  "startTime", 
  "endTime", 
  "durationSeconds", 
  "totalPlaybackTimeMs",
  "createdAt"
)
SELECT 
  "userId",
  "fileId",
  "fileName",
  start_time,
  end_time,
  duration_seconds,
  (duration_seconds * 1000)::INTEGER AS total_playback_time_ms,
  start_time
FROM valid_play_pause_pairs
WHERE 
  -- Фильтруем события с разумной длительностью (от 5 секунд до 1 часа)
  duration_seconds BETWEEN 5 AND 3600 AND
  -- Предотвращаем дубликаты
  NOT EXISTS (
    SELECT 1 
    FROM "FileListeningEvent" e
    WHERE 
      e."userId" = valid_play_pause_pairs."userId" AND
      e."fileId" = valid_play_pause_pairs."fileId" AND
      e."startTime" = valid_play_pause_pairs.start_time
  );

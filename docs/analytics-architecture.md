# Архитектура системы аналитики

## Общая структура

Система аналитики пользовательских действий будет реализована на основе следующей архитектуры:

1. **Сбор данных** - клиентские компоненты для фиксации активности
2. **Хранение данных** - таблицы в Supabase для постоянного хранения
3. **Агрегация данных** - функции для формирования сводной аналитики
4. **Визуализация** - административный интерфейс для анализа данных

## Моделирование данных

### Основные таблицы

#### UserAction

Таблица для хранения всех действий пользователей:

```sql
CREATE TABLE "UserAction" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "actionType" TEXT NOT NULL,
  "entityId" UUID,
  "entityType" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "sessionId" UUID
);
```

- `actionType` - тип действия (upload, open, play, pause, seek, etc.)
- `entityId` - идентификатор связанного объекта (файл, страница)
- `entityType` - тип объекта (file, page, player)
- `metadata` - дополнительные данные в JSON формате
- `sessionId` - идентификатор пользовательской сессии

#### UserSession

Таблица для хранения информации о сессиях пользователей:

```sql
CREATE TABLE "UserSession" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "startTime" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "endTime" TIMESTAMP WITH TIME ZONE,
  "duration" INTEGER,
  "deviceInfo" JSONB
);
```

#### FilePlaybackStats

Таблица для хранения агрегированной информации о прослушивании файлов:

```sql
CREATE TABLE "FilePlaybackStats" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "fileId" UUID NOT NULL REFERENCES "File"("id") ON DELETE CASCADE,
  "totalListeningTime" INTEGER DEFAULT 0,
  "completionCount" INTEGER DEFAULT 0,
  "lastListenedAt" TIMESTAMP WITH TIME ZONE,
  "listeningProgress" FLOAT DEFAULT 0,
  "date" DATE NOT NULL
);
```

## Процесс логирования

1. **Клиент**:

   - Создает события при действиях пользователя
   - Отправляет их на сервер через API

2. **Сервер**:
   - Валидирует данные
   - Сохраняет их в таблицу `UserAction`
   - При необходимости обновляет агрегированные данные

## Интеграция в текущую архитектуру

Система аналитики интегрируется в существующий проект следующим образом:

1. **React-компоненты**:

   - Хук `useTrackAction` для логирования действий
   - HOC для отслеживания времени на странице

2. **API-маршруты**:

   - `/api/analytics/track` - для сохранения действий пользователя
   - `/api/analytics/stats` - для получения аналитических данных

3. **Миграции**:
   - Создание необходимых таблиц в базе данных

## Технические соображения

- Оптимизация производительности через пакетную обработку событий
- Периодическая агрегация данных для быстрой аналитики
- Индексы на часто запрашиваемых полях
- Политики RLS для обеспечения безопасности данных

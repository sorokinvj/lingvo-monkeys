# Система аналитики пользовательских действий

Этот документ описывает систему для отслеживания и анализа пользовательских действий в приложении.

## Обзор

Система аналитики собирает и хранит данные о различных пользовательских действиях:

1. Загрузка файлов
2. Прослушивание файлов
3. Просмотр страниц
4. Взаимодействие с плеером
5. Взаимодействие с транскрипцией
6. Изменение настроек

## Структура данных

### 1. Загрузка файлов (`FileUploadEvent`)

Отслеживает события загрузки новых файлов:

```sql
CREATE TABLE IF NOT EXISTS "FileUploadEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "fileId" UUID NOT NULL REFERENCES "File"("id") ON DELETE CASCADE,
  "fileName" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Прослушивание файлов (`FileListeningEvent`)

Отслеживает сеансы прослушивания аудиофайлов:

```sql
CREATE TABLE IF NOT EXISTS "FileListeningEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "fileId" UUID NOT NULL REFERENCES "File"("id") ON DELETE CASCADE,
  "startTime" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "endTime" TIMESTAMP WITH TIME ZONE,
  "durationSeconds" INTEGER,
  "date" DATE NOT NULL DEFAULT CURRENT_DATE
);
```

### 3. Просмотр страниц (`PageViewEvent`)

Отслеживает посещения страниц и время, проведенное на них:

```sql
CREATE TABLE IF NOT EXISTS "PageViewEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "path" TEXT NOT NULL,
  "enteredAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "isActive" BOOLEAN DEFAULT TRUE,
  "lastActivityAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "exitedAt" TIMESTAMP WITH TIME ZONE,
  "duration" INTEGER
);
```

### 4. Взаимодействие с плеером (`PlayerInteractionEvent`)

Отслеживает взаимодействие пользователя с аудиоплеером:

```sql
CREATE TABLE IF NOT EXISTS "PlayerInteractionEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "fileId" UUID NOT NULL REFERENCES "File"("id") ON DELETE CASCADE,
  "actionType" TEXT NOT NULL, -- play, pause, seek, speed_change, playback_complete
  "position" FLOAT, -- текущая позиция в секундах
  "value" FLOAT, -- для speed_change - новая скорость
  "metadata" JSONB, -- дополнительные данные
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Взаимодействие с транскрипцией (`TranscriptInteractionEvent`)

Отслеживает взаимодействие пользователя с транскрипцией:

```sql
CREATE TABLE IF NOT EXISTS "TranscriptInteractionEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "fileId" UUID NOT NULL REFERENCES "File"("id") ON DELETE CASCADE,
  "wordIndex" INTEGER, -- индекс слова в транскрипции
  "timestamp" FLOAT, -- временная метка в аудио
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 6. Изменение настроек (`SettingsChangeEvent`)

Отслеживает изменения пользовательских настроек:

```sql
CREATE TABLE IF NOT EXISTS "SettingsChangeEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "settingKey" TEXT NOT NULL,
  "oldValue" JSONB,
  "newValue" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Хуки для отслеживания

Для удобного использования системы аналитики созданы следующие React-хуки:

### `useAnalytics`

Основной хук для отправки событий аналитики. Содержит методы для отслеживания различных типов взаимодействий:

```typescript
import { useUser } from '@/hooks/useUser';

export const useAnalytics = () => {
  const { user } = useUser();

  const trackEvent = async (eventType, data) => {
    if (!user) return;

    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, data }),
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  };

  // Методы для отслеживания разных типов событий
  const trackFileUpload = (data) => trackEvent('file_upload', data);
  const trackFileListeningStart = (data) => trackEvent('file_listening', data);
  const trackPlayerInteraction = (data) =>
    trackEvent('player_interaction', data);
  // и т.д.

  return {
    trackFileUpload,
    trackFileListeningStart,
    trackFileListeningEnd,
    trackPlayerInteraction,
    trackTranscriptInteraction,
    trackSettingsChange,
  };
};
```

### `usePageTracking`

Хук для автоматического отслеживания просмотра страниц:

```typescript
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@/hooks/useUser';

export const usePageTracking = () => {
  const pathname = usePathname();
  const { user } = useUser();
  const [pageViewId, setPageViewId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Отслеживание входа на страницу
    const trackPageView = async () => {
      try {
        const response = await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'page_view',
            data: { path: pathname },
          }),
        });

        const data = await response.json();
        if (data.success && data.id) {
          setPageViewId(data.id);
        }
      } catch (error) {
        console.error('Error tracking page view:', error);
      }
    };

    // Отслеживание выхода со страницы
    const trackPageExit = async () => {
      if (pageViewId) {
        try {
          await fetch('/api/analytics/page-exit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pageViewId }),
          });
        } catch (error) {
          console.error('Error tracking page exit:', error);
        }
      }
    };

    // Heartbeat для отслеживания активности
    let heartbeatInterval: NodeJS.Timeout;

    if (pageViewId) {
      heartbeatInterval = setInterval(async () => {
        try {
          await fetch('/api/analytics/heartbeat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pageViewId }),
          });
        } catch (error) {
          console.error('Error sending heartbeat:', error);
        }
      }, 30000); // каждые 30 секунд
    }

    trackPageView();

    return () => {
      trackPageExit();
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    };
  }, [pathname, user]);
};
```

## Интеграция с компонентами

### Отслеживание действий плеера

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

const Player = ({ fileId }) => {
  const { trackPlayerInteraction } = useAnalytics();

  const handlePlay = () => {
    trackPlayerInteraction({
      fileId,
      actionType: 'play',
      position: currentTime,
    });
    // логика воспроизведения
  };

  // Другие обработчики...
};
```

### Отслеживание изменений настроек

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

const Settings = () => {
  const { trackSettingsChange } = useAnalytics();

  const handleFontSizeChange = (newSize) => {
    trackSettingsChange({
      settingKey: 'fontSize',
      oldValue: currentSettings.fontSize,
      newValue: newSize,
    });
    // обновление настроек
  };

  // Другие обработчики...
};
```

## Безопасность и приватность

- Все таблицы аналитики используют Row Level Security (RLS), чтобы пользователи могли видеть только свои данные.
- Приложение отправляет только агрегированные данные, не содержащие персональную информацию.
- Все взаимодействия с API требуют аутентификации.

## API эндпоинты

### `/api/analytics/track`

POST-запрос для отправки события аналитики:

```typescript
// Пример запроса
{
  "eventType": "file_upload",
  "data": {
    "fileId": "123e4567-e89b-12d3-a456-426614174000",
    "fileName": "lecture.mp3",
    "fileSize": 1024000
  }
}
```

### `/api/analytics/heartbeat`

POST-запрос для обновления активности пользователя на странице:

```typescript
// Пример запроса
{
  "pageViewId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### `/api/analytics/page-exit`

POST-запрос для отслеживания выхода со страницы:

```typescript
// Пример запроса
{
  "pageViewId": "123e4567-e89b-12d3-a456-426614174000"
}
```

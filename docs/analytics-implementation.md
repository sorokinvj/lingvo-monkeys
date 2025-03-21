# Реализация системы аналитики на клиенте

Данный документ описывает реализацию клиентской части системы аналитики пользовательских действий.

## Хуки для отслеживания действий

### useTrackAction

Создадим хук для отслеживания действий пользователя:

```tsx
// hooks/useTrackAction.ts
import { useCallback } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useAuthContext } from '@/app/AuthContext';

type ActionType =
  | 'file_upload'
  | 'file_open'
  | 'playback_start'
  | 'playback_pause'
  | 'playback_seek'
  | 'playback_complete'
  | 'playback_speed_change'
  | 'page_view';

type EntityType = 'file' | 'page' | 'player';

interface TrackActionParams {
  actionType: ActionType;
  entityId?: string;
  entityType?: EntityType;
  metadata?: Record<string, any>;
}

export function useTrackAction() {
  const supabase = useSupabaseClient();
  const { user } = useAuthContext();

  const trackAction = useCallback(
    async ({
      actionType,
      entityId,
      entityType,
      metadata,
    }: TrackActionParams) => {
      if (!user) return;

      try {
        const { error } = await supabase.from('UserAction').insert({
          userId: user.id,
          actionType,
          entityId,
          entityType,
          metadata,
        });

        if (error) {
          console.error('Error tracking user action:', error);
        }
      } catch (error) {
        console.error('Failed to track user action:', error);
      }
    },
    [supabase, user]
  );

  return trackAction;
}
```

### usePageTracking

Создадим хук для отслеживания просмотра страниц:

```tsx
// hooks/usePageTracking.ts
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useAuthContext } from '@/app/AuthContext';
import { useTrackAction } from './useTrackAction';

export function usePageTracking() {
  const pathname = usePathname();
  const supabase = useSupabaseClient();
  const { user } = useAuthContext();
  const trackAction = useTrackAction();

  useEffect(() => {
    if (!user) return;

    let enteredAt = new Date();
    let pageViewId: string | null = null;

    // Создаем запись о просмотре страницы
    const createPageView = async () => {
      try {
        const { data, error } = await supabase
          .from('PageView')
          .insert({
            userId: user.id,
            path: pathname,
            enteredAt: enteredAt.toISOString(),
          })
          .select('id')
          .single();

        if (error) {
          console.error('Error creating page view:', error);
          return;
        }

        pageViewId = data.id;

        // Трекаем действие
        trackAction({
          actionType: 'page_view',
          entityType: 'page',
          entityId: pageViewId,
          metadata: { path: pathname },
        });
      } catch (error) {
        console.error('Failed to create page view:', error);
      }
    };

    // Обновляем запись при уходе со страницы
    const updatePageView = async () => {
      if (!pageViewId) return;

      const exitedAt = new Date();
      const durationMs = exitedAt.getTime() - enteredAt.getTime();
      const durationSec = Math.floor(durationMs / 1000);

      try {
        const { error } = await supabase
          .from('PageView')
          .update({
            exitedAt: exitedAt.toISOString(),
            duration: durationSec,
          })
          .eq('id', pageViewId);

        if (error) {
          console.error('Error updating page view:', error);
        }
      } catch (error) {
        console.error('Failed to update page view:', error);
      }
    };

    createPageView();

    return () => {
      updatePageView();
    };
  }, [pathname, supabase, user, trackAction]);
}
```

## Компоненты для отслеживания

### Трекинг аудио-плеера

Интегрируем трекинг в компонент плеера:

```tsx
// app/(noFooter)/play/[id]/components/Player.tsx
import { useTrackAction } from '@/hooks/useTrackAction';

// ... остальной код компонента

const Player: React.FC<PlayerProps> = ({
  publicUrl,
  jumpToPositionMS,
  onTimeUpdate,
  onWaveformSeek,
}) => {
  // ... существующие хуки
  const trackAction = useTrackAction();

  // ... остальной код

  // Добавляем трекинг при воспроизведении/паузе
  const onPlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();

      // Трекаем действие
      trackAction({
        actionType: isPlaying ? 'playback_pause' : 'playback_start',
        entityType: 'player',
        entityId: fileId, // предполагается, что fileId передается в props
        metadata: {
          position: wavesurferRef.current.getCurrentTime(),
          isPlaying: !isPlaying,
        },
      });
    }
  };

  // Добавляем трекинг при перемотке
  useEffect(() => {
    if (wavesurferRef.current) {
      const handleSeek = () => {
        const position = wavesurferRef.current?.getCurrentTime() || 0;
        trackAction({
          actionType: 'playback_seek',
          entityType: 'player',
          entityId: fileId,
          metadata: { position },
        });
      };

      wavesurferRef.current.on('seek', handleSeek);

      return () => {
        wavesurferRef.current?.un('seek', handleSeek);
      };
    }
  }, [trackAction, fileId]);

  // Добавляем трекинг при изменении скорости
  const changePlaybackRate = useCallback(
    (increment: boolean) => {
      if (wavesurferRef.current) {
        setPlaybackRate((prevRate) => {
          const newRate = increment ? prevRate + 0.1 : prevRate - 0.1;
          const roundedRate = Number(newRate.toFixed(1));
          wavesurferRef.current?.setPlaybackRate(roundedRate);

          // Трекаем изменение скорости
          trackAction({
            actionType: 'playback_speed_change',
            entityType: 'player',
            entityId: fileId,
            metadata: {
              oldRate: prevRate,
              newRate: roundedRate,
            },
          });

          return roundedRate;
        });
      }
    },
    [trackAction, fileId]
  );

  // ... остальной код компонента
};
```

### Трекинг загрузки файлов

Добавим трекинг в компонент загрузки файлов:

```tsx
// app/(withFooter)/upload/components/UploadPage.tsx
import { useTrackAction } from '@/hooks/useTrackAction';

const UploadPage: React.FC = () => {
  // ... существующие хуки и состояния
  const trackAction = useTrackAction();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // ... существующий код

      try {
        // ... существующий код для загрузки

        // После успешной загрузки трекаем действие
        trackAction({
          actionType: 'file_upload',
          entityType: 'file',
          entityId: publicUrl, // или другой идентификатор файла
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            uploadDuration: timings.total,
          },
        });

        // ... остальной код
      } catch (error) {
        // ... обработка ошибок
      }
    },
    // ... остальные параметры
  });

  // ... остальной код компонента
};
```

## Настройка отслеживания на уровне приложения

Добавим отслеживание страниц в корневой компонент:

```tsx
// app/providers.tsx
'use client';

import React from 'react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { usePageTracking } from '@/hooks/usePageTracking';

const AppProviders = ({ children }: { children: React.ReactNode }) => {
  // Инициализируем трекинг страниц
  usePageTracking();

  // ... остальной код провайдеров

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        {/* ... другие провайдеры */}
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default AppProviders;
```

## API-маршруты для аналитики

Создадим API-маршруты для сбора и получения аналитических данных:

```tsx
// app/api/analytics/track/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const actionData = await req.json();

    // Проверяем обязательные поля
    if (!actionData.actionType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Добавляем идентификатор пользователя
    actionData.userId = user.id;

    const { error } = await supabase.from('UserAction').insert(actionData);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Заключение

Эта реализация позволяет отслеживать все ключевые действия пользователей:

1. Загрузку файлов
2. Открытие файлов
3. Взаимодействие с плеером (воспроизведение, пауза, перемотка)
4. Просмотр страниц и время, проведенное на них

Агрегированные данные будут доступны для анализа и помогут улучшить пользовательский опыт.

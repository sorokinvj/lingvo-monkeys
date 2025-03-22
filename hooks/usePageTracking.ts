import { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@/hooks/useUser';

/**
 * Хук для отслеживания просмотра страниц с использованием heartbeat-механизма
 */
export function usePageTracking() {
  const pathname = usePathname();
  const { data: user } = useUser();
  const [pageViewId, setPageViewId] = useState<string | null>(null);
  const previousPathname = useRef<string | null>(null);

  // Для хранения предыдущего ID, чтобы обеспечить очистку даже после смены страницы
  const previousPageViewRef = useRef<string | null>(null);

  // Флаг для отслеживания, была ли уже создана запись для текущего пути
  const hasCreatedViewRef = useRef<boolean>(false);

  // Сохраняем ID в ref для доступа в cleanup
  useEffect(() => {
    if (pageViewId) {
      previousPageViewRef.current = pageViewId;
    }
  }, [pageViewId]);

  // Функция для обновления времени выхода со страницы (синхронная версия)
  const updatePageExit = useCallback(async (viewId: string) => {
    try {
      // Используем navigator.sendBeacon для гарантированной отправки перед выгрузкой страницы
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify({ pageViewId: viewId })], {
          type: 'application/json',
        });
        return navigator.sendBeacon('/api/analytics/page-exit', blob);
      } else {
        // Fallback на обычный fetch
        await fetch('/api/analytics/page-exit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pageViewId: viewId }),
          // Использование keepalive для поддержания соединения
          keepalive: true,
        });
        return true;
      }
    } catch (error) {
      console.error('Failed to update page exit:', error);
      return false;
    }
  }, []);

  // Функция для создания записи о просмотре страницы
  const createPageView = useCallback(async (path: string) => {
    try {
      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: 'page_view',
          data: {
            path: path,
            enteredAt: new Date().toISOString(),
            isActive: true,
            lastActivityAt: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        console.error('Error creating page view:', await response.json());
        return;
      }

      // Получаем ID созданной записи
      const data = await response.json();

      if (data.success && data.id) {
        setPageViewId(data.id);
        hasCreatedViewRef.current = true;
      } else {
        console.error('Invalid response format:', data);
      }
    } catch (error) {
      console.error('Failed to create page view:', error);
    }
  }, []);

  // Основной эффект для отслеживания просмотра страниц
  useEffect(() => {
    if (!user || !pathname) return;

    // Сбрасываем флаг при изменении пути
    if (previousPathname.current !== pathname) {
      hasCreatedViewRef.current = false;
    }

    // Если путь изменился, отправляем событие выхода для предыдущего пути
    if (
      previousPathname.current &&
      previousPathname.current !== pathname &&
      previousPageViewRef.current
    ) {
      updatePageExit(previousPageViewRef.current);

      // Сбрасываем предыдущий ID после отправки
      previousPageViewRef.current = null;
    }

    // Обновляем текущий путь
    previousPathname.current = pathname;

    // Создаем новую запись только если еще не создали для этого пути
    if (!hasCreatedViewRef.current) {
      createPageView(pathname);
    }

    // Обработчик закрытия вкладки
    const handleBeforeUnload = () => {
      if (pageViewId) {
        updatePageExit(pageViewId);
      }
    };

    // Обновляем запись при уходе со страницы или закрытии вкладки
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);

      // Вызываем обновление при размонтировании компонента только если
      // это действительно уход со страницы, а не просто перерендер
      if (pageViewId && previousPathname.current === pathname) {
        updatePageExit(pageViewId);
      }
    };
  }, [pathname, user, pageViewId, updatePageExit, createPageView]);

  // Настройка периодических heartbeat-сигналов
  useEffect(() => {
    if (!user || !pageViewId) return;

    // Функция для отправки heartbeat
    const sendHeartbeat = async () => {
      try {
        await fetch('/api/analytics/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pageViewId }),
        });
      } catch (error) {}
    };

    // Отправляем сигнал каждые 10 секунд
    const interval = setInterval(sendHeartbeat, 10000);

    // Отправляем начальный heartbeat
    sendHeartbeat();

    return () => {
      clearInterval(interval);
    };
  }, [pageViewId, user]);
}

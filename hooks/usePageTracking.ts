import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@/hooks/useUser';

/**
 * Хук для отслеживания просмотра страниц с использованием heartbeat-механизма
 */
export function usePageTracking() {
  const pathname = usePathname();
  const { data: user } = useUser();
  const [pageViewId, setPageViewId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    let enteredAt = new Date();

    // Функция для создания записи о просмотре страницы
    const createPageView = async () => {
      try {
        const response = await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventType: 'page_view',
            data: {
              path: pathname,
              enteredAt: enteredAt.toISOString(),
              isActive: true,
              lastActivityAt: enteredAt.toISOString(),
            },
          }),
        });

        if (!response.ok) {
          console.error('Error creating page view:', await response.json());
          return;
        }

        // Получаем ID созданной записи
        const { pageViewId } = await response.json();
        setPageViewId(pageViewId);
      } catch (error) {
        console.error('Failed to create page view:', error);
      }
    };

    // Функция для обновления времени выхода со страницы
    const updatePageExit = async () => {
      if (!pageViewId) return;

      try {
        await fetch('/api/analytics/page-exit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pageViewId }),
        });
      } catch (error) {
        console.error('Failed to update page exit:', error);
      }
    };

    // Создаем запись о просмотре страницы
    createPageView();

    // Обновляем запись при уходе со страницы или закрытии вкладки
    window.addEventListener('beforeunload', updatePageExit);

    return () => {
      window.removeEventListener('beforeunload', updatePageExit);
      updatePageExit();
    };
  }, [pathname, user]);

  // Настройка периодических heartbeat-сигналов
  useEffect(() => {
    if (!user || !pageViewId) return;

    const sendHeartbeat = async () => {
      try {
        await fetch('/api/analytics/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pageViewId }),
        });
      } catch (error) {
        console.error('Failed to send heartbeat:', error);
      }
    };

    // Отправляем сигнал каждые 30 секунд
    const interval = setInterval(sendHeartbeat, 30000);

    // Также отправляем сигнал при активности пользователя
    const activityHandler = () => {
      sendHeartbeat();
    };

    window.addEventListener('mousemove', activityHandler, { passive: true });
    window.addEventListener('keydown', activityHandler, { passive: true });
    window.addEventListener('click', activityHandler, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', activityHandler);
      window.removeEventListener('keydown', activityHandler);
      window.removeEventListener('click', activityHandler);
    };
  }, [pageViewId, user]);
}

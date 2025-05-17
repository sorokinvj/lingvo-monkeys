import { isAdminEmail } from '../../helpers';
import { AnalyticsEvent, UserAuditData } from './types';

// Форматирование времени
export const formatEventTime = (date: string): string => {
  const eventDate = new Date(date);
  return eventDate.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Группировка событий по дням
export const groupEventsByDay = (events: AnalyticsEvent[]) => {
  const grouped: Record<string, AnalyticsEvent[]> = {};

  events
    .filter((event) => event.eventType !== 'page_view')
    .forEach((event) => {
      const date = new Date(event.createdAt);
      const dateKey = date.toLocaleDateString('ru-RU');

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }

      grouped[dateKey].push(event);
    });

  // Сортируем дни по убыванию (сначала новые)
  return Object.entries(grouped).sort(([dateA], [dateB]) => {
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
};

// Обработка данных аудита пользователя
export const processUserAuditData = (
  auditData: UserAuditData
): { events: AnalyticsEvent[]; fileNames: Record<string, string> } => {
  if (!auditData) {
    return { events: [], fileNames: {} };
  }

  // Преобразуем каждый тип события, добавляя eventType
  const uploadEvents = auditData.upload_events.map((event) => ({
    ...event,
    eventType: 'file_upload' as const,
  }));

  const settingsEvents = auditData.settings_events.map((event) => ({
    ...event,
    eventType: 'settings_change' as const,
  }));

  // Преобразуем события просмотра страницы с /play/ в события прослушивания файлов
  const listeningEvents: AnalyticsEvent[] = auditData.listening_events
    ? auditData.listening_events.map((event) => ({
        ...event,
        eventType: 'file_listening' as const,
      }))
    : [];
  const pageViewEvents = auditData.page_view_events.map((event) => {
    const transformed = {
      ...event,
      eventType: 'page_view' as const,
    };
    return transformed;
  });

  // Объединяем все события в один массив и сортируем по времени
  const events = [
    ...uploadEvents,
    //...playerEvents, // Исключаем события взаимодействия с плеером
    ...settingsEvents,
    ...pageViewEvents.filter((event) => !event.path?.includes('/play/')), // Исключаем события просмотра страниц /play/
    ...listeningEvents, // Добавляем новые события прослушивания
  ].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }) as AnalyticsEvent[];

  // Создаем словарь имен файлов из событий загрузки и прослушивания
  const fileNames: Record<string, string> = {};

  // Добавляем имена из загруженных файлов
  auditData.upload_events.forEach((event) => {
    if (event.fileId && event.fileName) {
      fileNames[event.fileId] = event.fileName;
    }
  });

  // Добавляем имена из прослушиваемых файлов (важно для библиотечных файлов)
  if (auditData.listening_events) {
    auditData.listening_events.forEach((event) => {
      if (event.fileId && event.fileName) {
        fileNames[event.fileId] = event.fileName;
      }
    });
  }

  return { events, fileNames };
};

const getFileListeningDescription = (
  fileName: string,
  durationSeconds: number
) => {
  if (durationSeconds < 60) {
    return `Занимался с ${fileName} ${durationSeconds} секунд`;
  }

  const minutesWithSeconds = (durationSeconds / 60).toFixed(2);
  return `Занимался с ${fileName} ${minutesWithSeconds} минут`;
};

// Получаем описание события для отображения
export const getEventDescription = (
  event: AnalyticsEvent,
  fileNames: Record<string, string>
): string | null => {
  const fileName =
    event.fileName ||
    (event.fileId && fileNames[event.fileId]) ||
    'Неизвестный файл';

  switch (event.eventType) {
    case 'file_upload':
      return `Загружен файл: ${fileName}`;

    case 'settings_change':
      return `Изменена настройка: ${event.settingKey} на ${event.newValue || 'Неизвестно'}`;

    case 'file_listening':
      return getFileListeningDescription(fileName, event.durationSeconds);

    case 'page_view':
      return null;

    default:
      return '';
  }
};

// Функция для получения данных аудита пользователя с сервера
export const fetchUserAuditData = async (
  email: string,
  currentUserEmail?: string
): Promise<UserAuditData> => {
  try {
    if (!email) {
      throw new Error('Email is required');
    }

    // Проверяем, что текущий пользователь - администратор
    if (currentUserEmail && !isAdminEmail(currentUserEmail)) {
      throw new Error('You must be logged in as admin to view audit data');
    }

    // Определяем API URL без использования window для работы и на сервере, и на клиенте
    // Используем относительный URL на сервере и абсолютный URL на клиенте
    const apiUrl =
      typeof window === 'undefined'
        ? `/api/admin/user-audit?email=${email}`
        : new URL(
            `/api/admin/user-audit?email=${email}`,
            window.location.origin
          ).toString();

    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `Failed to fetch audit data: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user audit data:', error);
    throw error;
  }
};

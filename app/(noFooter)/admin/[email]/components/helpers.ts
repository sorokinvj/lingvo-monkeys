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

// Функция для форматирования секунд в удобочитаемый формат времени
export function formatListeningTime(seconds: number): string {
  if (!seconds) return '0 мин';
  if (seconds < 60) return `${seconds} сек`;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} ч ${minutes} мин`;
  }
  return `${minutes} мин`;
}

// Группировка событий по дням с агрегацией событий прослушивания
export const groupEventsByDay = (events: AnalyticsEvent[]) => {
  const grouped: Record<string, AnalyticsEvent[]> = {};
  const aggregatedListeningByDay: Record<string, Record<string, number>> = {};

  // Сначала фильтруем события и группируем их по дням
  events
    .filter((event) => event.eventType !== 'page_view')
    .forEach((event) => {
      const date = new Date(event.createdAt);
      const dateKey = date.toLocaleDateString('ru-RU');

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }

      // Если это событие прослушивания, агрегируем его
      if (event.eventType === 'file_listening') {
        // Инициализируем агрегаторы для этого дня, если не существуют
        if (!aggregatedListeningByDay[dateKey]) {
          aggregatedListeningByDay[dateKey] = {};
        }

        // Используем имя файла или fileId как ключ
        const fileKey = event.fileName || event.fileId || 'unknown';

        // Увеличиваем общее время прослушивания для этого файла
        if (!aggregatedListeningByDay[dateKey][fileKey]) {
          aggregatedListeningByDay[dateKey][fileKey] = 0;
        }
        aggregatedListeningByDay[dateKey][fileKey] +=
          event.durationSeconds || 0;
      } else {
        // Если это не событие прослушивания, добавляем как обычно
        grouped[dateKey].push(event);
      }
    });

  // Теперь добавляем агрегированные события прослушивания
  Object.entries(aggregatedListeningByDay).forEach(([dateKey, files]) => {
    Object.entries(files).forEach(([fileKey, totalDuration]) => {
      if (totalDuration > 0) {
        // Находим первое событие прослушивания этого файла за день для получения образца
        const originalEvents = events.filter(
          (e) =>
            e.eventType === 'file_listening' &&
            (e.fileName === fileKey || e.fileId === fileKey) &&
            new Date(e.createdAt).toLocaleDateString('ru-RU') === dateKey
        );

        if (originalEvents.length > 0) {
          // Берем самое раннее событие дня как основу
          const baseEvent = [...originalEvents].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )[0];

          // Создаем "синтетическое" событие на основе первого
          const aggregatedEvent: AnalyticsEvent = {
            ...baseEvent,
            durationSeconds: totalDuration,
            // Сохраняем оригинальный ID, чтобы React не жаловался на дубликаты ключей
            id: `${baseEvent.id}_aggregated`,
          };

          grouped[dateKey].push(aggregatedEvent);
        }
      }
    });
  });

  // Для каждого дня удаляем оригинальные события прослушивания,
  // так как мы заменили их агрегированными
  Object.keys(grouped).forEach((dateKey) => {
    grouped[dateKey] = grouped[dateKey].filter(
      (event) =>
        event.eventType !== 'file_listening' || event.id.includes('_aggregated')
    );

    // Сортируем события по времени (сначала новые)
    grouped[dateKey].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
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

// Форматирование времени прослушивания в более читабельном виде
const getFileListeningDescription = (
  fileName: string,
  durationSeconds: number
) => {
  if (durationSeconds < 60) {
    return `Занимался с ${fileName} ${durationSeconds} секунд`;
  }

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  if (minutes < 60) {
    // Меньше часа - отображаем минуты и секунды
    if (seconds === 0) {
      return `Занимался с ${fileName} ${minutes} минут`;
    }
    return `Занимался с ${fileName} ${minutes} мин. ${seconds} сек.`;
  } else {
    // Больше часа - отображаем часы и минуты
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `Занимался с ${fileName} ${hours} часов`;
    }
    return `Занимался с ${fileName} ${hours} ч. ${remainingMinutes} мин.`;
  }
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

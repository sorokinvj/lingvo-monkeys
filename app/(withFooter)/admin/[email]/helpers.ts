import { isAdminEmail } from '../helpers';

// Интерфейсы для типизации данных
export interface UserFile {
  id: string;
  name: string;
}

export interface Event {
  id: string;
  userId: string;
  eventType: string;
  createdAt: string;
  [key: string]: any;
}

export interface EventsResult {
  uploadEvents: Event[];
  listeningEvents: Event[];
  playerEvents: Event[];
  settingsEvents: Event[];
  pageViewEvents: Event[];
}

export interface UserAuditData {
  user: { email: string; id: string };
  files: UserFile[];
  fileNames: Record<string, string>;
  events: EventsResult;
}

// Функция для получения описания события
export function getEventDescription(
  event: Event,
  fileNames: Record<string, string>
): string {
  const fileName =
    event.fileName || fileNames[event.fileId] || 'Неизвестный файл';

  switch (event.eventType) {
    case 'file_upload':
      return `Загрузил файл "${fileName}" - ${event.status}${event.error ? ` - Ошибка: ${event.error}` : ''}`;
    case 'file_listening':
      return `Прослушал "${fileName}" с ${event.startTime} по ${event.endTime}`;
    case 'player_interaction':
      let actionDescription = '';

      if (event.actionType === 'play') {
        actionDescription = 'Запустил воспроизведение';
      } else if (event.actionType === 'pause') {
        actionDescription = 'Поставил на паузу';
      } else if (event.actionType === 'seek') {
        actionDescription = 'Перемотал к позиции';
        if (event.metadata?.positionPercent) {
          actionDescription += ` ${event.metadata.positionPercent}%`;
        }
      } else {
        actionDescription = event.actionType || 'Взаимодействовал с плеером';
      }

      return `${actionDescription} (файл "${fileName}")`;
    case 'settings_change':
      const settingName = event.settingKey || 'настройку';
      let settingValue = '';

      if (event.settingKey === 'fontSize') {
        settingValue = event.newValue
          ? `${event.newValue}x`
          : String(event.newValue);
      } else if (event.settingKey === 'lineHeight') {
        settingValue = event.newValue
          ? `${event.newValue}x`
          : String(event.newValue);
      } else {
        settingValue = String(event.newValue);
      }

      return `Изменил ${settingName}: ${settingValue}`;
    case 'page_view':
      const duration = event.exitedAt
        ? new Date(event.exitedAt).getTime() -
          new Date(event.enteredAt).getTime()
        : null;

      let formattedDuration = 'в процессе';
      if (duration !== null) {
        const seconds = Math.floor(duration / 1000);
        if (seconds < 60) {
          formattedDuration = `${seconds} сек`;
        } else {
          formattedDuration = `${Math.floor(seconds / 60)} мин ${seconds % 60} сек`;
        }
      }

      return `Посетил страницу ${event.path} (${formattedDuration})`;
    default:
      return `Неизвестное событие: ${event.eventType}`;
  }
}

// Функция для получения данных аудита пользователя на клиенте
export async function fetchUserAuditData(
  email: string
): Promise<UserAuditData> {
  const response = await fetch(
    `/api/admin/user-audit?email=${encodeURIComponent(email)}`,
    {
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Failed to fetch user audit data: ${errorData.error || response.statusText}`
    );
  }

  return await response.json();
}

// Функция для получения данных аудита пользователя на сервере
export async function fetchUserAuditDataServer(
  email: string,
  currentUserEmail: string | null | undefined
): Promise<UserAuditData> {
  // Определяем базовый URL для запросов на сервере
  if (!isAdminEmail(currentUserEmail)) {
    throw new Error('404');
  }
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.VERCEL_URL ||
    'http://localhost:3000';

  console.log('baseUrl', baseUrl);

  const url = new URL(`/api/admin/user-audit`, baseUrl);
  url.searchParams.append('email', email);

  const response = await fetch(url.toString(), {
    cache: 'no-store',
    headers: {
      'x-forwarded-host': new URL(baseUrl).host,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Failed to fetch user audit data: ${errorData.error || response.statusText}`
    );
  }

  return await response.json();
}

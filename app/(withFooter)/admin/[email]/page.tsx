import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function UserAuditPage({
  params,
}: {
  params: { email: string };
}) {
  const supabase = createClient();
  const adminClient = createClient({ useServiceRole: true });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Проверка на админа
  const { data: userData } = await supabase
    .from('User')
    .select('email, id')
    .eq('id', user.id)
    .single();

  const isAdmin =
    userData?.email === 'sorokinvj@gmail.com' ||
    userData?.email === 'bichiko@gmail.com';

  if (!isAdmin) {
    redirect('/');
  }

  // Получаем userId по email
  const decodedEmail = decodeURIComponent(params.email);

  const { data: targetUser } = await adminClient
    .from('User')
    .select('id, email')
    .eq('email', decodedEmail)
    .single();

  if (!targetUser) {
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Пользователь не найден</h1>
        <p>Пользователь с email {decodedEmail} не найден в системе</p>
      </div>
    );
  }

  // Получаем все события загрузки файлов пользователя
  const { data: uploadEvents } = await adminClient
    .from('FileUploadEvent')
    .select('*')
    .eq('userId', targetUser.id)
    .order('createdAt', { ascending: false });

  // Получаем все события прослушивания файлов
  const { data: listeningEvents } = await adminClient
    .from('FileListeningEvent')
    .select('*')
    .eq('userId', targetUser.id)
    .order('createdAt', { ascending: false });

  // Получаем все события взаимодействия с плеером
  const { data: playerEvents } = await adminClient
    .from('PlayerInteractionEvent')
    .select('*')
    .eq('userId', targetUser.id)
    .order('createdAt', { ascending: false });

  // Получаем все события изменения настроек
  const { data: settingsEvents } = await adminClient
    .from('SettingsChangeEvent')
    .select('*')
    .eq('userId', targetUser.id)
    .order('createdAt', { ascending: false });

  // Получаем все визиты страниц
  const { data: pageViewEvents } = await adminClient
    .from('PageViewEvent')
    .select('*')
    .eq('userId', targetUser.id)
    .order('enteredAt', { ascending: false });

  // Получаем все файлы пользователя для связывания с событиями
  const { data: userFiles } = await adminClient
    .from('File')
    .select('id, name')
    .eq('userId', targetUser.id);

  // Создаем словарь для быстрого доступа к названиям файлов
  const fileNames: Record<string, string> = {};
  if (userFiles) {
    userFiles.forEach((file) => {
      fileNames[file.id] = file.name;
    });
  }

  // Объединяем все события в один массив
  const allEvents = [
    ...(uploadEvents || []).map((event) => ({
      ...event,
      eventType: 'file_upload',
      fileName: fileNames[event.fileId] || event.fileName || 'Неизвестный файл',
    })),
    ...(listeningEvents || []).map((event) => ({
      ...event,
      eventType: 'file_listening',
      fileName: fileNames[event.fileId] || 'Неизвестный файл',
    })),
    ...(playerEvents || []).map((event) => ({
      ...event,
      eventType: 'player_interaction',
      fileName: fileNames[event.fileId] || 'Неизвестный файл',
    })),
    ...(settingsEvents || []).map((event) => ({
      ...event,
      eventType: 'settings_change',
    })),
    ...(pageViewEvents || []).map((event) => ({
      ...event,
      eventType: 'page_view',
      createdAt: event.enteredAt, // Для унификации сортировки
    })),
  ];

  // Сортируем все события по времени (от новых к старым)
  allEvents.sort((a, b) => {
    const dateA = new Date(a.createdAt || a.startTime || a.enteredAt);
    const dateB = new Date(b.createdAt || b.startTime || b.enteredAt);
    return dateB.getTime() - dateA.getTime();
  });

  // Форматирование времени для отображения
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  // Получение человекочитаемого описания события
  const getEventDescription = (event: any) => {
    switch (event.eventType) {
      case 'file_upload':
        return `Загрузка файла "${event.fileName}" (${Math.round(
          event.fileSize / 1024 / 1024
        )} МБ) - статус: ${event.status || 'неизвестен'}${
          event.errorMessage ? ` - ошибка: ${event.errorMessage}` : ''
        }`;
      case 'file_listening':
        return `Прослушивание файла "${event.fileName}"${
          event.durationSeconds
            ? ` (длительность: ${Math.floor(event.durationSeconds / 60)}:${(
                event.durationSeconds % 60
              )
                .toString()
                .padStart(2, '0')})`
            : ''
        }`;
      case 'player_interaction':
        return `${getActionTypeDescription(event.actionType)} "${
          event.fileName
        }"${
          event.position !== undefined
            ? ` (позиция: ${Math.floor(event.position)}с)`
            : ''
        }${event.value !== undefined ? ` (значение: ${event.value})` : ''}${
          event.metadata && Object.keys(event.metadata).length > 0
            ? ` - ${JSON.stringify(event.metadata)}`
            : ''
        }`;
      case 'settings_change':
        return `Изменение настройки "${event.settingKey}" с ${JSON.stringify(
          event.oldValue
        )} на ${JSON.stringify(event.newValue)}`;
      case 'page_view':
        const duration = event.duration
          ? ` (время на странице: ${Math.floor(event.duration / 60)}:${(event.duration % 60).toString().padStart(2, '0')})`
          : event.exitedAt
            ? ` (время на странице: ${Math.floor((new Date(event.exitedAt).getTime() - new Date(event.enteredAt).getTime()) / 1000 / 60)}:${(Math.floor((new Date(event.exitedAt).getTime() - new Date(event.enteredAt).getTime()) / 1000) % 60).toString().padStart(2, '0')})`
            : '';
        return `Посещение страницы ${event.path}${duration}`;
      default:
        return `Неизвестное событие: ${event.eventType}`;
    }
  };

  // Человекочитаемое описание типа действия с плеером
  const getActionTypeDescription = (actionType: string) => {
    switch (actionType) {
      case 'play':
        return 'Воспроизведение';
      case 'pause':
        return 'Пауза';
      case 'seek':
        return 'Перемотка';
      case 'speed_change':
        return 'Изменение скорости';
      case 'playback_complete':
        return 'Завершение прослушивания';
      case 'transcript_seek':
        return 'Клик по слову в транскрипции';
      default:
        return actionType;
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">
        Аудит действий пользователя: {decodedEmail}
      </h1>

      <div className="mb-4">
        <a
          href="/admin"
          className="text-blue-600 hover:underline flex items-center gap-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 12L6 8L10 4" />
          </svg>
          Вернуться в админскую панель
        </a>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="px-4 py-2 text-left">Время</th>
                <th className="px-4 py-2 text-left">Тип события</th>
                <th className="px-4 py-2 text-left">Описание</th>
              </tr>
            </thead>
            <tbody>
              {allEvents.length > 0 ? (
                allEvents.map((event, index) => (
                  <tr
                    key={`${event.id}-${index}`}
                    className={`border-b dark:border-gray-700 ${
                      event.status === 'error' || event.errorMessage
                        ? 'bg-red-50 dark:bg-red-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/20'
                    }`}
                  >
                    <td className="px-4 py-2 whitespace-nowrap">
                      {formatDate(
                        event.createdAt || event.startTime || event.enteredAt
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {event.eventType}
                    </td>
                    <td className="px-4 py-2 break-words">
                      {getEventDescription(event)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-center">
                    Действия пользователя не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

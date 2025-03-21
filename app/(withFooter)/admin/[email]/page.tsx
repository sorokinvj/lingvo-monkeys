import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

// Интерфейсы для типизации данных
interface UserFile {
  id: string;
  name: string;
}

interface Event {
  id: string;
  userId: string;
  eventType: string;
  createdAt: string;
  [key: string]: any;
}

interface EventsResult {
  uploadEvents: Event[];
  listeningEvents: Event[];
  playerEvents: Event[];
  settingsEvents: Event[];
  pageViewEvents: Event[];
}

interface UserAuditData {
  user: { email: string; id: string };
  files: UserFile[];
  fileNames: Record<string, string>;
  events: EventsResult;
}

// Функция для получения данных аудита пользователя через API
async function getUserAuditData(email: string): Promise<UserAuditData> {
  try {
    // Запрос к API используя относительный путь
    const response = await fetch(
      `/api/admin/user-audit?email=${encodeURIComponent(email)}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error fetching user audit data:', errorData);
      throw new Error(
        `Failed to fetch user audit data: ${errorData.error || response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error in getUserAuditData:', error);
    throw error;
  }
}

// Функция для получения описания события
function getEventDescription(
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
      return `Взаимодействие с плеером для файла "${fileName}" - ${event.action}`;
    case 'settings_change':
      return `Изменил настройки: ${event.setting} = ${event.value}`;
    case 'page_view':
      const duration = event.exitedAt
        ? new Date(event.exitedAt).getTime() -
          new Date(event.enteredAt).getTime()
        : 'в процессе';
      const formattedDuration =
        typeof duration === 'number'
          ? `${Math.floor(duration / 1000)} сек`
          : duration;
      return `Посетил страницу ${event.path} (${formattedDuration})`;
    default:
      return `Неизвестное событие: ${event.eventType}`;
  }
}

export default async function UserAuditPage({
  params,
}: {
  params: { email: string };
}) {
  const email = decodeURIComponent(params.email);

  try {
    // Проверяем права администратора
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Error authenticating user:', userError);
      return (
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Ошибка авторизации</h1>
          <p>Пожалуйста, войдите в систему.</p>
        </div>
      );
    }

    const { data: userData } = await supabase
      .from('User')
      .select('email')
      .eq('id', user.id)
      .single();

    const isAdmin =
      userData?.email === 'sorokinvj@gmail.com' ||
      userData?.email === 'bichiko@gmail.com';

    if (!isAdmin) {
      redirect('/');
    }

    // Получаем данные аудита пользователя через API
    const auditData = await getUserAuditData(email);

    // Объединяем все события в один массив и сортируем по времени
    const allEvents = [
      ...auditData.events.uploadEvents,
      ...auditData.events.listeningEvents,
      ...auditData.events.playerEvents,
      ...auditData.events.settingsEvents,
      ...auditData.events.pageViewEvents,
    ].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return (
      <div className="p-4">
        <div className="flex items-center mb-6">
          <Link
            href="/admin"
            className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Назад к админке
          </Link>
          <h1 className="text-2xl font-bold">Аудит пользователя: {email}</h1>
        </div>

        <p className="mb-4">ID пользователя: {auditData.user.id}</p>

        <h2 className="text-xl font-semibold mb-2">Файлы пользователя:</h2>
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          {auditData.files.length > 0 ? (
            <ul className="list-disc pl-5">
              {auditData.files.map((file) => (
                <li key={file.id}>
                  {file.name} (ID: {file.id})
                </li>
              ))}
            </ul>
          ) : (
            <p>У пользователя нет файлов</p>
          )}
        </div>

        <h2 className="text-xl font-semibold mb-2">Действия пользователя:</h2>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действие
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Детали
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allEvents.map((event) => {
                const hasError = event.error || event.status === 'error';
                return (
                  <tr key={event.id} className={hasError ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(event.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getEventDescription(event, auditData.fileNames)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {JSON.stringify(
                        Object.fromEntries(
                          Object.entries(event).filter(
                            ([key]) =>
                              ![
                                'id',
                                'userId',
                                'eventType',
                                'createdAt',
                                'fileName',
                              ].includes(key)
                          )
                        ),
                        null,
                        2
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in UserAuditPage:', error);
    return (
      <div className="p-4">
        <Link
          href="/admin"
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Назад к админке
        </Link>
        <h1 className="text-2xl font-bold mb-4">
          Ошибка при загрузке данных аудита
        </h1>
        <p className="text-red-500">
          {error instanceof Error ? error.message : 'Неизвестная ошибка'}
        </p>
      </div>
    );
  }
}

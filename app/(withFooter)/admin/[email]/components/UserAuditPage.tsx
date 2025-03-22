'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  fetchUserAuditData,
  fetchUserAuditDataServer,
  getEventDescription,
  UserAuditData,
  Event,
} from '../helpers';
import { useUser } from '@/hooks/useUser';

// Определяем иконки для разных типов событий
const EventIcons = {
  file_upload: '📤',
  file_listening: '🎧',
  player_interaction: '▶️',
  settings_change: '⚙️',
  page_view: '👁️',
};

// Форматирование времени
const formatEventTime = (date: string): string => {
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
const groupEventsByDay = (events: Event[]) => {
  const grouped: Record<string, Event[]> = {};

  events.forEach((event) => {
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

// Компонент для отображения детальной информации о событии
const EventDetails = ({ event }: { event: Event }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDetails = () => setIsOpen(!isOpen);

  const filteredDetails = Object.fromEntries(
    Object.entries(event).filter(
      ([key]) =>
        !['id', 'userId', 'eventType', 'createdAt', 'fileName'].includes(key)
    )
  );

  return (
    <div className="mt-1">
      <button
        onClick={toggleDetails}
        className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
      >
        {isOpen ? 'Скрыть детали' : 'Показать детали'}
      </button>

      {isOpen && (
        <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
          {JSON.stringify(filteredDetails, null, 2)}
        </pre>
      )}
    </div>
  );
};

// Компонент события
const EventItem = ({
  event,
  fileNames,
}: {
  event: Event;
  fileNames: Record<string, string>;
}) => {
  const icon = EventIcons[event.eventType as keyof typeof EventIcons] || '📋';
  const time = new Date(event.createdAt).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="mb-4 bg-white p-4 rounded-lg shadow-sm">
      <div className="flex items-start">
        <div className="w-8 h-8 flex items-center justify-center text-xl mr-3">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">{time}</span>
          </div>
          <p className="font-medium mt-1">
            {getEventDescription(event, fileNames)}
          </p>
          <EventDetails event={event} />
        </div>
      </div>
    </div>
  );
};

export default function UserAuditPage({ email }: { email: string }) {
  const { data: currentUser } = useUser();
  const {
    data: auditData,
    error,
    isLoading,
  } = useQuery<UserAuditData>({
    queryKey: ['userAudit', email],
    queryFn: () => fetchUserAuditDataServer(email, currentUser?.email),
  });

  // Если данные загружаются
  if (isLoading) {
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
        <h2 className="text-xl font-semibold">Загрузка данных аудита...</h2>
      </div>
    );
  }

  // Если произошла ошибка
  if (error || !auditData) {
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

  // Группируем события по дням
  const eventsByDay = groupEventsByDay(allEvents);

  // Сводная статистика
  const totalFiles = auditData.files.length;
  const totalPageViews = auditData.events.pageViewEvents.length;
  const totalUploads = auditData.events.uploadEvents.length;
  const totalPlayerInteractions = auditData.events.playerEvents.length;

  return (
    <div className="p-4 max-w-4xl mx-auto">
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

      {/* Статистика */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Сводная статистика</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{totalFiles}</div>
            <div className="text-sm text-gray-600">Файлов загружено</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-3xl font-bold text-green-600">
              {totalUploads}
            </div>
            <div className="text-sm text-gray-600">Загрузок выполнено</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">
              {totalPlayerInteractions}
            </div>
            <div className="text-sm text-gray-600">
              Взаимодействий с плеером
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-3xl font-bold text-gray-600">
              {totalPageViews}
            </div>
            <div className="text-sm text-gray-600">Посещений страниц</div>
          </div>
        </div>
      </div>

      {/* Файлы пользователя */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">Файлы пользователя</h2>
        {auditData.files.length > 0 ? (
          <ul className="space-y-2">
            {auditData.files.map((file) => (
              <li key={file.id} className="flex items-center">
                <span className="mr-2">📄</span>
                <span>{file.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">У пользователя нет файлов</p>
        )}
      </div>

      {/* Хронология действий */}
      <h2 className="text-xl font-semibold mb-4">Хронология действий</h2>
      <div className="space-y-6">
        {eventsByDay.map(([day, events]) => (
          <div key={day} className="mb-6">
            <h3 className="text-lg font-medium text-gray-700 mb-3 sticky top-0 bg-gray-100 p-2 rounded-md">
              {day}
            </h3>
            <div className="space-y-0">
              {events.map((event) => (
                <EventItem
                  key={event.id}
                  event={event}
                  fileNames={auditData.fileNames}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

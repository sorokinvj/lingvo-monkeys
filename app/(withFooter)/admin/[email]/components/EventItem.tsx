import { useState } from 'react';
import { AnalyticsEvent } from './types';
import { getEventDescription } from './helpers';

// Определяем иконки для разных типов событий
const EventIcons = {
  file_upload: '📤',
  file_listening: '🎧',
  player_interaction: '▶️',
  settings_change: '⚙️',
  page_view: '👁️',
};

// Компонент для отображения детальной информации о событии
const EventDetails = ({
  event,
  isOpen,
  toggleDetails,
}: {
  event: AnalyticsEvent;
  isOpen: boolean;
  toggleDetails: () => void;
}) => {
  const filteredDetails = Object.fromEntries(
    Object.entries(event).filter(
      ([key]) =>
        !['id', 'userId', 'eventType', 'createdAt', 'fileName'].includes(key)
    )
  );

  return (
    <div className="">
      {isOpen && (
        <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
          {JSON.stringify(filteredDetails, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default function EventItem({
  event,
  fileNames,
}: {
  event: AnalyticsEvent;
  fileNames: Record<string, string>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDetails = () => setIsOpen(!isOpen);

  const icon = EventIcons[event.eventType as keyof typeof EventIcons] || '📋';
  const time = new Date(event.createdAt).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-sm">{time}</span>
        <div className="w-2 h-2 flex items-center justify-center text-sm">
          {icon}
        </div>
        <span className="font-medium text-sm">
          {getEventDescription(event, fileNames)}
        </span>
        <button
          onClick={toggleDetails}
          className="text-sm text-gray-600 hover:text-blue-800 focus:outline-none"
        >
          🛠️
        </button>
      </div>
      <EventDetails
        event={event}
        isOpen={isOpen}
        toggleDetails={toggleDetails}
      />
    </>
  );
}

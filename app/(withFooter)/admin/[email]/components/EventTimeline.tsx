import { AnalyticsEvent } from './types';
import EventItem from './EventItem';
import { groupEventsByDay } from './helpers';

export default function EventTimeline({
  events,
  fileNames,
}: {
  events: AnalyticsEvent[];
  fileNames: Record<string, string>;
}) {
  // Группируем события по дням
  const eventsByDay = groupEventsByDay(events);

  return (
    <div>
      <h2 className="text-xl mb-4 text-gray-600">Хронология по дням</h2>
      <div className="flex items-start flex-wrap gap-8">
        {eventsByDay.map(([day, dayEvents]) => (
          <div key={day}>
            {dayEvents.length > 0 && (
              <h3 className="text-base font-bold text-blue-900">{day}</h3>
            )}
            <div className="space-y-2">
              {dayEvents.map((event) => (
                <EventItem key={event.id} event={event} fileNames={fileNames} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

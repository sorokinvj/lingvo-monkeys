import { useMemo } from 'react';
import { UserAuditData } from './types';

// Функция для форматирования секунд в удобочитаемый формат времени
function formatTime(seconds: number): string {
  if (!seconds) return '0 мин';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} ч ${minutes} мин`;
  }
  return `${minutes} мин`;
}

export default function StatisticsSection({
  auditData,
}: {
  auditData: UserAuditData;
}) {
  const totalFiles = auditData.upload_events.length;
  const totalPageViews = auditData.page_view_events.length;
  const totalPlayerInteractions = auditData.player_events.length;
  const totalSettingsChanges = auditData.settings_events.length;

  const totalListeningTimeInSeconds = useMemo(() => {
    return auditData.listening_events.reduce(
      (acc, event) => acc + event.durationSeconds,
      0
    );
  }, [auditData.listening_events]);

  const totalFilesListened = useMemo(() => {
    const uniqueFiles = new Set(
      auditData.listening_events.map((event) => event.fileId)
    );
    return uniqueFiles.size;
  }, [auditData.listening_events]);

  return (
    <div className="my-2">
      <div className="flex flex-col md:grid md:grid-cols-3 gap-4 text-center mb-4">
        <div className="bg-blue-100 p-4 rounded-md">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {totalFiles}
          </div>
          <div className="text-sm text-gray-600">Файлов загружено</div>
        </div>
        <div className="bg-lime-100 p-4 rounded-md">
          <div className="text-3xl font-bold text-lime-600 mb-2">
            {formatTime(totalListeningTimeInSeconds)}
          </div>
          <div className="text-sm text-gray-600">Прослушано всего</div>
        </div>
        <div className="bg-amber-100 p-4 rounded-md">
          <div className="text-3xl font-bold text-amber-600 mb-2">
            {totalFilesListened}
          </div>
          <div className="text-sm text-gray-600">
            Уникальных файлов прослушано
          </div>
        </div>
      </div>

      <div className="flex flex-col md:grid md:grid-cols-3 gap-4 text-center">
        <div className="bg-rose-100 p-4 rounded-md">
          <div className="text-3xl font-bold text-rose-600 mb-2">
            {totalPlayerInteractions}
          </div>
          <div className="text-sm text-gray-600">Взаимодействий с плеером</div>
        </div>
        <div className="bg-emerald-100 p-4 rounded-md">
          <div className="text-3xl font-bold text-emerald-600 mb-2">
            {totalSettingsChanges}
          </div>
          <div className="text-sm text-gray-600">Изменений настроек</div>
        </div>
        <div className="bg-orange-100 p-4 rounded-md">
          <div className="text-3xl font-bold text-orange-600 mb-2">
            {totalPageViews}
          </div>
          <div className="text-sm text-gray-600">Посещений страниц</div>
        </div>
      </div>
    </div>
  );
}

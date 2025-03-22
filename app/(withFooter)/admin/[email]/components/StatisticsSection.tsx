import { UserAuditData } from './types';

export default function StatisticsSection({
  auditData,
}: {
  auditData: UserAuditData;
}) {
  const totalFiles = auditData.upload_events.length;
  const totalPageViews = auditData.page_view_events.length;
  const totalPlayerInteractions = auditData.player_events.length;
  const totalSettingsChanges = auditData.settings_events.length;
  const totalListeningEvents = auditData.listening_events.length;

  return (
    <div className="my-2">
      <div className="grid grid-cols-5 gap-4 text-center">
        <div className="bg-blue-100 p-4 rounded-md">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {totalFiles}
          </div>
          <div className="text-sm text-gray-600">Файлов загружено</div>
        </div>
        <div className="bg-lime-100 p-4 rounded-md">
          <div className="text-3xl font-bold text-lime-600 mb-2">
            {totalListeningEvents}
          </div>
          <div className="text-sm text-gray-600">Прослушиваний</div>
        </div>
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

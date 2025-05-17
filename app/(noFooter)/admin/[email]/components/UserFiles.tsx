import { UserAuditData } from './types';

export default function UserFiles({ auditData }: { auditData: UserAuditData }) {
  return (
    <div className="my-4 gap">
      <h2 className="text-xl text-gray-600 mb-4">Файлы пользователя</h2>
      {auditData.upload_events.length > 0 ? (
        <ul className="space-y-2">
          {auditData.upload_events.map((event) => (
            <li key={event.id} className="flex items-center">
              <span className="mr-2">📄</span>
              <span>{event.fileName}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">У пользователя нет файлов</p>
      )}
    </div>
  );
}

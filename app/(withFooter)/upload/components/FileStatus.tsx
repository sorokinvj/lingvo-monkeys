import React from 'react';
import { Status } from '@/schema/models';

interface FileStatusProps {
  status: Status;
}

const FileStatus: React.FC<FileStatusProps> = ({ status }) => {
  const getStatusBadge = (status: Status) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';

    const statusStyles =
      {
        pending: 'bg-yellow-100 text-yellow-800',
        transcribing: 'bg-blue-100 text-blue-800',
        transcribed: 'bg-green-100 text-green-800',
        error: 'bg-red-100 text-red-800',
      }[status] || 'bg-gray-100 text-gray-800';

    const statusTextMap = {
      pending: 'Ожидание',
      transcribing: 'Транскрибация',
      transcribed: 'Готово',
      error: 'Ошибка',
    };

    return (
      <span className={`${baseClasses} ${statusStyles}`}>
        {statusTextMap[status]}
      </span>
    );
  };

  return getStatusBadge(status);
};

export default FileStatus;

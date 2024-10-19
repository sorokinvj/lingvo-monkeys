import React from 'react';
import { File } from '@/schema/models';

interface FileStatusProps {
  fileRecord: File;
}

const FileStatus: React.FC<FileStatusProps> = ({ fileRecord }) => {
  if (fileRecord.status) {
    return <span>Transcribing...</span>;
  }

  // TODO: Handle other status cases
  return <span>Status Unknown</span>;
};

export default FileStatus;

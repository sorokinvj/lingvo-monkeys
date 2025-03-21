import { UPLOAD_TIMEOUT } from '@/config/constants';

export const getPresignedUrl = async (file: File) => {
  const response = await fetch('/api/upload/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get upload URL');
  }

  return response.json();
};

export const uploadToS3 = (
  url: string,
  fields: any,
  file: File,
  onProgress: (progress: number) => void
) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.timeout = UPLOAD_TIMEOUT;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 204) {
        resolve(null);
      } else {
        reject(new Error(`Upload failed with status: ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during upload'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Upload timed out'));
    };

    xhr.onabort = () => {
      reject(new Error('Upload was aborted'));
    };

    try {
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      formData.append('file', file);

      xhr.open('POST', url);
      xhr.send(formData);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      reject(new Error(`Failed to start upload: ${errorMessage}`));
    }
  });
};

export const processFile = async (
  fileData: {
    name: string;
    path: string;
    size: number;
    mimeType: string;
    publicUrl: string;
  },
  onProgress: (progress: number, message: string) => void
): Promise<{ fileId?: string; analyticsEventId?: string }> => {
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fileData),
  });

  if (!response.ok) {
    throw new Error('Upload process failed');
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Unable to read response');

  let fileId: string | undefined;
  let analyticsEventId: string | undefined;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = new TextDecoder().decode(value);
      const events = text.split('\n\n').filter(Boolean);

      for (const event of events) {
        const [eventType, data] = event.split('\n');
        if (eventType === 'event: progress') {
          const progressData = JSON.parse(data.replace('data: ', ''));
          const { progress, message } = progressData;

          // Извлекаем структурированные данные
          if (progressData.fileId && !fileId) {
            fileId = progressData.fileId;
          }

          if (progressData.analyticsEventId && !analyticsEventId) {
            analyticsEventId = progressData.analyticsEventId;
          }

          onProgress(progress, message);
        } else if (eventType === 'event: error') {
          const { error } = JSON.parse(data.replace('data: ', ''));
          throw new Error(error);
        } else if (eventType === 'event: complete') {
          const completeData = JSON.parse(data.replace('data: ', ''));
          if (completeData.fileId && !fileId) {
            fileId = completeData.fileId;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return { fileId, analyticsEventId };
};

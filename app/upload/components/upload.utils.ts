import { createSSEConnection } from '@/lib/sse';
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
) => {
  console.log('🚀 processFile: Started');
  return new Promise((resolve, reject) => {
    const eventSource = createSSEConnection('/api/upload', {
      onProgress: (progress, message) => {
        console.log('📊 SSE Progress:', { progress, message });
        onProgress(progress, message);
      },
      onError: (error) => {
        console.error('❌ SSE Error:', error);
        eventSource.close();
        reject(error);
      },
      onComplete: (data) => {
        console.log('✅ SSE Complete:', data);
        eventSource.close();
        resolve(data);
      },
    });

    console.log('📡 Starting POST request');
    fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fileData),
    }).catch((error) => {
      console.error('❌ POST Error:', error);
      eventSource.close();
      reject(error);
    });
  });
};

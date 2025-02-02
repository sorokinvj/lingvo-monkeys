interface SSEHandlers {
  onProgress: (progress: number, message: string) => void;
  onError: (error: Error) => void;
  onComplete: (data: any) => void;
}

export const createSSEConnection = (
  url: string,
  handlers: {
    onProgress: (progress: number, message: string) => void;
    onError: (error: Error) => void;
    onComplete: (data: any) => void;
  }
) => {
  console.log('[SSE] Creating connection to:', url);

  const eventSource = new EventSource(url);

  eventSource.onopen = () => {
    console.log('[SSE] Connection opened');
  };

  eventSource.addEventListener('progress', (event) => {
    console.log('[SSE] Progress event received:', event.data);
    const data = JSON.parse(event.data);
    handlers.onProgress(data.progress, data.message);
  });

  eventSource.addEventListener('complete', (event) => {
    console.log('[SSE] Complete event received:', event.data);
    const data = JSON.parse(event.data);
    handlers.onComplete(data);
  });

  eventSource.onerror = (error) => {
    console.error('[SSE] Error:', error);
    handlers.onError(new Error('SSE connection failed'));
  };

  return eventSource;
};

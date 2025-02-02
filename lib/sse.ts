interface SSEHandlers {
  onProgress: (progress: number, message: string) => void;
  onError: (error: Error) => void;
  onComplete: (data: any) => void;
}

export const createSSEConnection = (url: string, handlers: SSEHandlers) => {
  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handlers.onProgress(data.progress, data.message);
  };

  eventSource.onerror = (error) => {
    eventSource.close();
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    handlers.onError(new Error(errorMessage));
  };

  eventSource.addEventListener('complete', (event) => {
    eventSource.close();
    handlers.onComplete(JSON.parse(event.data));
  });

  return eventSource;
};

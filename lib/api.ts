import { File } from '@/schema/models';

export const getFiles = async (): Promise<File[]> => {
  const response = await fetch('/api/files');
  if (!response.ok) {
    throw new Error('Failed to fetch files');
  }
  const data = await response.json();
  return data;
};

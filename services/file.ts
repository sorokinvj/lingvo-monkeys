import { File } from '@/schema/models';

export async function getCollectionFiles(): Promise<File[]> {
  const response = await fetch('/api/collection', {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch collection files');
  }

  return await response.json();
}

'use client';

import { FC, useEffect, useState } from 'react';
import { CellContext } from '@tanstack/react-table';
import { Spinner } from '@/components/ui/spinner';
import { File, Status } from '@/schema/models';
import DataTable, { CustomColumnDef } from '@/components/ui/table';
import { FileCard } from './FileCard';
import FileStatus from './FileStatus';
import CollectionFileActions from './CollectionFileActions';

// Функция для получения всех файлов коллекции
const fetchCollectionFiles = async () => {
  const response = await fetch('/api/collection');

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Не удалось загрузить файлы коллекции');
  }

  return await response.json();
};

const CollectionFiles: FC = () => {
  const [collectionFiles, setCollectionFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const files = await fetchCollectionFiles();
        setCollectionFiles(files || []);
      } catch (err) {
        console.error('Error loading collection:', err);
        setError(err instanceof Error ? err : new Error('Неизвестная ошибка'));
      } finally {
        setIsLoading(false);
      }
    };

    loadFiles();
  }, []);

  // Определяем колонки
  const columns: CustomColumnDef<File>[] = [
    {
      id: 'name',
      header: 'Название',
      accessorKey: 'name',
      size: 400,
      enableSorting: true,
      cell: (info: CellContext<File, string>) => (
        <span key={info.row.original.id}>{info.getValue()}</span>
      ),
    },
    {
      id: 'language',
      header: 'Язык',
      accessorKey: 'language',
      size: 100,
      enableSorting: true,
      sortUndefined: 'last',
      cell: (info: CellContext<File, string>) => (
        <span key={info.row.original.id}>{info.getValue() || '-'}</span>
      ),
    },
    {
      id: 'languageLevel',
      header: 'Уровень',
      accessorKey: 'languageLevel',
      size: 100,
      enableSorting: true,
      sortUndefined: 'last',
      cell: (info: CellContext<File, string>) => (
        <span key={info.row.original.id}>{info.getValue() || '-'}</span>
      ),
    },
    {
      id: 'contentType',
      header: 'Жанр',
      accessorKey: 'contentType',
      size: 120,
      enableSorting: true,
      sortUndefined: 'last',
      cell: (info: CellContext<File, string>) => (
        <span key={info.row.original.id}>{info.getValue() || '-'}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      size: 100,
      enableSorting: false,
      cell: (info: CellContext<File, string>) => (
        <CollectionFileActions
          fileId={info.row.original.id}
          status={info.row.original.status}
        />
      ),
    },
  ];

  if (isLoading) return <Spinner size="md" />;

  if (error) {
    return (
      <div className="text-red-500 text-center">
        Не удалось загрузить файлы из коллекции
      </div>
    );
  }

  if (!collectionFiles || collectionFiles.length === 0) {
    return (
      <div className="text-gray-500 text-center">
        В коллекции пока нет файлов
      </div>
    );
  }

  return (
    <DataTable
      data={collectionFiles}
      columns={columns}
      defaultSort={[{ id: 'createdAt', desc: true }]}
      MobileComponent={FileCard}
    />
  );
};

export default CollectionFiles;

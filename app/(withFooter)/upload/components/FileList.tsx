'use client';

import { CellContext } from '@tanstack/react-table';
import { File } from '@/schema/models';
import { FC, useEffect, useState } from 'react';
import DataTable from '@/components/ui/table';
import { createClient } from '@/utils/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { useFiles } from '@/hooks/useFiles';
import { useUser } from '@/hooks/useUser';
import FileStatus from './FileStatus';
import { Status } from '@/schema/models';
import { Spinner } from '@/components/ui/spinner';
import FileActions from './FileActions';
import { FileCard } from './FileCard';
import Link from 'next/link';
import { ArrowLeft, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CollectionFiles from './CollectionFiles';

const FileList: FC = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const [showCollection, setShowCollection] = useState(false);

  const { data: user } = useUser();
  const { data: files, isLoading, error } = useFiles(user?.id);

  useEffect(() => {
    if (!user) return;

    const channel: RealtimeChannel = supabase
      .channel('file_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'File',
          filter: `userId=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['files'] });
        }
      )
      .subscribe();

    const transcriptionChannel: RealtimeChannel = supabase
      .channel('transcription_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Transcription',
          filter: `userId=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['files'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(transcriptionChannel);
    };
  }, [user, queryClient]);

  const columns = [
    {
      id: 'name',
      header: 'Название',
      accessorKey: 'name',
      size: 400,
      cell: (info: CellContext<File, string>) => (
        <span key={info.row.original.id}>{info.getValue()}</span>
      ),
    },
    {
      id: 'status',
      header: 'Статус',
      accessorKey: 'status',
      size: 120,
      cell: (info: CellContext<File, string>) => (
        <FileStatus
          key={info.row.original.id}
          status={info.getValue() as Status}
        />
      ),
    },
    {
      id: 'createdAt',
      header: 'Дата загрузки',
      accessorKey: 'createdAt',
      size: 150,
      cell: (info: CellContext<File, string>) =>
        new Date(info.getValue()).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: '',
      size: 100,
      cell: (info: CellContext<File, string>) => (
        <FileActions
          fileId={info.row.original.id}
          status={info.row.original.status}
        />
      ),
    },
  ];

  // Показываем спиннер при загрузке
  if (isLoading) return <Spinner fullscreen size="lg" />;

  // Показываем ошибку, если есть
  if (error) return <div>Error loading files: {error.message}</div>;

  // Если файлов нет и коллекция не отображается, показываем пустое состояние
  if (files && files.length === 0 && !showCollection) {
    return (
      <div className="bg-white border-2 border-sky-100 rounded-lg p-6 text-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="rounded-full">
            <FolderOpen className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            У вас пока нет загруженных файлов
          </h3>
          <p className="text-gray-600 max-w-md">
            Загрузите аудиофайл выше или посмотрите нашу коллекцию готовых
            материалов
          </p>
          <Button onClick={() => setShowCollection(true)} variant="default">
            Lingvo Monkeys Collection
          </Button>
        </div>
      </div>
    );
  }

  // Если пользователь нажал на кнопку коллекции
  if (showCollection) {
    return (
      <div>
        <div className="mb-4 flex justify-between items-center">
          <Button
            variant="link"
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            onClick={() => setShowCollection(false)}
          >
            <ArrowLeft className="w-6 h-6 text-blue-600" />
            <span className="text-blue-600">Мои файлы</span>
          </Button>
        </div>
        <CollectionFiles />
      </div>
    );
  }

  // Если у пользователя есть файлы, показываем их
  if (files && files.length > 0) {
    return (
      <>
        <h1 className="text-3xl font-sans mb-4 text-gray-700">Ваши файлы</h1>
        <DataTable
          data={files}
          columns={columns}
          defaultSort={[{ id: 'createdAt', desc: true }]}
          MobileComponent={FileCard}
        />
      </>
    );
  }

  return null;
};

export default FileList;

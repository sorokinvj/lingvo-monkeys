'use client';

import { CellContext } from '@tanstack/react-table';
import { File } from '@/schema/models';
import { FC, useEffect } from 'react';
import DataTable from '@/components/ui/table';
import { createClient } from '@/utils/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { useFiles } from '@/hooks/useFiles';
import { useUser } from '@/hooks/useUser';
import Link from 'next/link';
import FileStatus from './FileStatus';
import { Status } from '@/schema/models';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

const FileList: FC = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const { data: user } = useUser();
  const { data: files, isLoading, error, refetch } = useFiles(user?.id);

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
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const columns = [
    {
      id: 'name',
      header: 'Название',
      accessorKey: 'name',
    },
    {
      id: 'status',
      header: 'Статус',
      accessorKey: 'status',
      cell: (info: CellContext<File, string>) => (
        <FileStatus status={info.getValue() as Status} />
      ),
    },
    {
      id: 'mimeType',
      header: 'Тип',
      accessorKey: 'mimeType',
    },
    {
      id: 'createdAt',
      header: 'Дата загрузки',
      accessorKey: 'createdAt',
      cell: (info: CellContext<File, string>) =>
        new Date(info.getValue()).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: 'Действия',
      cell: (info: CellContext<File, string>) => {
        if (info.row.original.status === 'transcribed') {
          return (
            <Link
              href={`/play/${info.row.original.id}`}
              className="flex items-center gap-2"
            >
              <Button variant="outline" size="sm">
                Открыть
              </Button>
            </Link>
          );
        }
      },
    },
  ];

  if (isLoading) return <Spinner fullscreen size="lg" />;
  if (error) return <div>Error loading files: {error.message}</div>;
  if (files)
    return (
      <DataTable
        data={files}
        columns={columns}
        defaultSort={[{ id: 'createdAt', desc: true }]}
      />
    );

  return null;
};

export default FileList;

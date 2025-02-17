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
import FileStatus from './FileStatus';
import { Status } from '@/schema/models';
import { Spinner } from '@/components/ui/spinner';
import FileActions from './FileActions';

const FileList: FC = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

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

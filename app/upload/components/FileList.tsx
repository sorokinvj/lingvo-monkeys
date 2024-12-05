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
        (data) => {
          console.log('File changed event received:', data);
          queryClient.invalidateQueries({ queryKey: ['files', user.id] });
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
      header: 'File Name',
      accessorKey: 'name',
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: (info: CellContext<File, string>) => (
        <FileStatus status={info.getValue() as Status} />
      ),
    },
    {
      id: 'mimeType',
      header: 'Type',
      accessorKey: 'mimeType',
    },
    {
      id: 'createdAt',
      header: 'Upload Date',
      accessorKey: 'createdAt',
      cell: (info: CellContext<File, string>) =>
        new Date(info.getValue()).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (info: CellContext<File, string>) => (
        <FileActions
          fileId={info.row.original.id}
          status={info.row.original.status}
        />
      ),
    },
  ];

  if (isLoading) return <div>Loading files...</div>;
  if (error) return <div>Error loading files: {error.message}</div>;

  return (
    files && (
      <DataTable
        data={files}
        columns={columns}
        defaultSort={[{ id: 'createdAt', desc: true }]}
      />
    )
  );
};

export default FileList;

'use client';

import { CellContext } from '@tanstack/react-table';
import { File } from '@/schema/models';
import { FC, useEffect } from 'react';
import DataTable from '@/components/ui/table';
import { createClient } from '@/utils/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFiles } from '@/hooks/useFiles';
import { useUser } from '@/hooks/useUser';

const FileList: FC<{ refreshTrigger: number }> = ({ refreshTrigger }) => {
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

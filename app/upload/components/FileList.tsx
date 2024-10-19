'use client';

import { CellContext } from '@tanstack/react-table';
import { File } from '@/schema/models';
import { FC } from 'react';
import DataTable from '@/components/ui/table';
import { createClient } from '@/utils/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

const FileList: FC = () => {
  const supabase = createClient();
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    const setupUserAndSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        fetchFiles(user.id);

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
              fetchFiles(user.id);
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    };

    setupUserAndSubscription();
  }, []);

  const fetchFiles = async (userId: string) => {
    const { data, error } = await supabase
      .from('File')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching files:', error);
    } else {
      setFiles(data || []);
    }
  };

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

  return (
    <DataTable
      data={files}
      columns={columns}
      defaultSort={[{ id: 'createdAt', desc: true }]}
    />
  );
};

export default FileList;

import React from 'react';
import Link from 'next/link';
import { TrashIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';

interface FileActionsProps {
  fileId: string;
  status: string;
}

const FileActions: React.FC<FileActionsProps> = ({ fileId, status }) => {
  const queryClient = useQueryClient();

  const deleteFileMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }
    },
    onSuccess: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const filePath = `${user?.id}/${fileId}.mp3`;
      console.log('Attempting to delete file at path:', filePath);

      // Проверяем существование файла
      const { data: files, error: listError } = await supabase.storage
        .from('audio-files')
        .list(user?.id, {
          search: `${fileId}.mp3`,
        });

      if (listError) {
        console.error('Error checking file existence:', listError);
        return;
      }

      console.log('Files found:', files);

      if (!files || files.length === 0) {
        console.log('File not found in storage');
        return;
      }

      // Если файл существует, удаляем его
      const { error: storageError } = await supabase.storage
        .from('audio-files')
        .remove([filePath]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
      } else {
        console.log('File successfully deleted from storage');
      }

      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });

  const handleDelete = () => {
    deleteFileMutation.mutate();
  };

  return (
    <div className="flex justify-end gap-4">
      {status === 'transcribed' && (
        <Link href={`/play/${fileId}`} className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Открыть
          </Button>
        </Link>
      )}
      <Button
        variant="default"
        onClick={handleDelete}
        className="bg-red-300 hover:bg-red-500"
      >
        <TrashIcon className="w-4 h-4" />
        Удалить
      </Button>
    </div>
  );
};

export default FileActions;

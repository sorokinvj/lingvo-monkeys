import React from 'react';
import Link from 'next/link';
import { TrashIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
    onError: (error: Error) => {
      console.error('Error deleting file:', error);
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

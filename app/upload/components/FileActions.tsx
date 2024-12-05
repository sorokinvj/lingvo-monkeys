import React from 'react';
import Link from 'next/link';
import { PlayIcon, TrashIcon } from 'lucide-react';
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
    <div className="flex items-center gap-2">
      {status === 'transcribed' && (
        <Link href={`/play/${fileId}`} className="flex items-center gap-2">
          <div className="flex rounded-full items-center justify-center border border-amber-500 p-2">
            <PlayIcon className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          Play
        </Link>
      )}
      <Button variant="destructive" onClick={handleDelete}>
        <TrashIcon className="w-4 h-4" />
        Delete
      </Button>
    </div>
  );
};

export default FileActions;

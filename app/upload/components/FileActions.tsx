import React from 'react';
import Link from 'next/link';
import { TrashIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Status } from '@/schema/models';

interface FileActionsProps {
  fileId: string | number;
  status: Status;
  className?: string;
}

const FileActions = ({ fileId, status, className }: FileActionsProps) => {
  const queryClient = useQueryClient();

  const deleteFileMutation = useMutation({
    mutationFn: async () => {
      // Delete file through our API endpoint which will handle both S3 and database deletion
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete file');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });

  const handleDelete = () => {
    deleteFileMutation.mutate();
  };

  return (
    <div className="flex justify-end gap-4">
      {status === 'transcribed' && (
        <Link href={`/play/${fileId}`} className="flex-1 items-center md:w-fit">
          <Button variant="outline" size="sm" className="w-full">
            Открыть
          </Button>
        </Link>
      )}
      <div className="w-1/2 flex items-center md:w-fit">
        <Button
          variant="default"
          onClick={handleDelete}
          className={`w-1/2 md:w-fit bg-red-300 hover:bg-red-500 ${className || ''}`}
          loading={deleteFileMutation.isPending}
        >
          <TrashIcon className="w-4 h-4" />
          Удалить
        </Button>
      </div>
    </div>
  );
};

export default FileActions;

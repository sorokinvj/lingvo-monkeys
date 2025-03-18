import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Status } from '@/schema/models';

interface CollectionFileActionsProps {
  fileId: string | number;
  status: Status;
  className?: string;
}

const CollectionFileActions = ({
  fileId,
  status,
  className,
}: CollectionFileActionsProps) => {
  return (
    <div className="flex justify-end gap-4">
      {status === 'transcribed' && (
        <Link href={`/play/${fileId}`} className="flex-1 items-center md:w-fit">
          <Button variant="outline" size="sm" className="w-full">
            Открыть
          </Button>
        </Link>
      )}
    </div>
  );
};

export default CollectionFileActions;

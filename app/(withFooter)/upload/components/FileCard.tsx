import { File, Status } from '@/schema/models';
import FileStatus from '@/app/(withFooter)/upload/components/FileStatus';
import FileActions from '@/app/(withFooter)/upload/components/FileActions';

interface FileCardProps {
  item: File;
}

export const FileCard = ({ item }: FileCardProps) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 relative flex overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-900" />
      <div className="flex-1 pl-2">
        <h3 className="text-lg font-medium mb-3 break-words">{item?.name}</h3>

        <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
          <FileStatus status={item?.status as Status} />
          <time>{new Date(item?.createdAt).toLocaleDateString()}</time>
        </div>

        <FileActions
          fileId={item?.id}
          status={item?.status}
          className="w-full transition-colors"
        />
      </div>
    </div>
  );
};

import { File, Status } from '@/schema/models';
import FileStatus from '@/app/upload/components/FileStatus';
import FileActions from '@/app/upload/components/FileActions';

interface FileCardProps {
  item: File;
}

export const FileCard = ({ item }: FileCardProps) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
      <h3 className="text-lg font-medium mb-3 break-words">{item?.name}</h3>

      <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
        <FileStatus status={item?.status as Status} />
        <time>{new Date(item?.createdAt).toLocaleDateString()}</time>
      </div>

      <FileActions
        fileId={item?.id}
        status={item?.status}
        className="w-full py-2 px-4 text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors"
      />
    </div>
  );
};

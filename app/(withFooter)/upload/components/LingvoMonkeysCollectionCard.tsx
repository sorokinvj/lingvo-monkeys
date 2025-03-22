import Link from 'next/link';

export const LingvoMonkeysCollectionCard = () => {
  return (
    <div className="block p-4 bg-blue-900 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <Link href="/collection">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-white">
            Lingvo Monkeys Collection
          </span>
        </div>
        <p className="text-sm text-white/50">
          Наша подборка аудио-текстов уже в читалке
        </p>
      </Link>
    </div>
  );
};

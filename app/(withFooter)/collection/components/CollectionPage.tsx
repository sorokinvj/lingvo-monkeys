'use client';

import { FC } from 'react';
import CollectionFiles from '@/app/(withFooter)/upload/components/CollectionFiles';

const CollectionPage: FC = () => {
  return (
    <div className="max-w-6xl mx-auto pb-12">
      <h1 className="text-3xl font-sans mb-6 text-gray-700">Наша коллекция</h1>

      <div className="border-2 border-sky-200 bg-sky-50 rounded-lg p-6 mb-8">
        <div className="prose max-w-none flex flex-col gap-4">
          <p>
            Здесь мы собираем бесплатные аудио-тексты разных жанров и уровней
            сложности. Начать заниматься можно прямо сейчас!
          </p>

          <p>
            Коллекция постепенно пополняется. В ней пока больше английских
            текстов, но будут появляться аудио и на других языках.
          </p>

          <p>
            При этом вы сами можете пополнить коллекцию, если начитаете текст на
            родном языке. И тогда с вашим аудио будут заниматься благодарные
            ученики. Присылайте свои записи, а также письма с пожеланиями нам на{' '}
            <a
              href="mailto:lingvomonkeys@gmail.com"
              className="text-blue-500 hover:text-blue-600"
            >
              lingvomonkeys@gmail.com
            </a>
            .
          </p>
        </div>
      </div>

      <CollectionFiles />
    </div>
  );
};

export default CollectionPage;

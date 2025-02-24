import React from 'react';
import { ExternalLink } from 'lucide-react';
import { FAQItem } from '@/components/FAQItem/FAQItem';

const AudiobookSources = () => {
  const sources = [
    {
      name: 'LibriVox',
      url: 'https://librivox.org/search?primary_key=0&search_category=author&search_page=1&search_form=get_results&search_order=alpha',
      description:
        'Огромная коллекция аудиокниг, озвученных волонтерами со всего мира.',
    },
    {
      name: 'Project Gutenberg Audio',
      url: 'https://www.gutenberg.org/browse/categories/1',
      description:
        'Классическая литература в аудио формате от известного проекта Gutenberg.',
    },
    {
      name: 'Learn Out Loud',
      url: 'https://www.learnoutloud.com/Results/Publisher/Lit2Go/1087',
      description: 'Образовательные аудиоматериалы и классическая литература.',
    },
  ];

  return (
    <>
      {/* Мобильный вид - аккордеон */}
      <div className="md:hidden">
        <FAQItem
          question="Где найти бесплатные аудиокниги?"
          bgColor="bg-blue-50"
          answer={
            <div className="grid gap-3">
              {sources.map((source) => (
                <a
                  key={source.name}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-blue-700">{source.name}</span>
                    <ExternalLink size={16} className="text-blue-500" />
                  </div>
                  <p className="text-sm text-gray-600">{source.description}</p>
                </a>
              ))}
            </div>
          }
        />
      </div>

      {/* Десктопный вид - карточки */}
      <div className="hidden md:block">
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            Где найти бесплатные аудиокниги?
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {sources.map((source) => (
              <a
                key={source.name}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-blue-700">{source.name}</span>
                  <ExternalLink size={16} className="text-blue-500" />
                </div>
                <p className="text-sm text-gray-600">{source.description}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
};

export default AudiobookSources;

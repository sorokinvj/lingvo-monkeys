'use client';

import { FC } from 'react';
import FAQ from './FAQ';

const FAQPage: FC = () => {
  return (
    <div className="md:mt-12 p-4 md:px-4 flex flex-col md:flex-row gap-8 md:gap-20 mb-24 relative z-10">
      <div className="flex flex-col max-w-[420px] w-full justify-between">
        <h2 className="font-heading text-4xl leading-tight  text-gray-900 mt-3 md:text-5xl md:leading-tight">
          Часто задаваемые вопросы
        </h2>
      </div>
      <FAQ />
    </div>
  );
};

export default FAQPage;

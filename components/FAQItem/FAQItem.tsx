import { FC } from 'react';
import { Disclosure, DisclosureButton } from '@headlessui/react';
import { MinusIcon, PlusIcon } from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: string | React.ReactNode;
  defaultOpen?: boolean;
  bgColor?: string;
}

export const FAQItem: FC<FAQItemProps> = ({
  question,
  answer,
  defaultOpen = false,
  bgColor = 'bg-gray-50',
}) => {
  return (
    <Disclosure defaultOpen={defaultOpen}>
      {({ open }) => (
        <div className="flex flex-col shadow-disclosure rounded-lg overflow-hidden">
          <DisclosureButton
            className={`flex justify-between w-full px-4 md:px-7 py-3 md:py-7 text-base font-medium text-left text-gray-900 ${bgColor} focus:outline-none`}
          >
            <span className="font-semibold">{question}</span>
            {open ? (
              <MinusIcon className="w-5 h-5 text-[#534CFB] transition-transform duration-200" />
            ) : (
              <PlusIcon className="w-5 h-5 text-gray-500 transition-transform duration-200" />
            )}
          </DisclosureButton>

          <div
            className={`transition-all duration-300 ease-in-out ${
              open ? 'max-h-96' : 'max-h-0'
            } overflow-hidden`}
          >
            <div className={`p-7 pt-0 text-base text-gray-500 ${bgColor}`}>
              {answer}
            </div>
          </div>
        </div>
      )}
    </Disclosure>
  );
};

import { FC } from 'react';
import { Disclosure, DisclosureButton } from '@headlessui/react';
import { MinusIcon, PlusIcon } from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: string | React.ReactNode;
  defaultOpen?: boolean;
}

const FAQItem: FC<FAQItemProps> = ({
  question,
  answer,
  defaultOpen = false,
}) => {
  return (
    <Disclosure defaultOpen={defaultOpen}>
      {({ open }) => (
        <div className="flex flex-col shadow-disclosure rounded-lg overflow-hidden">
          <DisclosureButton className="flex justify-between w-full px-4 md:px-7 py-3 md:py-7 text-base font-medium text-left text-gray-900 bg-gray-50 focus:outline-none">
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
            <div className="p-7 pt-0 text-base text-gray-500 bg-gray-50">
              {answer}
            </div>
          </div>
        </div>
      )}
    </Disclosure>
  );
};

const FAQ: FC = () => {
  const faqs = [
    {
      question: 'What is language shadowing?',
      answer:
        'Language shadowing is a learning technique where you listen to native speaker audio and repeat what you hear simultaneously with as little delay as possible. This method helps you master pronunciation, intonation, and natural speech patterns of English.',
      defaultOpen: true,
    },
    {
      question: 'Who invented shadowing?',
      answer:
        'Language shadowing was developed by linguist and polyglot Alexander Arguelles. He created the structured method where students listen to target language audio and simultaneously echo what they hear, while walking briskly with good posture and speaking in a clear, loud voice.',
    },
    {
      question: 'How do I practice language shadowing on this platform?',
      answer: (
        <div>
          <p>The process is simple:</p>
          <ul className="list-disc pl-5">
            <li>Upload your audio file with an English native speaker.</li>
            <li>Wait a couple of minutes for the transcription to complete.</li>
            <li>
              Once the status shows "Ready", click Play and start practicing by
              repeating what you hear.
            </li>
          </ul>
          <p>
            The transcription helps you follow along and understand the content
            better.
          </p>
        </div>
      ),
    },
    {
      question: 'What are the main benefits of language shadowing?',
      answer:
        "Language shadowing offers several benefits: it improves your pronunciation and accent, develops natural speech patterns and intonation, enhances listening comprehension, exercises your working memory, and helps you absorb vocabulary and grammar structures naturally. It's particularly effective for developing fluency and reducing foreign accent.",
    },
  ];

  return (
    <div className="w-full mx-auto flex flex-col gap-4">
      {faqs.map((faq, index) => (
        <FAQItem
          key={index}
          question={faq.question}
          answer={faq.answer}
          defaultOpen={faq.defaultOpen}
        />
      ))}
    </div>
  );
};

export default FAQ;

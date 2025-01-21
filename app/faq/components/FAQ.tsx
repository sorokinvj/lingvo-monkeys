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
      question: 'Что такое shadowing?',
      answer:
        'Shadowing (читается как "ша-до-уинь") - это техника изучения языка, при которой вы слушаете речь носителя языка и одновременно повторяете услышанное с минимальной задержкой. Этот метод помогает освоить произношение, интонацию и естественные речевые паттерны английского языка.',
      defaultOpen: true,
    },
    {
      question: 'Кто изобрел метод?',
      answer:
        'Метод был разработан лингвистом и полиглотом Александром Аргуэльесом. Он создал структурированный метод, при котором учащиеся слушают аудио на изучаемом языке и одновременно повторяют услышанное, быстро шагая с правильной осанкой и говоря четким, громким голосом.',
    },
    {
      question: 'Как практиковать shadowing на этой платформе?',
      answer: (
        <div>
          <p>Очень просто:</p>
          <ul className="list-disc pl-5">
            <li>Загрузите аудиофайл с записью носителя английского языка.</li>
            <li>Подождите несколько минут, пока завершится транскрипция.</li>
            <li>
              Когда статус покажет "Готово", нажмите Воспроизвести и начинайте
              практиковаться, повторяя то, что слышите.
            </li>
          </ul>
          <p>
            Транскрипция помогает следить за текстом и лучше понимать
            содержание.
          </p>
        </div>
      ),
    },
    {
      question: 'Каковы основные преимущества этого метода?',
      answer:
        'Shadowing предлагает несколько преимуществ: улучшает произношение и акцент, развивает естественные речевые паттерны и интонацию, повышает понимание на слух, тренирует рабочую память и помогает естественным образом усваивать словарный запас и грамматические структуры. Этот метод особенно эффективен для развития беглости речи и уменьшения иностранного акцента.',
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

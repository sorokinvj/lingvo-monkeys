'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import FastRobot from './robotSpeed.svg';
import GoRobot from './robotGo.svg';
import Image from 'next/image';
import stepUpload from './stepUpload.png';
import stepEdit from './stepEdit.png';
import stepExport from './stepExport.png';
import moneyRobot from './moneyRobot.svg';
import audienceRobot from './audienceRobot.svg';
import powerRobot from './powerRobot.svg';

const BenefitSection = ({
  title,
  description,
  image,
  circleColor,
  reversed = false,
}: {
  title: string;
  description: string;
  image: string;
  circleColor: string;
  reversed?: boolean;
}) => {
  return (
    <div
      className={`flex flex-col md:flex-row items-center mb-20 md:mb-40 
                     ${reversed ? 'md:flex-row-reverse' : ''}`}
    >
      <div className="relative order-1 md:order-none">
        {/* Circle background */}
        <div
          className={`absolute rounded-full opacity-20 ${
            circleColor === 'yellow'
              ? 'bg-[#ffda71] w-[31rem] h-[31rem] -left-56 -top-40'
              : circleColor === 'red'
                ? 'bg-[#f47f98] w-[53rem] h-[53rem] -left-[35rem] top-8 lg:w-[31rem] lg:h-[31rem] lg:-left-60'
                : 'bg-[#8fdecb] w-[44rem] h-[44rem] -right-48 -top-28'
          }`}
        />

        <Image
          src={image}
          alt={title}
          className={`w-72 md:w-84 lg:w-auto ${
            reversed
              ? 'md:ml-[25rem] lg:ml-[25rem]'
              : 'md:mr-[22rem] lg:mr-[22rem]'
          }`}
        />
      </div>

      <div className="w-4/5 md:w-[38rem] text-center md:text-left mt-8 md:mt-0">
        <h2 className="text-4xl font-bold text-[#4C505B] mb-4 md:mb-1">
          {title}
        </h2>
        <p className="text-lg text-[#4C505B]">{description}</p>
      </div>
    </div>
  );
};

const ArrowUp = () => (
  <svg
    width="25"
    height="24"
    viewBox="0 0 25 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M23.3523 12.1175L13.3162 4.86778V22H11.6838V4.86778L1.64772 12.1175L0.5 11.0597L12.5 2L24.5 11.0597L23.3523 12.1175Z"
      fill="white"
      stroke="white"
      strokeWidth="1.5"
    />
  </svg>
);

const steps = [
  {
    name: 'Upload',
    img: stepUpload,
    description:
      'Перетащите файлы в зону загрузки, она начнется сразу же. Пока мы принимаем только .mp3, .wav, .flac и .mp4.',
  },
  {
    name: 'Edit',
    img: stepEdit,
    description:
      'Если роботы сделали ошибку, ее легко исправить в редакторе. Просто кликните на подсвеченное слово, и плеер тут же воспроизведет его.',
  },
  {
    name: 'Export',
    img: stepExport,
    description: 'Расшифровку можно скачать в формате Microsoft Word или PDF.',
  },
];

const LandingPage = () => {
  const [activeStep, setActiveStep] = useState('Upload');
  const currentStepImage = useMemo(() => {
    return steps.find((step) => step.name === activeStep)?.img;
  }, [activeStep]);

  return (
    <div className="relative w-full min-h-screen overflow-visible">
      {/* Background elements */}
      <div className="absolute top-12 right-24 w-64 h-64 bg-[#8fdecb] rounded-full opacity-50" />
      <div className="absolute top-64 -left-24 w-[300px] h-[300px] bg-[#f8c0b8] rounded-full opacity-30" />

      {/* Main content container */}
      <div className="relative w-full px-4 py-[7rem] pb-[10rem]">
        {/* Center content */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <p className="font-inter text-sm leading-4 text-[#4C505B]/50 tracking-wider uppercase">
            speech recognition service for media industry
          </p>

          <h1 className="mt-6 font-inter font-bold text-6xl text-[#4C505B]">
            Enjoy fast and cheap automated transcriptions
          </h1>

          <p className="mt-6 font-inter text-lg text-[#4C505B] max-w-xl">
            The future is here. Algorithms are ready to replace manual
            transcriptions – a painful job for humans. Just upload audio/video
            file, hit "Transcribe" and let the robots do the hard work.
          </p>

          <Link href="/audio">
            <div className="mt-12 px-6 py-4 bg-[#00a7e1] rounded-lg shadow-lg flex items-center text-white font-bold text-[1.6rem] gap-4">
              <ArrowUp />
              <span>Upload audio/video file</span>
            </div>
          </Link>
        </div>

        {/* Robots that scroll with content */}
        <div className="absolute -left-28 top-64 w-[12rem] sm:w-[21rem] lg:w-[35rem]">
          <Image
            src={FastRobot}
            alt="Fast Robot"
            className="-rotate-2 sm:rotate-0"
          />
        </div>

        <div className="absolute -right-64 top-96 w-[12.6rem] sm:w-[19rem] lg:w-[29rem]">
          <Image src={GoRobot} alt="Go Robot" />
        </div>
      </div>

      {/* Our app */}
      <div className="relative w-full px-4 py-20">
        <div className="flex flex-col gap-8 max-w-5xl mx-auto">
          <div className="flex gap-12">
            <div className="flex flex-col gap-8 w-1/3">
              {steps.map((step) => (
                <div
                  key={step.name}
                  onClick={() => setActiveStep(step.name)}
                  className={`cursor-pointer transition-all duration-300 ${
                    activeStep === step.name
                      ? 'opacity-100 scale-105'
                      : 'opacity-50 hover:opacity-75'
                  }`}
                >
                  <h2 className="text-3xl font-bold text-[#4C505B] mb-4">
                    {step.name}
                  </h2>
                  <p className="text-[#4C505B] text-lg">{step.description}</p>
                </div>
              ))}
            </div>

            <div className="relative w-2/3 aspect-video">
              {currentStepImage && (
                <Image
                  src={currentStepImage}
                  alt={activeStep}
                  className="rounded-lg shadow-lg transition-all duration-500"
                  fill
                  style={{ objectFit: 'cover' }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="my-32">
        <BenefitSection
          title="Экономьте время и деньги"
          description="Не ждите 6 часов, если нужен текст часового интервью. Быстрее и дешевле расшифровать роботом, а потом исправить за ним, если потребуется."
          image={moneyRobot}
          circleColor="yellow"
        />

        <BenefitSection
          title="Увеличивайте аудиторию"
          description="Переводите ваши ролики в Youtube на другие языки, делайте субтитры и развивайте фанатское сообщество на всех языках."
          image={audienceRobot}
          circleColor="green"
          reversed
        />

        <BenefitSection
          title="Познайте силу текста"
          description="Публикуйте расшифровки рядом с вашими видео и аудио. Текст повышает цитируемость, привлекает трафик из Гугла и дает людям возможность быстро познакомится с контентом."
          image={powerRobot}
          circleColor="red"
        />

        <div className="flex justify-center mt-20">
          <Link href="/audio">
            <button className="px-8 py-3 bg-[#ffda71] text-[#4C505B] rounded-lg font-bold hover:bg-[#ffda71]/90 transition-colors">
              2 часа расшифровок бесплатно
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

import { FC } from 'react';
import Image from 'next/image';
export const Benefits: FC = () => {
  return (
    <section className="">
      <div className="flex items-center gap-4">
        <Image
          src="/landing/Brain_icon.png"
          alt="Brain icon"
          width={278}
          height={276}
          className="w-32"
        />
        <p className="text-xl font-sans">
          Практика активирует сразу все речевые центры, отвечающие за
          восприятие, воспроизведение и понимание речи. Язык начинает прорастать
          в сознании естественным образом.
        </p>
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-xl font-heading">Поэтому ПРАКТИКА</p>
        <div className="relative">
          <Image
            src="/landing/Razvivaet.jpg"
            alt="Brain icon"
            width={592}
            height={157}
            className="w-80"
          />
        </div>
      </div>
      <div className="flex relative">
        <div className="relative left-48 flex">
          <Image
            src="/landing/3_ Arrow_1.jpg"
            width={418}
            height={234}
            alt="Arrow"
            className="w-48"
          />
          <div className="relative left-12 flex">
            <Image
              src="/landing/3_ Arrow_2.jpg"
              width={201}
              height={236}
              alt="Arrow"
              className="w-24"
            />
            <div className="relative left-48">
              <Image
                src="/landing/3_ Arrow_3.jpg"
                width={198}
                height={176}
                alt="Arrow"
                className="w-28 "
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-start gap-8 mt-8">
        <div className="w-1/2 flex items-start gap-4">
          <div className="w-1/2">
            <h3 className="inline-block bg-blue-900 text-white font-heading text-4xl leading-none">
              СКОРОСТЬ РЕЧИ
            </h3>
            <p className="text-lg font-sans leading-tight">
              Чтение вслух - это уже говорение. Речевые центры нарабатывают
              новые нейронные связи. А грамматические конструкции сами собой
              встраиваются в речь. Именно поэтому практика также поможет
              начинающим преодолеть языковой барьер.
            </p>
          </div>
          <div className="w-1/2">
            <h3 className="inline-block bg-blue-900 text-white font-heading text-4xl leading-none">
              ПОНИМАНИЕ
            </h3>
            <p className="text-lg font-sans leading-tight">
              Активное слушание, подкрепленное визуально чтением, прокачивает
              listening, как говорил тренер Рокки, Микки.
            </p>
          </div>
        </div>

        <div className="w-1/2 flex-col">
          <div className="flex relative justify-center gap-2">
            <Image
              src="/landing/3_ Arrow_4.jpg"
              width={211}
              height={159}
              alt="Arrow"
              className="w-12 top-8 relative"
            />
            <h3 className="inline-block bg-blue-900 text-white uppercase font-heading text-4xl leading-none">
              ПРОИЗНОШЕНИЕ
            </h3>
            <Image
              src="/landing/3_ Arrow_5.jpg"
              width={171}
              height={11}
              alt="Arrow"
              className="w-12 top-8 relative"
            />
          </div>
          <div className="flex items-start gap-12">
            <div className="w-3/5 mt-8">
              <h3 className="inline uppercase font-heading text-4xl whitespace-nowrap">
                АРТИКУЛЯЦИОННУЮ БАЗУ
              </h3>
              <p className="text-lg font-sans leading-tight">
                У каждого языка своя активная группа мышц лица и ротовой
                полости. Наши мышцы прокачены под родной язык. А мы пытаемся
                говорить ими же на иностранном - и получаем акцент. Выход один -
                копировать речь носителей и учить мышцы работать по-новому.
              </p>
            </div>
            <div className="w-2/5 mt-8">
              <h3 className="inline uppercase font-heading text-4xl leading-none">
                ИНТОНАЦИЮ
              </h3>
              <p className="text-lg font-sans leading-tight">
                Именно по интонации носители языка понимают, что с ними говорит
                иностранец. Перенять правильную интонацию можно только
                постоянным копированием.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

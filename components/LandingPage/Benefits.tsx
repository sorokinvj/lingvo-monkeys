import { FC } from 'react';
import Image from 'next/image';

export const Benefits: FC = () => {
  return (
    <>
      <div className="flex gap-24 md:gap-36 justify-center">
        <img
          src="/landing/2_Arrow_1.jpg"
          alt="Arrow"
          className="h-12 md:h-24"
        />
        <img
          src="/landing/2_Arrow_3.jpg"
          alt="Arrow"
          className="h-12 md:h-24"
        />
        <img
          src="/landing/2_Arrow_2.jpg"
          alt="Arrow"
          className="h-12 md:h-24"
        />
      </div>
      <h2 className="text-center text-3xl md:text-5xl uppercase font-heading flex items-center justify-center gap-2">
        <span>Загружай язык прямо в мозг</span>
      </h2>
      <section className="flex flex-col gap-4 px-4 md:px-0">
        <div className="flex items-center gap-4">
          <Image
            src="/landing/Brain_icon.png"
            alt="Brain icon"
            width={278}
            height={276}
            className="w-32 hidden md:block"
          />
          <p className="text-base md:text-xl font-sans font-light leading-[21px]">
            Практика активирует сразу все речевые центры, отвечающие за
            восприятие, воспроизведение и понимание речи. Язык начинает
            прорастать в сознании естественным образом.
          </p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-xl font-heading">Поэтому ПРАКТИКА</p>
          <div className="relative">
            <Image
              src="/landing/Razvivaet.jpg"
              alt="Razvivaet"
              width={592}
              height={157}
              className="w-80"
            />
            <div className="hidden md:flex relative -left-36">
              <div className="flex">
                <Image
                  src="/landing/3_ Arrow_1.jpg"
                  width={59}
                  height={22.5}
                  alt="Arrow"
                />
                <div className="relative left-24 flex">
                  <Image
                    src="/landing/3_ Arrow_2.jpg"
                    width={28}
                    height={35}
                    alt="Arrow"
                  />
                  <div className="relative left-60">
                    <Image
                      src="/landing/3_ Arrow_3.jpg"
                      width={30}
                      height={35}
                      alt="Arrow"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-start md:gap-8 md:px-4">
          <div className="w-full md:w-1/2 flex flex-col gap-8 md:flex-row items-start md:gap-4">
            <div className="w-full md:w-1/2">
              <div className="flex items-center gap-2">
                <h3 className="inline-block bg-blue-900 text-white font-heading text-4xl leading-none">
                  СКОРОСТЬ РЕЧИ
                </h3>
                <Image
                  src="/landing/BLOCK 3_ Arrow 3-left.png"
                  width={97}
                  height={97}
                  alt="Arrow"
                  className="w-12 md:hidden"
                />
              </div>
              <p className="text-base md:text-lg font-sans font-light leading-[21px] mt-2">
                Чтение вслух - это уже говорение. Речевые центры нарабатывают
                новые нейронные связи, а грамматические конструкции сами собой
                встраиваются в речь. Именно поэтому практика также помогает
                преодолеть языковой барьер.
              </p>
            </div>
            <div className="w-full md:w-1/2">
              <div className="flex items-center gap-2">
                <h3 className="inline-block bg-blue-900 text-white font-heading text-4xl leading-none">
                  ПОНИМАНИЕ
                </h3>
                <Image
                  src="/landing/BLOCK 3_ Arrow 3-left-2.png"
                  width={36}
                  height={20}
                  alt="Arrow"
                  className="w-12 md:hidden"
                />
              </div>
              <p className="text-base md:text-lg font-sans font-light leading-[21px] mt-2">
                Активное слушание и одновременное чтение - лучшая тренировка
                уха, которая фантастически прокачивает listening.
              </p>
            </div>
          </div>

          <div className="w-full md:w-1/2 flex-col mt-8 md:mt-0">
            <div className="flex relative md:justify-center gap-2">
              <Image
                src="/landing/3_ Arrow_4.jpg"
                width={211}
                height={159}
                alt="Arrow"
                className="hidden md:block w-12 top-8 relative"
              />
              <h3 className="inline-block bg-blue-900 text-white uppercase font-heading text-4xl leading-none">
                ПРОИЗНОШЕНИЕ
              </h3>
              <Image
                src="/landing/3_ Arrow_5.jpg"
                width={171}
                height={11}
                alt="Arrow"
                className="hidden md:block w-12 top-8 relative"
              />
            </div>
            <div className="flex flex-col md:flex-row items-start gap-4 md:gap-12">
              <div className="w-full md:w-3/5 mt-2 md:mt-8">
                <div className="flex items-center gap-2 pl-4 md:pl-0">
                  <Image
                    src="/landing/BLOCK 2_Arrow_3-right-down.png"
                    width={38}
                    height={34}
                    alt="Arrow"
                    className="w-12 md:hidden"
                  />
                  <h3 className="inline uppercase font-heading text-2xl md:text-4xl whitespace-nowrap">
                    АРТИКУЛЯЦИОННУЮ БАЗУ
                  </h3>
                </div>
                <p className="text-base md:text-lg font-sans font-light leading-[21px] mt-2">
                  У каждого языка своя активная группа мышц лица и ротовой
                  полости. Наши мышцы прокачены под родной язык. А мы пытаемся
                  говорить ими же на иностранном - поэтому и возникает акцент.
                  Выход один - копировать речь носителей и учить мышцы работать
                  по-новому.
                </p>
              </div>
              <div className="w-full md:w-2/5 md:mt-8">
                <div className="flex items-center gap-4 pl-4 md:pl-0">
                  <Image
                    src="/landing/BLOCK 2_Arrow_3-right-down-2.png"
                    width={26}
                    height={26}
                    alt="Arrow"
                    className="w-8 md:hidden"
                  />
                  <h3 className="inline uppercase font-heading text-2xl md:text-4xl leading-none">
                    ИНТОНАЦИЮ
                  </h3>
                </div>
                <p className="text-base md:text-lg font-sans font-light leading-[21px] mt-2">
                  Именно по интонации носители языка понимают, что с ними
                  говорит иностранец. Перенять правильную интонацию можно только
                  постоянным копированием.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

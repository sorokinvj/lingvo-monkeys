import Link from 'next/link';
import Image from 'next/image';

export function Hero() {
  return (
    <section className="w-full flex flex-col items-center px-4 md:px-0">
      {/* Top Section - Title and Hand */}
      <div className="w-full flex flex-col items-center mb-6">
        {/* Mobile Title + Hand */}
        <div className="flex items-start justify-between w-full relative md:hidden">
          <h1 className="absolute top-0 left-0 mt-4 text-3xl font-heading uppercase text-left md:hidden">
            <span>Простой</span> <span>способ</span>
            <br />
            <span>выучить язык</span>
            <img
              src="/landing/bez_skykoti.jpg"
              alt="Blue text"
              className="mt-2 w-full max-w-[150px]"
            />
          </h1>
          <button className="absolute bottom-16 right-0 left-0 font-heading text-blue-900 text-4xl uppercase underline hover:text-blue-600">
            Начать
            <br className="md:hidden" /> обезьянничать
          </button>
          <Image
            src="/landing/Hand_down_mobile.png"
            alt="Hand"
            className="z-10 w-full mt-48"
            width={1408}
            height={1154}
            priority
            sizes="100vw"
          />
        </div>

        {/* Desktop version hidden on mobile */}
        <div className="hidden w-full md:flex md:items-center md:justify-between">
          <img
            src="/landing/hand-up-low.jpg"
            alt="Hand"
            className="w-[283px] rotate-90"
          />

          <div className="flex flex-col items-center">
            <h1 className="text-4xl font-heading uppercase text-center leading-normal">
              <span>Простой</span> <br />
              <span>способ</span> <br />
              <span>выучить язык</span>
            </h1>

            <img
              src="/landing/bez_skykoti.jpg"
              alt="Blue text"
              className="w-[220px] mt-2"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-4">
              <img
                src="/landing/1_Arrow_Top.jpg"
                alt="Arrow"
                className="w-8 h-8 min-w-[64px] min-h-[32px]"
              />
              <img
                src="/landing/1_Arrow_Middle.jpg"
                alt="Arrow"
                className="w-8 h-8 min-w-[64px] min-h-[32px]"
              />
              <img
                src="/landing/1_Arrow_Bottom.jpg"
                alt="Arrow"
                className="w-8 h-8 min-w-[64px] min-h-[32px]"
              />
            </div>

            <div className="w-[300px] mx-auto mb-6">
              <Link href="/sign-up">
                <div className="relative aspect-[2.33/1]">
                  <Image
                    src="/landing/Circle_new_2.png"
                    alt="Button background"
                    fill
                    className="object-contain"
                    priority
                    sizes="100vw"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="font-heading text-4xl md:text-2xl sm:text-2xl uppercase underline hover:text-blue-900">
                      Начать
                      <br className="md:hidden" /> обезьянничать
                    </button>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}

      <div className="w-full md:max-w-[600px] md:mx-auto">
        <p className="mt-4 mb-8 md:my-8 text-base sm:text-xl font-sans leading-tight">
          Языковая <span className="text-blue-600">"техника обезьяны"</span> -
          это способ учить язык так же, как{' '}
          <span className="text-blue-600">это делают дети</span>, слушая и
          повторяя за окружающими. Суть в том, что ты слушаешь и одновременно
          читаешь вслух интересную книгу, а всю работу выполняют{' '}
          <span className="text-blue-600">зеркальные нейроны</span>!
        </p>
      </div>

      {/* Icons Section */}
      <div className="flex justify-center items-center gap-4 my-8">
        {/* Each icon group */}
        <div className="flex flex-col md:flex-row items-center">
          <img
            src="/landing/Monkey__LISTEN_BIG.jpg"
            alt="Monkey Listen"
            className="hidden md:block md:h-32"
          />
          <img
            src="/landing/Monkey__LISTEN_BIG_cut.jpg"
            alt="Monkey Listen"
            className="h-[50px] md:w-32 md:hidden"
          />
          <span className="font-heading text-xl sm:text-2xl uppercase">
            Слушай
          </span>
        </div>
        <span className="text-4xl">+</span>
        <div className="flex flex-col md:flex-row items-center">
          <img
            src="/landing/Monkey__SEE_BIG.jpg"
            alt="Monkey See"
            className="hidden md:block md:h-32"
          />
          <img
            src="/landing/Monkey__SEE_BIG_cut.png"
            alt="Monkey See"
            className="h-[50px] md:w-32 md:hidden"
          />
          <span className="font-heading text-xl sm:text-2xl uppercase">
            Читай
          </span>
        </div>
        <span className="text-4xl">+</span>
        <div className="flex flex-col md:flex-row items-center">
          <img
            src="/landing/Monkey_SPEAK_BIG.jpg"
            alt="Monkey Speak"
            className="hidden md:block md:h-32"
          />
          <img
            src="/landing/Monkey_SPEAK_BIG_cut.png"
            alt="Monkey Speak"
            className="h-[50px] md:w-32 md:hidden"
          />
          <span className="font-heading text-xl sm:text-2xl uppercase">
            Произноси
          </span>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="w-full flex flex-col items-center">
        <span className="bg-blue-900 text-white uppercase font-heading text-2xl sm:text-4xl tracking-widest px-2 py-1">
          О д н о в р е м е н н о
        </span>
      </div>

      <div className="mt-4 md:mt-16 flex gap-24 md:gap-48 md:justify-center">
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
    </section>
  );
}

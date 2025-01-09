import Image from 'next/image';

export function Hero() {
  return (
    <section className="text-center p-8">
      <div className="flex justify-between items-center mb-8">
        <img
          src="/landing/hand-up-low.jpg"
          alt="Hand"
          className="w-[283px] rotate-90"
        />
        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-heading uppercase">
            <span>Простой</span> <br />
            <span>способ</span> <br />
            <span>выучить язык</span>
          </h1>

          <img
            src="/landing/bez_skykoti.jpg"
            alt="Blue text"
            className="w-1/2 mt-2"
          />
        </div>
        <div className="flex items-center">
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

          <div className="relative inline-block">
            <div className="relative w-[350px] h-[150px]">
              <Image
                src="/landing/Circle_new_2.png"
                alt="Button background"
                fill
                className="object-contain"
                priority
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="font-heading text-2xl uppercase underline hover:text-fuchsia-500">
                  Начать обезьянничать
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="mb-8 text-xl font-sans">
        Языковая <span className="text-blue-600">“техника обезьяны”</span> - это
        способ учить язык так же, как{' '}
        <span className="text-blue-600">это делают дети</span>, слушая и
        повторяя за окружающими. Суть в том, что ты слушаешь и одновременно
        читаешь вслух интересную книгу, а всю работу выполняют{' '}
        <span className="text-blue-600">зеркальные нейроны</span>!
      </p>
      <div className="flex justify-center items-center mb-8 gap-8">
        <div className="flex items-center">
          <img
            src="/landing/Monkey__LISTEN_BIG.jpg"
            alt="Monkey Listen"
            className="w-32"
          />
          <span className="font-heading text-4xl uppercase">Слушай</span>
        </div>
        <span className="text-4xl mx-2">+</span>
        <div className="flex items-center">
          <img
            src="/landing/Monkey__SEE_BIG.jpg"
            alt="Monkey See"
            className="w-32"
          />
          <span className="font-heading text-4xl uppercase">Читай</span>
        </div>
        <span className="text-4xl mx-2">+</span>
        <div className="flex items-center">
          <img
            src="/landing/Monkey_SPEAK_BIG.jpg"
            alt="Monkey Speak"
            className="w-32"
          />
          <span className="font-heading text-4xl uppercase">Произноси</span>
        </div>
      </div>
      <div className="mb-4">
        <span className="inline-block bg-blue-900 text-white uppercase font-heading text-4xl tracking-widest leading-none">
          О д н о в р е м е н н о
        </span>
        <p className="text-8xl font-heading">=</p>
      </div>
      <h2 className="text-6xl uppercase font-heading mb-8">
        Загружай язык прямо в мозг
      </h2>
      <div className="flex gap-40 justify-center">
        <img src="/landing/2_Arrow_1.jpg" alt="Arrow" className="h-24" />
        <img src="/landing/2_Arrow_3.jpg" alt="Arrow" className="h-24" />
        <img src="/landing/2_Arrow_2.jpg" alt="Arrow" className="h-24" />
      </div>
    </section>
  );
}

import Image from 'next/image';

export const WhatToDo = () => {
  return (
    <>
      <section className="mt-8 md:mt-0 w-full flex flex-col md:flex-row gap-4 md:gap-16">
        <div className="w-full flex gap-4 pr-4 md:pr-0 relative">
          <Image
            src="/landing/Monkey_HEADPHONES_and_BOOK.jpg"
            width={1144}
            height={1124}
            alt="Monkey with headphones and book"
            className="hidden md:block w-80 absolute"
          />
          <Image
            src="/landing/Monkey_HEADPHONES_and_BOOK_cut.jpg"
            width={87}
            height={130}
            alt="Monkey with headphones and book"
            className="md:hidden min-w-16 w-full"
          />
          <div className="flex flex-col relative md:ml-56 md:pt-36 ">
            <h2 className="text-4xl font-heading uppercase flex flex-row gap-2 md:flex-col md:items-end md:text-5xl md:leading-tight md:font-bold">
              <span>ЧТО</span>
              <span>НАДО</span>
              <span>ДЕЛАТЬ?</span>
            </h2>
            <div className="flex items-center">
              <Image
                src="/landing/Popodrobnej_pogaluysta_MOBILE.jpg"
                width={3463}
                height={406}
                alt="Поподробнее"
                className="w-full md:hidden"
              />
              <Image
                src="/landing/Popodrobnej_pozhlujsta.jpg"
                width={1984}
                height={776}
                alt="Поподробнее, пожалуйста!"
                className="hidden md:w-[250px] md:block"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-6 md:pt-36 px-4 md:px-0 md:pr-4">
          <div className="flex flex-col">
            <div className="flex flex-row gap-4 items-end">
              <h3 className="font-bold">ПОДОБРАТЬ АУДИО-КНИГУ</h3>
              <Image
                src="/landing/Lingvomonkeys_PAW_left.png"
                width={154}
                height={124}
                alt="Arrow"
                className="w-12 md:hidden"
              />
            </div>
            <p className="text-base md:text-lg font-sans leading-[21px] font-light">
              Для уже владеющих языком подойдут любые оригинальные аудио-тексты.
              Если это пока слишком сложно, просто бери адаптированные книги
              (Beginner/Elementary - для начинающих, Intermediate - для среднего
              уровня). Так же лучше определиться, какой акцент предпочитетльно
              развивать (например, Американский или Британский английский) и,
              следовательно, обращать внимание на акцент диктора в аудио.
              Кое-что, для начала занятий можно найти в нашей Library. Там же -
              полезные ссылки для самостоятельного поиска.
            </p>
          </div>
          <div className="flex flex-col">
            <div className="flex flex-row gap-4 items-end">
              <Image
                src="/landing/Lingvomonkeys_PAW_right.png"
                width={136}
                height={123}
                alt="Arrow"
                className="w-12 md:hidden"
              />
              <h3 className="font-bold">ЗАНИМАТЬСЯ В НАУШНИКАХ</h3>
            </div>
            <p className="text-base md:text-lg font-sans leading-[21px] font-light">
              В наушниках меньше слышно собственный голос, и проще
              сконцентрироваться на голосе диктора. Попробуй заниматься и в
              наушниках, и без - проверь, как удобней тебе?
            </p>
          </div>

          <div className="flex flex-col">
            <div className="flex gap-8 items-end">
              <h3 className="font-bold inline">
                <span className="whitespace-nowrap">
                  ЧИТАТЬ ОДНОВРЕМЕННО С ДИКТОРОМ
                </span>
              </h3>
              <Image
                src="/landing/Lingvomonkeys_PAW_down_small.png"
                width={121}
                height={152}
                alt="Arrow"
                className="w-12 md:hidden"
              />
            </div>
            <p className="text-base md:text-lg font-sans leading-[21px] font-light">
              Важно стремиться к одновременному, синхронному чтению. Первое
              время будет сложно, но со временем, обязательно начнет получаться.
              В нашем плеере можно понизить скорость аудио. И постепенно
              повышать ее, доводя свое чтение до естественной для носителей
              скорости.
            </p>
          </div>
        </div>
      </section>
      <div className="md:hidden flex items-center gap-4 justify-around px-4">
        <Image
          src="/landing/i_konechno_zhe.png"
          width={372}
          height={294}
          alt="Monkey upside down"
          className="w-1/3"
        />
        <Image
          src="/landing/Monkey_UpsideDown.jpg"
          width={545}
          height={551}
          alt="Monkey upside down"
          className="w-1/2"
        />
      </div>

      <section className="px-4 md:px-0 md:mt-8 flex md:items-start md:gap-12 md:justify-between md:max-w-5xl md:mx-auto">
        <div className="flex flex-col">
          <h3 className="font-bold">ОБЕЗЬЯННИЧАТЬ!</h3>
          <p className="text-base md:text-lg font-sans leading-[21px] font-light">
            Кое-где существует вредное мнение, что обезьянничать неприлично. Это
            не правда! Это самая естественная способность человека, благодаря
            которой он в принципе разговаривает! Поэтому обезьянничай вволю.
            Старайся произносить слова так же, как диктор, копируй, пародируй
            произношение и интонации. И результат не заставит себя ждать!
          </p>
        </div>
        <Image
          src="/landing/Monkey_UpsideDown.jpg"
          width={545}
          height={551}
          alt="Monkey upside down"
          className="hidden md:block w-80"
        />
      </section>
    </>
  );
};

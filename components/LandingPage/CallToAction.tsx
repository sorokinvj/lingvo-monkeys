import Image from 'next/image';
import Link from 'next/link';

export const CallToAction = () => {
  return (
    <section className="flex flex-col items-center justify-center md:-mt-24">
      <div className="w-full md:w-[850px] mx-auto mb-6 mr-18">
        <Link href="/sign-up">
          <div className="relative aspect-[2.33/1]">
            <Image
              src="/landing/Block_Bottom_TRANSPARENT.png"
              alt="Button background"
              fill
              className="object-contain"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="text-3xl pt-12 pl-12 md:pt-32 md:pl-24 font-heading font-[500] md:text-6xl uppercase underline hover:text-blue-900">
                Пробовать!
              </button>
            </div>
          </div>
        </Link>
      </div>
      <Image
        src="/landing/zagogulina.jpg"
        alt="Button background"
        width={1598}
        height={283}
        className="-mt-12 md:-mt-24"
      />
    </section>
  );
};

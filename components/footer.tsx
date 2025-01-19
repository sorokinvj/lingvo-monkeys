import Image from 'next/image';

export const Footer = () => {
  return (
    <footer className="w-full md:max-w-5xl md:mx-auto px-4 pt-12 pb-12">
      <div className="w-1/2 flex items-center gap-8">
        <Image
          src="/landing/Lingvomonkeys_PAW_right.png"
          width={136}
          height={123}
          alt="Arrow"
          className="w-24"
        />
        <p>
          Напиши нам, что думаешь об этом на{' '}
          <a
            href="mailto:lingvomonkeys@gmail.com"
            className="underline text-blue-600 hover:text-blue-900"
          >
            lingvomonkeys@gmail.com
          </a>
        </p>
      </div>
      <div className="w-1/2"></div>
    </footer>
  );
};

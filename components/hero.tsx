import Image from 'next/image';

export default function Header() {
  return (
    <div className="flex flex-col items-center p">
      <Image
        src="/monkey_hero.jpg"
        alt="Logo"
        width={0}
        height={0}
        sizes="100vw"
        style={{ width: '100%', height: 'auto' }}
        priority
      />
    </div>
  );
}

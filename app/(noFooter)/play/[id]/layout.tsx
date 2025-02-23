import { Header } from '@/components/header';

const NoFooterLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="min-h-screen flex flex-col items-start w-full overflow-hidden md:overflow-visible md:max-w-6xl md:mx-auto">
      <Header />
      <div className="w-full flex-1">{children}</div>
    </main>
  );
};

export default NoFooterLayout;

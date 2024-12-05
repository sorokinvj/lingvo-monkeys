export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
      {children}
    </div>
  );
}

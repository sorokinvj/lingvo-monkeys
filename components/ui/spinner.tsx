import { cn } from '@/lib/utils';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  fullscreen?: boolean;
}

export function Spinner({
  className,
  size = 'lg',
  fullscreen = false,
  ...props
}: SpinnerProps) {
  const spinnerSize = fullscreen
    ? 'h-16 w-16 text-6xl'
    : cn({
        'h-4 w-4 text-sm': size === 'sm',
        'h-6 w-6 text-xl': size === 'md',
        'h-8 w-8 text-2xl': size === 'lg',
      });

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
        <div className={cn(spinnerSize)} {...props}>
          <div className="animate-spin">🍌</div>
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('inline-block', spinnerSize, className)} {...props}>
      <div className="animate-spin">🍌</div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

import clsx from 'clsx';
import type React from 'react';
import { Button } from './button';

export function Pagination({
  'aria-label': ariaLabel = 'Page navigation',
  className,
  ...props
}: React.ComponentPropsWithoutRef<'nav'>) {
  return (
    <nav
      aria-label={ariaLabel}
      {...props}
      className={clsx(className, 'flex justify-center items-center max-w-full')}
    />
  );
}

export function PaginationPrevious({
  children = 'Previous',
  onClick,
  disabled,
}: {
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      aria-label="Previous page"
      onClick={onClick}
      disabled={disabled}
    >
      <svg
        className="stroke-current"
        data-slot="icon"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M2.75 8H13.25M2.75 8L5.25 5.5M2.75 8L5.25 10.5"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {children}
    </Button>
  );
}

export function PaginationNext({
  children = 'Next',
  onClick,
  disabled,
}: {
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      aria-label="Next page"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
      <svg
        className="stroke-current"
        data-slot="icon"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M13.25 8L2.75 8M13.25 8L10.75 10.5M13.25 8L10.75 5.5"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Button>
  );
}

export function PaginationList({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-x-2 overflow-x-auto">{children}</div>
  );
}

export function PaginationPage({
  children,
  current = false,
  onClick,
}: {
  href?: string;
  children: React.ReactNode;
  current?: boolean;
  onClick?: () => void;
}) {
  return (
    <Button
      color={current ? 'blue' : undefined}
      variant={current ? 'outline' : 'ghost'}
      aria-label={`Page ${children}`}
      aria-current={current ? 'page' : undefined}
      onClick={onClick}
    >
      <span className="-mx-0.5">{children}</span>
    </Button>
  );
}

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const getPageNumbers = () => {
    const delta = 2; // Number of pages to show on each side of the current page
    const range = [];
    const rangeWithDots = [];

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }

    let l;
    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  return (
    <Pagination aria-label="Table pagination">
      <PaginationPrevious
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      />
      <PaginationList>
        {getPageNumbers().map((pageNumber, index) =>
          pageNumber === '...' ? (
            <span key={`ellipsis-${index}`} className="px-2">
              ...
            </span>
          ) : (
            <PaginationPage
              key={pageNumber}
              onClick={() => onPageChange(pageNumber as number)}
              current={pageNumber === currentPage}
            >
              <span>{pageNumber}</span>
            </PaginationPage>
          )
        )}
      </PaginationList>
      <PaginationNext
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      />
    </Pagination>
  );
};

import React, { useState } from 'react';
import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  ColumnDef,
  VisibilityState,
  PaginationState,
} from '@tanstack/react-table';
import clsx from 'clsx';
import { TablePagination } from './pagination';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export type CustomColumnMeta = {
  isCustomerInfo?: boolean;
  isHighlightable?: boolean;
  className?: string;
  isSticky?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CustomColumnDef<T> = ColumnDef<T, any> & {
  meta?: CustomColumnMeta;
};

interface GenericTableProps<T> {
  data: T[];
  columns: CustomColumnDef<T>[];
  defaultSort: { id: string; desc: boolean }[];
  EmptyComponent?: React.ComponentType;
  pageSize?: number;
  columnVisibility?: VisibilityState;
  MobileComponent?: React.ComponentType<{ item: T }>;
}

const GenericTable = <T extends { id: string | number }>({
  data,
  columns,
  defaultSort,
  EmptyComponent,
  pageSize = 10,
  columnVisibility,
  MobileComponent,
}: GenericTableProps<T>) => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting: defaultSort,
      pagination,
      columnVisibility,
    },
    onPaginationChange: setPagination,
    getRowId: (row) => row.id.toString(),
  });

  const isMobile = useMediaQuery('(max-width: 768px)');

  if (data.length === 0 && EmptyComponent) {
    return <EmptyComponent />;
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <div className="h-full overflow-auto">
          {!isMobile ? (
            // Desktop view - Table
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-white sticky top-0 border-b border-gray-200">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const width = header.column.getSize();
                      console.log('width for header', header.id, width);
                      const headerClassName = clsx('p-4 text-left bg-white');
                      return (
                        <th
                          key={header.id}
                          className={headerClassName}
                          style={{
                            width: `${width}px`,
                            minWidth: `${width}px`,
                          }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-200">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    {row.getVisibleCells().map((cell) => {
                      const width = cell.column.getSize();
                      const cellClassName = clsx('p-4 text-left');
                      return (
                        <td
                          key={cell.id}
                          className={cellClassName}
                          style={{
                            width: `${width}px`,
                            minWidth: `${width}px`,
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : MobileComponent ? (
            // Mobile view with custom component
            <div className="space-y-4">
              {table.getRowModel().rows.map((row) => (
                <MobileComponent key={row.id} item={row.original} />
              ))}
            </div>
          ) : (
            // Default mobile view if no custom component provided
            <div className="space-y-4 px-4">
              {table.getRowModel().rows.map((row) => (
                <div
                  key={row.id}
                  className="bg-white p-4 rounded-lg shadow border border-gray-200"
                >
                  {row.getVisibleCells().map((cell) => (
                    <div key={cell.id} className="py-2">
                      <div className="text-sm text-gray-500">
                        {typeof cell.column.columnDef.header === 'string'
                          ? cell.column.columnDef.header
                          : cell.column.id}
                      </div>
                      <div className="mt-1">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {data.length > pageSize && (
        <div className="mt-4">
          <TablePagination
            currentPage={pagination.pageIndex + 1}
            totalPages={table.getPageCount()}
            onPageChange={(page) => table.setPageIndex(page - 1)}
          />
        </div>
      )}
    </div>
  );
};

export default GenericTable;

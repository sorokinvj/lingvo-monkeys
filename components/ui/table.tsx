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
}

const GenericTable = <T extends { id: string | number }>({
  data,
  columns,
  defaultSort,
  EmptyComponent,
  pageSize = 10,
  columnVisibility,
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

  if (data.length === 0 && EmptyComponent) {
    return <EmptyComponent />;
  }

  return (
    <div className="grid gap-4 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="divide-y divide-gray-200">
          <thead className="border-b border-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const width = header.column.getSize();
                  const headerClassName = clsx(
                    'p-4 whitespace-nowrap text-left'
                  );
                  return (
                    <th
                      key={header.id}
                      className={headerClassName}
                      style={{
                        width: `${width}px`,
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
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr className="border-b border-gray-200 cursor-pointer overflow-hidden transition-all duration-300 ease-out">
                {row.getVisibleCells().map((cell) => {
                  const width = cell.column.getSize();
                  const cellClassName = clsx(`p-4 whitespace-nowrap text-left`);
                  return (
                    <td
                      key={cell.id}
                      className={cellClassName}
                      style={{
                        width: `${width}px`,
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
      </div>
      {data.length > pageSize && (
        <TablePagination
          currentPage={pagination.pageIndex + 1}
          totalPages={table.getPageCount()}
          onPageChange={(page) => table.setPageIndex(page - 1)}
        />
      )}
    </div>
  );
};

export default GenericTable;

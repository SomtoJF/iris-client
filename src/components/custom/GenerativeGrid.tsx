"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export type TableColumnDef<TData, TValue = unknown> = ColumnDef<
  TData,
  TValue
> & {
  shimmer?: () => React.ReactNode;
  width?: string;
};

export interface TableConfig<TData> {
  columns: TableColumnDef<TData, any>[];
  data: TData[];
  pagination: {
    pageIndex: number;
    pageSize: number;
    total: number;
    onPageChange: (pageIndex: number) => void;
  };
  loading: boolean;
}

interface GenerativeGridProps<TData> {
  config: TableConfig<TData>;
}

export function GenerativeGrid<TData>({ config }: GenerativeGridProps<TData>) {
  const { columns, data, pagination, loading } = config;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(pagination.total / pagination.pageSize),
  });

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);
  const currentPage = pagination.pageIndex + 1;

  return (
    <div className="w-full space-y-4">
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const width = (
                    header.column.columnDef as TableColumnDef<TData, any>
                  ).width;
                  return (
                    <TableHead
                      key={header.id}
                      style={width ? { width } : undefined}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: pagination.pageSize }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {columns.map((column, colIndex) => (
                    <TableCell
                      key={`skeleton-${index}-${colIndex}`}
                      style={column.width ? { width: column.width } : undefined}
                    >
                      {column.shimmer ? (
                        column.shimmer()
                      ) : (
                        <Skeleton className="h-4 w-full" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => {
                    const width = (
                      cell.column.columnDef as TableColumnDef<TData, any>
                    ).width;
                    return (
                      <TableCell
                        key={cell.id}
                        style={width ? { width } : undefined}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          {pagination.total > 0 ? (
            <>
              Page {currentPage} of {totalPages} ({pagination.total} total)
            </>
          ) : (
            "No results"
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => pagination.onPageChange(pagination.pageIndex - 1)}
            disabled={pagination.pageIndex === 0 || loading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => pagination.onPageChange(pagination.pageIndex + 1)}
            disabled={pagination.pageIndex >= totalPages - 1 || loading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

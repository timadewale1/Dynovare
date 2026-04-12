"use client";

import { Button } from "@/components/ui/button";

export default function ListPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  itemLabel = "items",
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
}) {
  if (totalItems <= pageSize) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(totalItems, page * pageSize);

  return (
    <div className="mt-5 flex flex-col gap-3 rounded-[1.5rem] border bg-white/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--text-secondary)]">
        Showing {start}-{end} of {totalItems} {itemLabel}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="rounded-full"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <div className="min-w-[88px] text-center text-sm font-medium text-blue-deep">
          Page {page} of {totalPages}
        </div>
        <Button
          variant="outline"
          className="rounded-full"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

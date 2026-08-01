import type { ReactNode } from "react";
import { TableCell, TableFooter, TableRow } from "@/components/ui";
import TablePagination from "./TablePagination";

/** Od którego breakpointu kolumna jest widoczna (`always` = zawsze). */
export type TableColumnVisibility = "always" | "sm" | "md" | "lg" | "xl";

type DashboardTableFooterProps = {
  /** Widoczność każdej kolumny tabeli (w kolejności nagłówków). */
  columns: TableColumnVisibility[];
  sumLabel: string;
  sumValue: ReactNode;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
};

const BREAKPOINTS = ["sm", "md", "lg", "xl"] as const;

const visibilityRank: Record<TableColumnVisibility, number> = {
  always: 0,
  sm: 1,
  md: 2,
  lg: 3,
  xl: 4,
};

const countVisible = (
  columns: TableColumnVisibility[],
  rank: number,
) => columns.filter((column) => visibilityRank[column] <= rank).length;

type SpanRow = {
  key: string;
  className: string;
  colSpan: number;
};

/** Wiersze z colSpan = liczba widocznych kolumn na danym zakresie breakpointów. */
const getSpanRows = (columns: TableColumnVisibility[]): SpanRow[] => {
  const counts = [0, 1, 2, 3, 4].map((rank) => countVisible(columns, rank));

  if (counts.every((count) => count === counts[0])) {
    return [{ key: "all", className: "", colSpan: counts[0] }];
  }

  const rows: SpanRow[] = [
    {
      key: "base",
      className: "sm:hidden",
      colSpan: counts[0],
    },
  ];

  let index = 1;
  while (index <= 4) {
    const colSpan = counts[index];
    let end = index;
    while (end < 4 && counts[end + 1] === colSpan) {
      end += 1;
    }

    const startBp = BREAKPOINTS[index - 1];
    const hideBp = end < 4 ? BREAKPOINTS[end] : null;

    rows.push({
      key: `${startBp}-${end}`,
      className: hideBp
        ? `hidden ${startBp}:table-row ${hideBp}:hidden`
        : `hidden ${startBp}:table-row`,
      colSpan,
    });

    index = end + 1;
  }

  return rows;
};

const DashboardTableFooter = ({
  columns,
  sumLabel,
  sumValue,
  page,
  totalPages,
  onPageChange,
}: DashboardTableFooterProps) => {
  const spanRows = getSpanRows(columns);
  const showPagination =
    page != null && totalPages != null && onPageChange != null;

  return (
    <TableFooter>
      {showPagination &&
        spanRows.map((row) => (
          <TableRow key={`pagination-${row.key}`} className={row.className}>
            <TableCell colSpan={row.colSpan}>
              <TablePagination
                page={page}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            </TableCell>
          </TableRow>
        ))}

      {spanRows.map((row) => (
        <TableRow key={`sum-${row.key}`} className={row.className}>
          <TableCell colSpan={row.colSpan}>
            <div className="flex w-full items-center justify-between gap-4">
              <span>{sumLabel}</span>
              <span>{sumValue}</span>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </TableFooter>
  );
};

export default DashboardTableFooter;

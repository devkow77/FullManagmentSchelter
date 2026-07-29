import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";

type DashboardTableSkeletonProps = {
  columns: number;
  rows?: number;
  showAvatar?: boolean;
  showActions?: boolean;
  /** Liczba skeletonów w pasku filtrów (pierwszy = wyszukiwarka). Brak = bez paska. */
  filters?: number;
  tableClassName?: string;
};

const DashboardTableSkeleton = ({
  columns,
  rows = 8,
  showAvatar = false,
  showActions = true,
  filters,
  tableClassName,
}: DashboardTableSkeletonProps) => {
  const actionColumns = showActions ? 1 : 0;
  const avatarColumns = showAvatar ? 1 : 0;
  const middleColumns = Math.max(0, columns - avatarColumns - actionColumns);

  return (
    <section id="table" className="space-y-4">
      {filters != null && filters > 0 && (
        <div className="flex flex-wrap items-center gap-4 py-4">
          <Skeleton className="h-9 w-48" />
          {Array.from({ length: filters - 1 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-28" />
          ))}
        </div>
      )}

      <Table className={tableClassName}>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columns }).map((_, index) => (
              <TableHead key={index}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {showAvatar && (
                <TableCell>
                  <div className="flex items-center gap-x-4">
                    <Skeleton className="size-12 shrink-0 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </TableCell>
              )}
              {Array.from({ length: middleColumns }).map((_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
              ))}
              {showActions && (
                <TableCell className="text-right">
                  <Skeleton className="ml-auto size-8 rounded-md" />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
};

export default DashboardTableSkeleton;

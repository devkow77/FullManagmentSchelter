import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FilterToolbarProps = {
  children: ReactNode;
  className?: string;
};

const FilterToolbar = ({ children, className }: FilterToolbarProps) => {
  return (
    <div
      className={cn(
        "sticky top-0 z-10 flex flex-wrap items-center gap-4 bg-white py-4",
        className,
      )}
    >
      {children}
    </div>
  );
};

export default FilterToolbar;

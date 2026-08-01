import { Link } from "react-router";
import { MoreHorizontalIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";

type TableRowActionsProps = {
  editTo?: string;
  editLabel?: string;
  deleteSlot?: ReactNode;
};

const TableRowActions = ({
  editTo,
  editLabel = "Edytuj dane",
  deleteSlot,
}: TableRowActionsProps) => {
  const hasEdit = Boolean(editTo);
  const hasDelete = Boolean(deleteSlot);

  if (!hasEdit && !hasDelete) return null;

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="transparent" size="icon">
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {hasEdit && (
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to={editTo!}>{editLabel}</Link>
            </DropdownMenuItem>
          )}
          {hasEdit && hasDelete && <DropdownMenuSeparator />}
          {hasDelete && (
            <div
              onSelect={(e) => e.preventDefault()}
              className="hover:bg-accent rounded-sm"
            >
              {deleteSlot}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default TableRowActions;

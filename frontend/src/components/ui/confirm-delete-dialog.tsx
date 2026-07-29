import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";

type ConfirmDeleteDialogProps = {
  triggerLabel: string;
  title: string;
  description: string;
  onConfirm: () => void;
  disabled?: boolean;
  triggerClassName?: string;
};

function ConfirmDeleteDialog({
  triggerLabel,
  title,
  description,
  onConfirm,
  disabled,
  triggerClassName = "cursor-pointer px-1.5 text-sm text-red-800",
}: ConfirmDeleteDialogProps) {
  if (disabled) {
    return (
      <span className="cursor-not-allowed px-1.5 text-sm text-red-800/40">
        {triggerLabel}
      </span>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger className={triggerClassName}>
        {triggerLabel}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="cursor-pointer text-red-600"
          >
            Tak, usuń
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ConfirmDeleteDialog;

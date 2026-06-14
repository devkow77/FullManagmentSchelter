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
} from "@/components/ui/alert-dialog";

type Props = {
  vetId: number;
  onConfirm: (id: number) => void;
};

function DeleteVetDialog({ vetId, onConfirm }: Props) {
  return (
    <AlertDialog>
      <AlertDialogTrigger className="cursor-pointer px-1.5 text-sm text-red-600">
        Usuń klinikę
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Czy na pewno chcesz usunąć weterynarza?
          </AlertDialogTitle>

          <AlertDialogDescription>
            Po kliknięciu usuń wszystkie dane o weterynarzu zostaną usunięte w
            bazie, wraz z powiązanymi raportami medycznymi.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Anuluj</AlertDialogCancel>

          <AlertDialogAction
            onClick={() => onConfirm(vetId)}
            className="cursor-pointer text-red-600"
          >
            Tak, usuń
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteVetDialog;

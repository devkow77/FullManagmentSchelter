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
} from './alert-dialog';

type Props = {
  userId: number;
  onConfirm: (id: number) => void;
};

function DeleteUserDialog({ userId, onConfirm }: Props) {
  return (
    <AlertDialog>
      <AlertDialogTrigger className="cursor-pointer px-1.5 text-sm text-red-600">
        Usuń osobę
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Czy na pewno chcesz usunąć użytkownika?
          </AlertDialogTitle>

          <AlertDialogDescription>
            Po kliknięciu usuń wszystkie dane o użytkowniku zostaną usunięte w
            bazie.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Anuluj</AlertDialogCancel>

          <AlertDialogAction
            onClick={() => onConfirm(userId)}
            className="cursor-pointer text-red-600"
          >
            Tak, usuń
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteUserDialog;

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
  animalId: number;
  onConfirm: (id: number) => void;
};

function DeleteAnimalDialog({ animalId, onConfirm }: Props) {
  return (
    <AlertDialog>
      <AlertDialogTrigger className="cursor-pointer px-1.5 text-sm text-red-800">
        Usuń zwierzę
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Czy na pewno chcesz usunąć zwierzę?
          </AlertDialogTitle>

          <AlertDialogDescription>
            Po kliknięciu usuń wszystkie dane o zwierzęciu zostaną usunięte w
            bazie.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Anuluj</AlertDialogCancel>

          <AlertDialogAction
            onClick={() => onConfirm(animalId)}
            className="cursor-pointer text-red-600"
          >
            Tak, usuń
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteAnimalDialog;

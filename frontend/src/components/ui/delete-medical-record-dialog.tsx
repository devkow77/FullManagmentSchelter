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
  medicalRecordId: number;
  onConfirm: (id: number) => void;
};

function DeleteMedicalRecordDialog({ medicalRecordId, onConfirm }: Props) {
  return (
    <AlertDialog>
      <AlertDialogTrigger className="cursor-pointer px-1.5 text-sm text-red-600">
        Usuń klinikę
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Czy na pewno chcesz usunąć raport medyczny?
          </AlertDialogTitle>

          <AlertDialogDescription>
            Po kliknięciu usuń wszystkie dane o raporcie medycznym zostaną
            usunięte w bazie, wraz z powiązanymi raportami medycznymi.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Anuluj</AlertDialogCancel>

          <AlertDialogAction
            onClick={() => onConfirm(medicalRecordId)}
            className="cursor-pointer text-red-600"
          >
            Tak, usuń
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteMedicalRecordDialog;

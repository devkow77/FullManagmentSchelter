import ConfirmDeleteDialog from "./confirm-delete-dialog";

type Props = {
  vetId: number;
  onConfirm: (id: number) => void;
};

function DeleteVetDialog({ vetId, onConfirm }: Props) {
  return (
    <ConfirmDeleteDialog
      triggerLabel="Usuń klinikę"
      title="Czy na pewno chcesz usunąć weterynarza?"
      description="Po kliknięciu usuń wszystkie dane o weterynarzu zostaną usunięte w bazie, wraz z powiązanymi raportami medycznymi."
      triggerClassName="cursor-pointer px-1.5 text-sm text-red-600"
      onConfirm={() => onConfirm(vetId)}
    />
  );
}

export default DeleteVetDialog;

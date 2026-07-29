import ConfirmDeleteDialog from "./confirm-delete-dialog";

type Props = {
  medicalRecordId: number;
  onConfirm: (id: number) => void;
};

function DeleteMedicalRecordDialog({ medicalRecordId, onConfirm }: Props) {
  return (
    <ConfirmDeleteDialog
      triggerLabel="Usuń klinikę"
      title="Czy na pewno chcesz usunąć raport medyczny?"
      description="Po kliknięciu usuń wszystkie dane o raporcie medycznym zostaną usunięte w bazie, wraz z powiązanymi raportami medycznymi."
      triggerClassName="cursor-pointer px-1.5 text-sm text-red-600"
      onConfirm={() => onConfirm(medicalRecordId)}
    />
  );
}

export default DeleteMedicalRecordDialog;

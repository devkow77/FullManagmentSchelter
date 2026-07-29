import ConfirmDeleteDialog from "./confirm-delete-dialog";

type Props = {
  cageId: number;
  cageLabel: string;
  disabled?: boolean;
  onConfirm: (id: number) => void;
};

function DeleteCageDialog({
  cageId,
  cageLabel,
  disabled,
  onConfirm,
}: Props) {
  return (
    <ConfirmDeleteDialog
      triggerLabel="Usuń klatkę"
      title={`Czy na pewno chcesz usunąć klatkę ${cageLabel}?`}
      description="Po usunięciu klatka zniknie z listy. Usunąć można tylko pustą klatkę."
      disabled={disabled}
      onConfirm={() => onConfirm(cageId)}
    />
  );
}

export default DeleteCageDialog;

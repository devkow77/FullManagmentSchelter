import ConfirmDeleteDialog from "./confirm-delete-dialog";

type Props = {
  animalNeedId: number;
  onConfirm: (id: number) => void;
};

function DeleteAnimalNeedDialog({ animalNeedId, onConfirm }: Props) {
  return (
    <ConfirmDeleteDialog
      triggerLabel="Usuń"
      title="Czy na pewno chcesz usunąć zapotrzebowanie?"
      description="Po kliknięciu usuń zapotrzebowanie zostanie usunięte z listy aktywnych zgłoszeń."
      onConfirm={() => onConfirm(animalNeedId)}
    />
  );
}

export default DeleteAnimalNeedDialog;

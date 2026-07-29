import ConfirmDeleteDialog from "./confirm-delete-dialog";

type Props = {
  animalId: number;
  onConfirm: (id: number) => void;
};

function DeleteAnimalDialog({ animalId, onConfirm }: Props) {
  return (
    <ConfirmDeleteDialog
      triggerLabel="Usuń zwierzę"
      title="Czy na pewno chcesz usunąć zwierzę?"
      description="Po kliknięciu usuń wszystkie dane o zwierzęciu zostaną usunięte w bazie."
      onConfirm={() => onConfirm(animalId)}
    />
  );
}

export default DeleteAnimalDialog;

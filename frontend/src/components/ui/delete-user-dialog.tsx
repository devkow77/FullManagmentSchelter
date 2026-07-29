import ConfirmDeleteDialog from "./confirm-delete-dialog";

type Props = {
  userId: number;
  onConfirm: (id: number) => void;
};

function DeleteUserDialog({ userId, onConfirm }: Props) {
  return (
    <ConfirmDeleteDialog
      triggerLabel="Usuń osobę"
      title="Czy na pewno chcesz usunąć użytkownika?"
      description="Po kliknięciu usuń wszystkie dane o użytkowniku zostaną usunięte w bazie."
      triggerClassName="cursor-pointer px-1.5 text-sm text-red-600"
      onConfirm={() => onConfirm(userId)}
    />
  );
}

export default DeleteUserDialog;

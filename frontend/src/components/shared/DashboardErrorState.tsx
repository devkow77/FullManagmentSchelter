import { ErrorState } from "./StatusMessage";

type DashboardErrorStateProps = {
  title: string;
  description?: string;
};

const DashboardErrorState = ({
  title,
  description = "Wystąpił problem podczas pobierania listy. Sprawdź połączenie z internetem i spróbuj ponownie.",
}: DashboardErrorStateProps) => {
  return <ErrorState title={title} description={description} />;
};

export default DashboardErrorState;

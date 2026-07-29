import { CircleAlert } from "lucide-react";

type DashboardErrorStateProps = {
  title: string;
  description?: string;
};

const DashboardErrorState = ({
  title,
  description = "Wystąpił problem podczas pobierania listy. Sprawdź połączenie z internetem i spróbuj ponownie.",
}: DashboardErrorStateProps) => {
  return (
    <section
      id="error"
      className="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center"
    >
      <CircleAlert className="size-12 text-red-600" />
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-red-900">{title}</h2>
        <p className="max-w-md text-sm text-red-800 md:text-base">
          {description}
        </p>
      </div>
    </section>
  );
};

export default DashboardErrorState;

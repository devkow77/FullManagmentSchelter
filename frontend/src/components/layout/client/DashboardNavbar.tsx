import { FileText } from "lucide-react";
import { Link, useLocation } from "react-router";
import type { DashboardNavOption } from "@/types";

const formHref = "/konto/formularz";

const clientOptions: DashboardNavOption[] = [
  {
    icon: FileText,
    href: formHref,
    name: "Formularz danych osobowych",
  },
];

const getCardClassName = (href: string, pathname: string) => {
  const isActive = pathname === href;

  if (isActive) {
    return "rounded-full bg-green-100 border-2 border-green-300 text-green-800";
  }

  return "rounded-2xl border border-gray-300 bg-gray-100 duration-300 hover:bg-white hover:shadow-lg";
};

const DashboardNavbar = () => {
  const location = useLocation();

  return (
    <section className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
      {clientOptions.map((option) => (
        <Link to={option.href} key={option.href}>
          <div
            className={`${getCardClassName(option.href, location.pathname)} relative grid aspect-square place-items-center p-2 text-center font-medium`}
          >
            <div>
              {option.icon && (
                <option.icon
                  size={26}
                  className="mx-auto mb-2 scale-80 md:scale-100"
                />
              )}
              <p className="text-sm">{option.name}</p>
            </div>
          </div>
        </Link>
      ))}
    </section>
  );
};

export default DashboardNavbar;

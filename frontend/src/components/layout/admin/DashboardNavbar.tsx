import {
  PawPrint,
  UsersRound,
  Pencil,
  File,
  ChartColumn,
  ClipboardPlus,
  Package,
  IdCardLanyard,
  ShieldPlus,
  CalendarSync,
  Columns4,
  CalendarDays,
  MessageCircle,
} from "lucide-react";
import { Link, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { DashboardNavOption } from "@/types";

const dailyCareStatusQueryKey = ["animals", "daily-care-status"] as const;
const animalNeedsStatusQueryKey = ["animals", "needs-status"] as const;
const pendingAdoptionsQueryKey = ["adoptions", "pending-count"] as const;
const pendingMedicalRecordsQueryKey = [
  "medical-records",
  "pending-count",
] as const;
const weekCoverageStatusQueryKey = [
  "zone-assignments",
  "current-week-coverage-status",
] as const;

const dailyTasksHref = "/pracownik/codzienne-obowiazki";
const workWeekHref = "/admin/tydzien-pracy";
const needsHref = "/pracownik/zapotrzebowania-zwierzat";
const adoptionsHref = "/admin/adopcje";
const medicalRecordsHref = "/pracownik/raporty-medyczne";

const getDailyCareStatus = async () => {
  const res = await axios.get<{ allComplete: boolean }>(
    "/api/animals/daily-care/status",
  );
  return res.data;
};

const getAnimalNeedsStatus = async () => {
  const res = await axios.get<{
    hasActiveNeeds: boolean;
    activeNeedsCount: number;
  }>("/api/animals/needs/status");
  return res.data;
};

const getPendingAdoptionsCount = async () => {
  const res = await axios.get<{ total: number }>(
    "/api/adoptions?page=1&limit=1&status=OCZEKUJACA",
  );
  return res.data.total;
};

const getPendingMedicalRecordsCount = async () => {
  const res = await axios.get<{ total: number }>(
    "/api/medical-records?page=1&limit=1&status=DO_REALIZACJI",
  );
  return res.data.total;
};

const getWeekCoverageStatus = async () => {
  const res = await axios.get<{ allZonesCovered: boolean }>(
    "/api/zone-assignments/current-week-coverage/status",
  );
  return res.data;
};

const adminOptions: DashboardNavOption[] = [
  {
    icon: PawPrint,
    href: "/pracownik/zwierzeta",
    name: "Zarządzaj zwierzętami",
  },
  {
    icon: IdCardLanyard,
    href: "/admin/pracownicy",
    name: "Zarządzaj pracownikami",
  },
  {
    icon: UsersRound,
    href: "/admin/uzytkownicy",
    name: "Zarządzaj użytkownikami",
  },
  {
    icon: Columns4,
    href: "/admin/klatki",
    name: "Zarządzaj klatkami",
  },

  {
    icon: File,
    href: "/admin/adopcje",
    name: "Wnioski adopcyjne",
  },
  {
    icon: CalendarSync,
    href: dailyTasksHref,
    name: "Codzienne obowiązki pracowników",
  },
  {
    icon: CalendarDays,
    href: workWeekHref,
    name: "Zarządzaj tygodniem pracy",
  },
  {
    icon: ShieldPlus,
    href: "/admin/weterynarze",
    name: "Zarządzaj weterynarzami",
  },
  {
    icon: ClipboardPlus,
    href: medicalRecordsHref,
    name: "Raporty medyczne",
  },
  {
    icon: Package,
    href: needsHref,
    name: "Zapotrzebowania",
  },
  {
    icon: Pencil,
    href: `${import.meta.env.VITE_STRIPE_CMS_ADMIN_URL}/admin`,
    name: "Zarządzaj blogiem",
  },
  ...(import.meta.env.VITE_TEAM_CHAT_URL
    ? [
        {
          icon: MessageCircle,
          href: import.meta.env.VITE_TEAM_CHAT_URL as string,
          name: "Komunikator",
        },
      ]
    : []),
  {
    icon: ChartColumn,
    href: "/admin/statystyki",
    name: "Statystyki",
  },
];

const getCardClassName = (
  href: string,
  pathname: string,
  warningHrefs: Set<string>,
  criticalHrefs: Set<string>,
) => {
  const isActive = pathname === href;
  const isCritical = criticalHrefs.has(href) && !isActive;
  const isWarning = warningHrefs.has(href) && !isActive;

  if (isActive) {
    return "rounded-full bg-green-100 border-2 border-green-300 text-green-800";
  }

  if (isCritical) {
    return "rounded-2xl border-2 border-red-300 bg-red-100 text-red-800 duration-300 hover:bg-red-50 hover:shadow-lg";
  }

  if (isWarning) {
    return "rounded-2xl border-2 border-yellow-300 bg-yellow-100 text-yellow-800 duration-300 hover:bg-yellow-50 hover:shadow-lg";
  }

  return "rounded-2xl border border-gray-300 bg-gray-100 duration-300 hover:bg-white hover:shadow-lg";
};

const DashboardNavbar = () => {
  const location = useLocation();

  const { data: dailyCareStatus } = useQuery({
    queryKey: dailyCareStatusQueryKey,
    queryFn: getDailyCareStatus,
    refetchOnWindowFocus: true,
  });

  const { data: animalNeedsStatus } = useQuery({
    queryKey: animalNeedsStatusQueryKey,
    queryFn: getAnimalNeedsStatus,
    refetchOnWindowFocus: true,
  });

  const { data: weekCoverageStatus } = useQuery({
    queryKey: weekCoverageStatusQueryKey,
    queryFn: getWeekCoverageStatus,
    refetchOnWindowFocus: true,
  });

  const { data: pendingAdoptionsCount = 0 } = useQuery({
    queryKey: pendingAdoptionsQueryKey,
    queryFn: getPendingAdoptionsCount,
    refetchOnWindowFocus: true,
  });

  const { data: pendingMedicalRecordsCount = 0 } = useQuery({
    queryKey: pendingMedicalRecordsQueryKey,
    queryFn: getPendingMedicalRecordsCount,
    refetchOnWindowFocus: true,
  });

  const warningHrefs = new Set<string>();
  const criticalHrefs = new Set<string>();

  if (dailyCareStatus?.allComplete === false) {
    criticalHrefs.add(dailyTasksHref);
  }

  if (weekCoverageStatus?.allZonesCovered === false) {
    criticalHrefs.add(workWeekHref);
  }

  if (pendingAdoptionsCount > 0) {
    warningHrefs.add(adoptionsHref);
  }

  if (pendingMedicalRecordsCount > 0) {
    warningHrefs.add(medicalRecordsHref);
  }

  const activeNeedsCount = animalNeedsStatus?.activeNeedsCount ?? 0;

  if (activeNeedsCount > 0) {
    warningHrefs.add(needsHref);
  }

  return (
    <section className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
      {adminOptions.map((option) => {
        const card = (
          <div
            className={`${getCardClassName(option.href, location.pathname, warningHrefs, criticalHrefs)} relative grid aspect-square place-items-center p-2 text-center font-medium`}
          >
            {option.href === adoptionsHref && pendingAdoptionsCount > 0 && (
              <span className="absolute -top-2 -right-2 grid size-10 place-items-center rounded-full bg-red-800 text-sm font-semibold text-white">
                {pendingAdoptionsCount > 99 ? "+99" : pendingAdoptionsCount}
              </span>
            )}
            {option.href === medicalRecordsHref &&
              pendingMedicalRecordsCount > 0 && (
                <span className="absolute -top-2 -right-2 grid size-10 place-items-center rounded-full bg-red-800 text-sm font-semibold text-white">
                  {pendingMedicalRecordsCount > 99
                    ? "+99"
                    : pendingMedicalRecordsCount}
                </span>
              )}
            {option.href === needsHref && activeNeedsCount > 0 && (
              <span className="absolute -top-2 -right-2 grid size-10 place-items-center rounded-full bg-red-800 text-sm font-semibold text-white">
                {activeNeedsCount > 99 ? "+99" : activeNeedsCount}
              </span>
            )}
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
        );

        if (option.href.startsWith("http")) {
          return (
            <a
              href={option.href}
              key={option.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {card}
            </a>
          );
        }

        return (
          <Link to={option.href} key={option.href}>
            {card}
          </Link>
        );
      })}
    </section>
  );
};

export default DashboardNavbar;

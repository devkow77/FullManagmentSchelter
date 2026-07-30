"use client";

import { Skeleton } from "@/components/ui";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui";
import {
  Bone,
  ClipboardList,
  HeartHandshake,
  Home,
  Lock,
  Mail,
  Percent,
  PawPrint,
  Shield,
  Stethoscope,
  UserCog,
  Users,
} from "lucide-react";
import axios from "axios";
import { useQueries } from "@tanstack/react-query";
import type { ComponentType, ReactNode } from "react";
import { DashboardPage } from "@/components/shared";
import {
  formatAdoptionStatus,
  formatAnimalHealthStatus,
  formatAnimalStatus,
  formatAnimalType,
  formatMedicalRecordStatus,
  formatMedicalRecordType,
} from "@/lib/utils";

type WorkerTotals = {
  total: number;
  administrators: number;
  employees: number;
  twoFactorEnabled: number;
  twoFactorPercent: number;
  men: number;
  women: number;
};

type WorkerStatsResponse = {
  totals: WorkerTotals;
  newWorkersByMonth: { month: string; count: number }[];
  roleDistribution: { role: string; value: number }[];
  genderDistribution: { gender: string; value: number }[];
  adoptionActivity: { name: string; adoptions: number }[];
};

type NamedCount = { key: string; value: number };

type ShelterStatsResponse = {
  overview: {
    animals: number;
    seekingHome: number;
    adoptions: number;
    pendingAdoptions: number;
    cages: number;
    cageOccupancyPercent: number;
    medicalRecords: number;
    medicalCostTotal: number;
    activeNeeds: number;
    users: number;
    newsletterSubscribers: number;
  };
  animals: {
    totals: {
      total: number;
      seekingHome: number;
      found: number;
      inAdoption: number;
      adopted: number;
    };
    byStatus: NamedCount[];
    byType: NamedCount[];
    byHealth: NamedCount[];
    newByMonth: { month: string; count: number }[];
  };
  adoptions: {
    totals: {
      total: number;
      pending: number;
      accepted: number;
      rejected: number;
      canceled: number;
      completed: number;
    };
    byStatus: NamedCount[];
    newByMonth: { month: string; count: number }[];
  };
  cages: {
    totals: {
      total: number;
      occupied: number;
      free: number;
      occupancyPercent: number;
    };
    byZone: { zone: string; total: number; occupied: number }[];
  };
  medical: {
    totals: {
      total: number;
      toDo: number;
      inProgress: number;
      done: number;
      costTotal: number;
    };
    byStatus: NamedCount[];
    byType: NamedCount[];
    costByMonth: { month: string; cost: number }[];
  };
  needs: {
    totals: {
      active: number;
      inactive: number;
      total: number;
    };
    byCategory: NamedCount[];
  };
  users: {
    totals: {
      total: number;
      banned: number;
      formFilled: number;
      newsletterSubscribers: number;
    };
  };
};

const NEED_CATEGORY_LABELS: Record<string, string> = {
  JEDZENIE: "Jedzenie",
  LEKI: "Leki",
  WYPOSAZENIE: "Wyposażenie",
  OPIEKA: "Opieka",
  INNE: "Inne",
};

const PIE_COLORS = [
  "#00a63e",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#64748b",
];

const newWorkersChartConfig = {
  count: { label: "Nowi pracownicy", color: "#00a63e" },
} satisfies ChartConfig;

const adoptionActivityChartConfig = {
  adoptions: { label: "Obsłużone wnioski", color: "#00a63e" },
} satisfies ChartConfig;

const countChartConfig = {
  count: { label: "Liczba", color: "#00a63e" },
} satisfies ChartConfig;

const costChartConfig = {
  cost: { label: "Koszt (zł)", color: "#f59e0b" },
} satisfies ChartConfig;

const ROLE_LABELS: Record<string, string> = {
  pracownicy: "Pracownicy",
  administratorzy: "Administratorzy",
};

const GENDER_LABELS: Record<string, string> = {
  mezczyzni: "Mężczyźni",
  kobiety: "Kobiety",
};

const getWorkerStats = async () => {
  const res = await axios.get<WorkerStatsResponse>("/api/users/workers/stats", {
    withCredentials: true,
  });
  return res.data;
};

const getShelterStats = async () => {
  const res = await axios.get<ShelterStatsResponse>("/api/stats", {
    withCredentials: true,
  });
  return res.data;
};

const shortMonthTick = (value: string) => {
  const [monthName, year] = String(value).split(" ");
  return `${monthName.slice(0, 3)} ${year?.slice(2) ?? ""}`;
};

const formatPln = (value: number) =>
  new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(value);

type KpiCard = {
  key: string;
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  description: string;
};

const KpiGrid = ({ cards }: { cards: KpiCard[] }) => (
  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
    {cards.map((card) => (
      <div
        key={card.key}
        className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500 md:text-sm">
            {card.label}
          </span>
          <card.icon className="size-4 text-green-700 md:size-5" />
        </div>
        <p className="text-2xl font-bold text-green-900 md:text-3xl">
          {card.value}
        </p>
        <p className="text-xs leading-5 text-gray-500">{card.description}</p>
      </div>
    ))}
  </div>
);

const ChartCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) => (
  <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
    <h3 className="text-lg font-semibold text-green-900">{title}</h3>
    {description && (
      <p className="text-sm leading-6 font-medium text-gray-500">
        {description}
      </p>
    )}
    {children}
  </div>
);

const SectionHeader = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="space-y-2">
    <h2 className="text-2xl font-bold text-green-900 md:text-4xl">{title}</h2>
    <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
      {description}
    </p>
  </div>
);

const NamedPieChart = ({
  data,
  labelMap,
}: {
  data: NamedCount[];
  labelMap?: Record<string, string>;
}) => {
  const chartData = data
    .filter((item) => item.value > 0)
    .map((item, index) => ({
      key: item.key,
      value: item.value,
      label: labelMap?.[item.key] ?? item.key,
      fill: PIE_COLORS[index % PIE_COLORS.length],
    }));

  const config = Object.fromEntries(
    chartData.map((item) => [
      item.key,
      { label: item.label, color: item.fill },
    ]),
  ) satisfies ChartConfig;

  if (chartData.length === 0) {
    return (
      <p className="text-sm leading-6 font-medium">
        Brak danych do wyświetlenia.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <ChartContainer
        config={config}
        className="mx-auto aspect-square h-[220px] w-full max-w-[220px]"
      >
        <PieChart>
          <ChartTooltip
            content={<ChartTooltipContent hideLabel nameKey="key" />}
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="key"
            innerRadius={55}
            strokeWidth={2}
          >
            {chartData.map((entry) => (
              <Cell key={entry.key} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {chartData.map((entry) => (
          <li
            key={entry.key}
            className="flex items-center gap-1.5 text-xs md:text-sm"
          >
            <span
              className="size-2.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: entry.fill }}
            />
            <span className="text-foreground">{entry.label}</span>
            <span className="text-muted-foreground">({entry.value})</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const MonthBarChart = ({
  data,
  dataKey,
  config,
}: {
  data: Record<string, string | number>[];
  dataKey: string;
  config: ChartConfig;
}) => (
  <ChartContainer config={config} className="min-h-[260px] w-full">
    <BarChart accessibilityLayer data={data}>
      <CartesianGrid vertical={false} />
      <XAxis
        dataKey="month"
        tickLine={false}
        tickMargin={10}
        axisLine={false}
        tickFormatter={shortMonthTick}
      />
      <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
      <ChartTooltip content={<ChartTooltipContent />} />
      <Bar dataKey={dataKey} fill={`var(--color-${dataKey})`} radius={4} />
    </BarChart>
  </ChartContainer>
);

const AdminStatisticsPage = () => {
  const [shelterQuery, workersQuery] = useQueries({
    queries: [
      {
        queryKey: ["shelter", "stats"],
        queryFn: getShelterStats,
      },
      {
        queryKey: ["workers", "stats"],
        queryFn: getWorkerStats,
      },
    ],
  });

  const shelter = shelterQuery.data;
  const workers = workersQuery.data;
  const isLoading = shelterQuery.isLoading || workersQuery.isLoading;
  const isError = shelterQuery.isError || workersQuery.isError;

  const overviewCards: KpiCard[] = shelter
    ? [
        {
          key: "animals",
          label: "Zwierzęta",
          value: shelter.overview.animals,
          icon: PawPrint,
          description: "łącznie w systemie",
        },
        {
          key: "seekingHome",
          label: "Szuka domu",
          value: shelter.overview.seekingHome,
          icon: Home,
          description: "dostępne do adopcji",
        },
        {
          key: "pendingAdoptions",
          label: "Wnioski",
          value: shelter.overview.pendingAdoptions,
          icon: HeartHandshake,
          description: "oczekujące na decyzję",
        },
        {
          key: "cages",
          label: "Zajętość klatek",
          value: `${shelter.overview.cageOccupancyPercent}%`,
          icon: Bone,
          description: `${shelter.cages.totals.occupied}/${shelter.cages.totals.total} zajętych`,
        },
        {
          key: "medicalCost",
          label: "Koszty medyczne",
          value: formatPln(shelter.overview.medicalCostTotal),
          icon: Stethoscope,
          description: "suma wszystkich rekordów",
        },
        {
          key: "needs",
          label: "Zapotrzebowania",
          value: shelter.overview.activeNeeds,
          icon: ClipboardList,
          description: "aktywne zgłoszenia",
        },
        {
          key: "users",
          label: "Użytkownicy",
          value: shelter.overview.users,
          icon: Users,
          description: "konta klientów",
        },
        {
          key: "newsletter",
          label: "Newsletter",
          value: shelter.overview.newsletterSubscribers,
          icon: Mail,
          description: "aktywni subskrybenci",
        },
      ]
    : [];

  const workerKpiCards: KpiCard[] = workers
    ? [
        {
          key: "total",
          label: "Łącznie",
          value: workers.totals.total,
          icon: Users,
          description: "wszyscy pracownicy schroniska",
        },
        {
          key: "administrators",
          label: "Administratorzy",
          value: workers.totals.administrators,
          icon: Shield,
          description: "konta z pełnymi uprawnieniami",
        },
        {
          key: "employees",
          label: "Pracownicy",
          value: workers.totals.employees,
          icon: UserCog,
          description: "osoby obsługujące schronisko",
        },
        {
          key: "twoFactorEnabled",
          label: "Włączone 2FA",
          value: workers.totals.twoFactorEnabled,
          icon: Lock,
          description: "konta z dodatkowym zabezpieczeniem",
        },
        {
          key: "twoFactorPercent",
          label: "Udział 2FA",
          value: `${workers.totals.twoFactorPercent}%`,
          icon: Percent,
          description: "odsetek zespołu z włączonym 2FA",
        },
      ]
    : [];

  const cageZoneData =
    shelter?.cages.byZone.map((zone) => {
      const free = Math.max(zone.total - zone.occupied, 0);
      const percent =
        zone.total > 0 ? Math.round((zone.occupied / zone.total) * 100) : 0;
      return {
        zone: zone.zone,
        total: zone.total,
        occupied: zone.occupied,
        free,
        percent,
      };
    }) ?? [];

  return (
    <DashboardPage
      title="Statystyki schroniska"
      description="Przegląd kluczowych wskaźników: zwierzęta, adopcje, klatki, medycyna, zapotrzebowania i zespół."
    >
      <section className="space-y-12 md:space-y-16">
        {isLoading && <LoadingStats />}
        {isError && (
          <p className="text-sm font-medium text-red-600">
            Nie udało się pobrać statystyk schroniska.
          </p>
        )}

        {!isLoading && !isError && shelter && (
          <>
            <section className="space-y-8">
              <SectionHeader
                title="Przegląd"
                description="Najważniejsze liczby z całego schroniska w jednym miejscu."
              />
              <KpiGrid cards={overviewCards} />
            </section>

            <section id="animals" className="space-y-8">
              <SectionHeader
                title="Zwierzęta"
                description="Statusy, gatunki, zdrowie oraz napływ nowych podopiecznych."
              />
              <KpiGrid
                cards={[
                  {
                    key: "a-total",
                    label: "Łącznie",
                    value: shelter.animals.totals.total,
                    icon: PawPrint,
                    description: "wszystkie zwierzęta",
                  },
                  {
                    key: "a-home",
                    label: "Szuka domu",
                    value: shelter.animals.totals.seekingHome,
                    icon: Home,
                    description: "gotowe do adopcji",
                  },
                  {
                    key: "a-found",
                    label: "Znalezione",
                    value: shelter.animals.totals.found,
                    icon: Bone,
                    description: "okres kwarantanny / oczekiwania",
                  },
                  {
                    key: "a-adopted",
                    label: "Adoptowane",
                    value: shelter.animals.totals.adopted,
                    icon: HeartHandshake,
                    description: "zakończone pobyty w schronisku",
                  },
                ]}
              />
              <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                <ChartCard title="Nowe zwierzęta (6 miesięcy)">
                  <MonthBarChart
                    data={shelter.animals.newByMonth}
                    dataKey="count"
                    config={countChartConfig}
                  />
                </ChartCard>
                <ChartCard title="Podział według statusu">
                  <NamedPieChart
                    data={shelter.animals.byStatus}
                    labelMap={formatAnimalStatus}
                  />
                </ChartCard>
                <ChartCard title="Podział według gatunku">
                  <NamedPieChart
                    data={shelter.animals.byType}
                    labelMap={formatAnimalType}
                  />
                </ChartCard>
                <ChartCard title="Podział według zdrowia">
                  <NamedPieChart
                    data={shelter.animals.byHealth}
                    labelMap={formatAnimalHealthStatus}
                  />
                </ChartCard>
              </div>
            </section>

            <section id="adoptions" className="space-y-8">
              <SectionHeader
                title="Adopcje"
                description="Wnioski adopcyjne według statusu i trendów miesięcznych."
              />
              <KpiGrid
                cards={[
                  {
                    key: "ad-total",
                    label: "Łącznie",
                    value: shelter.adoptions.totals.total,
                    icon: HeartHandshake,
                    description: "wszystkie wnioski",
                  },
                  {
                    key: "ad-pending",
                    label: "Oczekujące",
                    value: shelter.adoptions.totals.pending,
                    icon: ClipboardList,
                    description: "do rozpatrzenia",
                  },
                  {
                    key: "ad-accepted",
                    label: "Zaakceptowane",
                    value: shelter.adoptions.totals.accepted,
                    icon: Home,
                    description: "pozytywne decyzje",
                  },
                  {
                    key: "ad-completed",
                    label: "Zakończone",
                    value: shelter.adoptions.totals.completed,
                    icon: PawPrint,
                    description: "finalizacja adopcji",
                  },
                ]}
              />
              <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                <ChartCard title="Nowe wnioski (6 miesięcy)">
                  <MonthBarChart
                    data={shelter.adoptions.newByMonth}
                    dataKey="count"
                    config={countChartConfig}
                  />
                </ChartCard>
                <ChartCard title="Podział według statusu">
                  <NamedPieChart
                    data={shelter.adoptions.byStatus}
                    labelMap={formatAdoptionStatus}
                  />
                </ChartCard>
              </div>
            </section>

            <section id="cages" className="space-y-8">
              <SectionHeader
                title="Klatki"
                description="Zajętość miejsc w schronisku oraz rozkład według stref."
              />
              <KpiGrid
                cards={[
                  {
                    key: "c-total",
                    label: "Klatki",
                    value: shelter.cages.totals.total,
                    icon: Bone,
                    description: "łącznie w systemie",
                  },
                  {
                    key: "c-occupied",
                    label: "Zajęte",
                    value: shelter.cages.totals.occupied,
                    icon: PawPrint,
                    description: "z przypisanym zwierzęciem",
                  },
                  {
                    key: "c-free",
                    label: "Wolne",
                    value: shelter.cages.totals.free,
                    icon: Home,
                    description: "dostępne miejsca",
                  },
                  {
                    key: "c-percent",
                    label: "Zajętość",
                    value: `${shelter.cages.totals.occupancyPercent}%`,
                    icon: Percent,
                    description: "procent zajętych klatek",
                  },
                ]}
              />
              <ChartCard
                title="Zajętość według strefy"
                description="Procent zajętych klatek w każdej strefie."
              >
                {cageZoneData.length > 0 ? (
                  <ul className="space-y-4">
                    {cageZoneData.map((zone) => (
                      <li key={zone.zone} className="space-y-2">
                        <div className="flex flex-wrap items-end justify-between gap-2">
                          <div className="space-y-0.5">
                            <p className="text-base font-semibold text-green-900">
                              Strefa {zone.zone}
                            </p>
                            <p className="text-xs leading-5 text-gray-500 md:text-sm md:leading-6">
                              {zone.occupied} zajęte · {zone.free} wolne ·{" "}
                              {zone.total} łącznie
                            </p>
                          </div>
                          <p className="text-lg font-bold text-green-900">
                            {zone.percent}%
                          </p>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full transition-all ${
                              zone.percent >= 90
                                ? "bg-red-600"
                                : zone.percent >= 70
                                  ? "bg-amber-500"
                                  : "bg-green-700"
                            }`}
                            style={{ width: `${zone.percent}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm leading-6 font-medium">
                    Brak klatek w systemie.
                  </p>
                )}
              </ChartCard>
            </section>

            <section id="medical" className="space-y-8">
              <SectionHeader
                title="Opieka medyczna"
                description="Rekordy weterynaryjne, typy zabiegów i koszty w czasie."
              />
              <KpiGrid
                cards={[
                  {
                    key: "m-total",
                    label: "Rekordy",
                    value: shelter.medical.totals.total,
                    icon: Stethoscope,
                    description: "wszystkie wpisy",
                  },
                  {
                    key: "m-todo",
                    label: "Do realizacji",
                    value: shelter.medical.totals.toDo,
                    icon: ClipboardList,
                    description: "oczekujące zabiegi",
                  },
                  {
                    key: "m-done",
                    label: "Zrealizowane",
                    value: shelter.medical.totals.done,
                    icon: HeartHandshake,
                    description: "ukończone wizyty",
                  },
                  {
                    key: "m-cost",
                    label: "Koszt łącznie",
                    value: formatPln(shelter.medical.totals.costTotal),
                    icon: Percent,
                    description: "suma kosztów medycznych",
                  },
                ]}
              />
              <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                <ChartCard title="Koszty medyczne (6 miesięcy)">
                  <MonthBarChart
                    data={shelter.medical.costByMonth}
                    dataKey="cost"
                    config={costChartConfig}
                  />
                </ChartCard>
                <ChartCard title="Podział według statusu">
                  <NamedPieChart
                    data={shelter.medical.byStatus}
                    labelMap={formatMedicalRecordStatus}
                  />
                </ChartCard>
                <ChartCard title="Podział według typu">
                  <NamedPieChart
                    data={shelter.medical.byType}
                    labelMap={formatMedicalRecordType}
                  />
                </ChartCard>
              </div>
            </section>

            <section id="needs" className="space-y-8">
              <SectionHeader
                title="Zapotrzebowania"
                description="Aktywne potrzeby zwierząt według kategorii."
              />
              <KpiGrid
                cards={[
                  {
                    key: "n-active",
                    label: "Aktywne",
                    value: shelter.needs.totals.active,
                    icon: ClipboardList,
                    description: "wymagają uwagi",
                  },
                  {
                    key: "n-inactive",
                    label: "Zamknięte",
                    value: shelter.needs.totals.inactive,
                    icon: HeartHandshake,
                    description: "historyczne zgłoszenia",
                  },
                  {
                    key: "n-total",
                    label: "Łącznie",
                    value: shelter.needs.totals.total,
                    icon: Bone,
                    description: "wszystkie zapotrzebowania",
                  },
                ]}
              />
              <ChartCard title="Aktywne według kategorii">
                <NamedPieChart
                  data={shelter.needs.byCategory}
                  labelMap={NEED_CATEGORY_LABELS}
                />
              </ChartCard>
            </section>

            <section id="users" className="space-y-8">
              <SectionHeader
                title="Użytkownicy i newsletter"
                description="Konta klientów oraz subskrypcje powiadomień."
              />
              <KpiGrid
                cards={[
                  {
                    key: "u-total",
                    label: "Klienci",
                    value: shelter.users.totals.total,
                    icon: Users,
                    description: "konta użytkowników",
                  },
                  {
                    key: "u-form",
                    label: "Uzupełniony profil",
                    value: shelter.users.totals.formFilled,
                    icon: ClipboardList,
                    description: "wypełnione dane adopcyjne",
                  },
                  {
                    key: "u-banned",
                    label: "Zablokowani",
                    value: shelter.users.totals.banned,
                    icon: Shield,
                    description: "konta z banem",
                  },
                  {
                    key: "u-news",
                    label: "Newsletter",
                    value: shelter.users.totals.newsletterSubscribers,
                    icon: Mail,
                    description: "aktywni subskrybenci",
                  },
                ]}
              />
            </section>
          </>
        )}

        {!isLoading && !isError && workers && (
          <section id="workers" className="space-y-8">
            <SectionHeader
              title="Pracownicy"
              description="Podsumowanie zespołu schroniska — role, bezpieczeństwo kont i aktywność przy adopcjach."
            />

            <KpiGrid cards={workerKpiCards} />

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
              <ChartCard title="Nowi pracownicy w ostatnich 6 miesiącach">
                <MonthBarChart
                  data={workers.newWorkersByMonth}
                  dataKey="count"
                  config={newWorkersChartConfig}
                />
              </ChartCard>

              <ChartCard
                title="Aktywność przy adopcjach"
                description="Liczba wszystkich wniosków przetworzonych przez pracownika (zaakceptowane, odrzucone, anulowane i zakończone) — nie tylko zakończone adopcje."
              >
                {workers.adoptionActivity.length > 0 ? (
                  <ChartContainer
                    config={adoptionActivityChartConfig}
                    className="min-h-[260px] w-full"
                  >
                    <BarChart
                      accessibilityLayer
                      data={workers.adoptionActivity}
                      layout="vertical"
                      margin={{ left: 8 }}
                    >
                      <CartesianGrid horizontal={false} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tickLine={false}
                        axisLine={false}
                        width={120}
                        tickFormatter={(value) =>
                          String(value).length > 14
                            ? `${String(value).slice(0, 14)}…`
                            : String(value)
                        }
                      />
                      <XAxis type="number" hide />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="adoptions"
                        fill="var(--color-adoptions)"
                        radius={4}
                      />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm leading-6 font-medium">
                    Brak przetworzonych wniosków adopcyjnych.
                  </p>
                )}
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <ChartCard title="Podział ról">
                <NamedPieChart
                  data={workers.roleDistribution.map((item) => ({
                    key: item.role,
                    value: item.value,
                  }))}
                  labelMap={ROLE_LABELS}
                />
              </ChartCard>

              <ChartCard title="Podział według płci">
                <NamedPieChart
                  data={workers.genderDistribution.map((item) => ({
                    key: item.gender,
                    value: item.value,
                  }))}
                  labelMap={GENDER_LABELS}
                />
              </ChartCard>
            </div>
          </section>
        )}
      </section>
    </DashboardPage>
  );
};

const LoadingStats = () => (
  <div className="space-y-8">
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-28 w-full rounded-2xl" />
      ))}
    </div>
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
      <Skeleton className="min-h-[320px] w-full rounded-2xl" />
      <Skeleton className="min-h-[320px] w-full rounded-2xl" />
    </div>
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <Skeleton className="min-h-[320px] w-full rounded-2xl" />
      <Skeleton className="min-h-[320px] w-full rounded-2xl" />
    </div>
  </div>
);

export default AdminStatisticsPage;

"use client";

import { Container, Skeleton } from "@/components/ui";
import DashboardNavbar from "@/components/layout/admin/DashboardNavbar";
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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui";
import { Lock, Percent, Shield, UserCog, Users } from "lucide-react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

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

const newWorkersChartConfig = {
  count: {
    label: "Nowi pracownicy",
    color: "#00a63e",
  },
} satisfies ChartConfig;

const roleChartConfig = {
  pracownicy: {
    label: "Pracownicy",
    color: "#00a63e",
  },
  administratorzy: {
    label: "Administratorzy",
    color: "#F44336",
  },
} satisfies ChartConfig;

const genderChartConfig = {
  mezczyzni: {
    label: "Mężczyźni",
    color: "#3b82f6",
  },
  kobiety: {
    label: "Kobiety",
    color: "#ec4899",
  },
} satisfies ChartConfig;

const adoptionActivityChartConfig = {
  adoptions: {
    label: "Obsłużone wnioski",
    color: "#00a63e",
  },
} satisfies ChartConfig;

const getWorkerStats = async () => {
  const res = await axios.get<WorkerStatsResponse>("/api/users/workers/stats", {
    withCredentials: true,
  });
  return res.data;
};

const AdminStatisticsPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["workers", "stats"],
    queryFn: getWorkerStats,
  });

  const totals = data?.totals;
  const roleDistribution =
    data?.roleDistribution.map((item) => ({
      ...item,
      fill:
        item.role === "administratorzy"
          ? "var(--color-administratorzy)"
          : "var(--color-pracownicy)",
    })) ?? [];
  const genderDistribution =
    data?.genderDistribution.map((item) => ({
      ...item,
      fill:
        item.gender === "kobiety"
          ? "var(--color-kobiety)"
          : "var(--color-mezczyzni)",
    })) ?? [];

  const kpiCards = totals
    ? [
        {
          key: "total",
          label: "Łącznie",
          value: totals.total,
          icon: Users,
          description: "wszyscy pracownicy schroniska",
        },
        {
          key: "administrators",
          label: "Administratorzy",
          value: totals.administrators,
          icon: Shield,
          description: "konta z pełnymi uprawnieniami",
        },
        {
          key: "employees",
          label: "Pracownicy",
          value: totals.employees,
          icon: UserCog,
          description: "osoby obsługujące schronisko",
        },
        {
          key: "twoFactorEnabled",
          label: "Włączone 2FA",
          value: totals.twoFactorEnabled,
          icon: Lock,
          description: "konta z dodatkowym zabezpieczeniem",
        },
        {
          key: "twoFactorPercent",
          label: "Udział 2FA",
          value: `${totals.twoFactorPercent}%`,
          icon: Percent,
          description: "odsetek zespołu z włączonym 2FA",
        },
      ]
    : [];

  return (
    <main>
      <Container className="mb-6 space-y-12 md:mb-10 md:space-y-16">
        <section id="info" className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-green-900 md:text-5xl">
              Statystyki schroniska
            </h1>
            <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
              W tym panelu znajdują się statystyki schroniska.
            </p>
          </div>
          <DashboardNavbar />
        </section>

        <section className="space-y-8 md:space-y-16">
          <section id="workers" className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-green-900 md:text-4xl">
                Pracownicy
              </h2>
              <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
                Podsumowanie zespołu schroniska — role, bezpieczeństwo kont i
                aktywność przy adopcjach.
              </p>
            </div>

            {isLoading && <LoadingWorkerStats />}
            {isError && (
              <p className="text-sm font-medium text-red-600">
                Nie udało się pobrać statystyk pracowników.
              </p>
            )}

            {!isLoading && !isError && data && (
              <>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                  {kpiCards.map((card) => (
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
                      <p className="text-xs leading-5 text-gray-500">
                        {card.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                  <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                    <h3 className="text-lg font-semibold text-green-900">
                      Nowi pracownicy w ostatnich 6 miesiącach
                    </h3>
                    <ChartContainer
                      config={newWorkersChartConfig}
                      className="min-h-[260px] w-full"
                    >
                      <BarChart
                        accessibilityLayer
                        data={data.newWorkersByMonth}
                      >
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          tickMargin={10}
                          axisLine={false}
                          tickFormatter={(value) => {
                            const [monthName, year] = String(value).split(" ");
                            return `${monthName.slice(0, 3)} ${year?.slice(2) ?? ""}`;
                          }}
                        />
                        <YAxis
                          allowDecimals={false}
                          tickLine={false}
                          axisLine={false}
                          width={32}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar
                          dataKey="count"
                          fill="var(--color-count)"
                          radius={4}
                        />
                      </BarChart>
                    </ChartContainer>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                    <h3 className="text-lg font-semibold text-green-900">
                      Aktywność przy adopcjach
                    </h3>
                    <p className="text-sm leading-6 font-medium text-gray-500">
                      Liczba wszystkich wniosków przetworzonych przez
                      pracownika (zaakceptowane, odrzucone, anulowane i
                      zakończone) — nie tylko zakończone adopcje.
                    </p>
                    {data.adoptionActivity.length > 0 ? (
                      <ChartContainer
                        config={adoptionActivityChartConfig}
                        className="min-h-[260px] w-full"
                      >
                        <BarChart
                          accessibilityLayer
                          data={data.adoptionActivity}
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
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                    <h3 className="text-lg font-semibold text-green-900">
                      Podział ról
                    </h3>
                    <ChartContainer
                      config={roleChartConfig}
                      className="mx-auto min-h-[260px] w-full max-w-sm"
                    >
                      <PieChart>
                        <ChartTooltip
                          content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                          data={roleDistribution}
                          dataKey="value"
                          nameKey="role"
                          innerRadius={60}
                          strokeWidth={2}
                        >
                          {roleDistribution.map((entry) => (
                            <Cell key={entry.role} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartLegend
                          content={<ChartLegendContent nameKey="role" />}
                        />
                      </PieChart>
                    </ChartContainer>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                    <h3 className="text-lg font-semibold text-green-900">
                      Podział według płci
                    </h3>
                    <ChartContainer
                      config={genderChartConfig}
                      className="mx-auto min-h-[260px] w-full max-w-sm"
                    >
                      <PieChart>
                        <ChartTooltip
                          content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                          data={genderDistribution}
                          dataKey="value"
                          nameKey="gender"
                          innerRadius={60}
                          strokeWidth={2}
                        >
                          {genderDistribution.map((entry) => (
                            <Cell key={entry.gender} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartLegend
                          content={<ChartLegendContent nameKey="gender" />}
                        />
                      </PieChart>
                    </ChartContainer>
                  </div>
                </div>
              </>
            )}
          </section>
        </section>
      </Container>
    </main>
  );
};

const LoadingWorkerStats = () => (
  <div className="space-y-8">
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
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

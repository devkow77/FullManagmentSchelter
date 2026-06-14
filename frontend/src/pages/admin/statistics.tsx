"use client";

import { Container, Button } from "@/components/ui";
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
} from "@/components/ui/chart";
import {
  Activity,
  Ban,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardPlus,
  Clock,
  Eye,
  FileText,
  FileWarning,
  HeartHandshake,
  Home,
  Lock,
  Newspaper,
  PawPrint,
  PenLine,
  Shield,
  Stethoscope,
  UserCog,
  UserPlus,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

const workerStats = {
  total: 12,
  administrators: 1,
  workers: 11,
  men: 7,
  women: 5,
  incompleteForms: 3,
  twoFactorEnabled: 9,
};

const workerKpiCards = [
  {
    label: "Łącznie",
    value: workerStats.total,
    icon: Users,
    description: "wszyscy pracownicy schroniska",
  },
  {
    label: "Administratorzy",
    value: workerStats.administrators,
    icon: Shield,
    description: "konta z pełnymi uprawnieniami",
  },
  {
    label: "Pracownicy",
    value: workerStats.workers,
    icon: UserCog,
    description: "osoby obsługujące schronisko",
  },
  {
    label: "Niewypełnione profile",
    value: workerStats.incompleteForms,
    icon: FileWarning,
    description: "brak uzupełnionego formularza",
  },
  {
    label: "Włączone 2FA",
    value: workerStats.twoFactorEnabled,
    icon: Lock,
    description: "konta z dodatkowym zabezpieczeniem",
  },
];

const newWorkersByMonth = [
  { month: "Styczeń", count: 1 },
  { month: "Luty", count: 2 },
  { month: "Marzec", count: 1 },
  { month: "Kwiecień", count: 3 },
  { month: "Maj", count: 2 },
  { month: "Czerwiec", count: 3 },
];

const roleDistribution = [
  {
    role: "pracownicy",
    value: workerStats.workers,
    fill: "var(--color-pracownicy)",
  },
  {
    role: "administratorzy",
    value: workerStats.administrators,
    fill: "var(--color-administratorzy)",
  },
];

const genderDistribution = [
  {
    gender: "mezczyzni",
    value: workerStats.men,
    fill: "var(--color-mezczyzni)",
  },
  { gender: "kobiety", value: workerStats.women, fill: "var(--color-kobiety)" },
];

const adoptionActivity = [
  { name: "Anna Kowalska", adoptions: 24 },
  { name: "Jan Nowak", adoptions: 18 },
  { name: "Maria Wiśniewska", adoptions: 15 },
  { name: "Piotr Zieliński", adoptions: 11 },
  { name: "Katarzyna Lewandowska", adoptions: 8 },
];

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
    color: "#0d542b",
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
    label: "Obsłużone adopcje",
    color: "#00a63e",
  },
} satisfies ChartConfig;

const userStats = {
  total: 35,
  newThisWeek: 5,
  newThisMonth: 12,
  newLast6Months: 17,
  newThisYear: 17,
  formFilled: 28,
  formIncomplete: 7,
  banned: 2,
  hasOtherAnimals: 19,
  men: 18,
  women: 17,
};

const userKpiCards = [
  {
    label: "Łącznie",
    value: userStats.total,
    icon: Users,
    description: "zarejestrowanych użytkowników",
  },
  {
    label: "Nowi w tym tygodniu",
    value: userStats.newThisWeek,
    icon: CalendarDays,
    description: "rejestracje w ostatnich 7 dniach",
  },
  {
    label: "Nowi w tym miesiącu",
    value: userStats.newThisMonth,
    icon: UserPlus,
    description: "rejestracje w bieżącym miesiącu",
  },
  {
    label: "Wypełniony formularz",
    value: userStats.formFilled,
    icon: ClipboardCheck,
    description: "mogą składać wnioski adopcyjne",
  },
  {
    label: "Zbanowani",
    value: userStats.banned,
    icon: Ban,
    description: "konta z ograniczonym dostępem",
  },
];

const newUsersByMonth = [
  { month: "Styczeń", count: 2 },
  { month: "Luty", count: 1 },
  { month: "Marzec", count: 3 },
  { month: "Kwiecień", count: 4 },
  { month: "Maj", count: 4 },
  { month: "Czerwiec", count: 3 },
];

const userGenderDistribution = [
  {
    gender: "mezczyzni",
    value: userStats.men,
    fill: "var(--color-mezczyzni)",
  },
  { gender: "kobiety", value: userStats.women, fill: "var(--color-kobiety)" },
];

const formStatusDistribution = [
  {
    status: "wypelniony",
    value: userStats.formFilled,
    fill: "var(--color-wypelniony)",
  },
  {
    status: "niewypelniony",
    value: userStats.formIncomplete,
    fill: "var(--color-niewypelniony)",
  },
];

const topUserCities = [
  { city: "Warszawa", users: 9 },
  { city: "Kraków", users: 7 },
  { city: "Gdańsk", users: 5 },
  { city: "Wrocław", users: 4 },
  { city: "Poznań", users: 3 },
];

const newUsersChartConfig = {
  count: {
    label: "Nowi użytkownicy",
    color: "#00a63e",
  },
} satisfies ChartConfig;

const formStatusChartConfig = {
  wypelniony: {
    label: "Wypełniony",
    color: "#00a63e",
  },
  niewypelniony: {
    label: "Niewypełniony",
    color: "#f97316",
  },
} satisfies ChartConfig;

const topCitiesChartConfig = {
  users: {
    label: "Użytkownicy",
    color: "#00a63e",
  },
} satisfies ChartConfig;

const animalStats = {
  total: 105,
  seekingHome: 42,
  adopted: 23,
  inAdoption: 12,
  found: 28,
  needsCare: 27,
  dogs: 50,
  cats: 30,
  foundThisMonth: 8,
  upcomingVisits: 6,
};

const animalKpiCards = [
  {
    label: "Łącznie",
    value: animalStats.total,
    icon: PawPrint,
    description: "wszystkie zwierzęta w schronisku",
  },
  {
    label: "Szuka domu",
    value: animalStats.seekingHome,
    icon: Home,
    description: "gotowe do adopcji",
  },
  {
    label: "Adoptowane",
    value: animalStats.adopted,
    icon: HeartHandshake,
    description: "znalazły nowy dom",
  },
  {
    label: "W trakcie adopcji",
    value: animalStats.inAdoption,
    icon: CalendarDays,
    description: "oczekują na finalizację",
  },
  {
    label: "Wymagające leczenia",
    value: animalStats.needsCare,
    icon: Stethoscope,
    description: "chore, zarażone lub po operacji",
  },
];

const animalsByType = [
  { type: "psy", count: 50, fill: "var(--color-psy)" },
  { type: "koty", count: 30, fill: "var(--color-koty)" },
  { type: "kroliki", count: 10, fill: "var(--color-kroliki)" },
  { type: "chomiki", count: 5, fill: "var(--color-chomiki)" },
  { type: "zolwie", count: 5, fill: "var(--color-zolwie)" },
  { type: "inne", count: 5, fill: "var(--color-inne)" },
];

const animalsByStatus = [
  {
    status: "szukaDomu",
    value: animalStats.seekingHome,
    fill: "var(--color-szukaDomu)",
  },
  {
    status: "znaleziony",
    value: animalStats.found,
    fill: "var(--color-znaleziony)",
  },
  {
    status: "wTrakcieAdopcji",
    value: animalStats.inAdoption,
    fill: "var(--color-wTrakcieAdopcji)",
  },
  {
    status: "adoptowany",
    value: animalStats.adopted,
    fill: "var(--color-adoptowany)",
  },
];

const animalsByHealth = [
  { health: "zdrowy", value: 78, fill: "var(--color-zdrowy)" },
  { health: "chory", value: 12, fill: "var(--color-chory)" },
  { health: "zarazony", value: 8, fill: "var(--color-zarazony)" },
  {
    health: "potrzebujeOperacji",
    value: 7,
    fill: "var(--color-potrzebujeOperacji)",
  },
];

const animalsFoundByMonth = [
  { month: "Styczeń", count: 12 },
  { month: "Luty", count: 9 },
  { month: "Marzec", count: 15 },
  { month: "Kwiecień", count: 11 },
  { month: "Maj", count: 14 },
  { month: "Czerwiec", count: 8 },
];

const animalTypeChartConfig = {
  psy: { label: "Psy", color: "#00a63e" },
  koty: { label: "Koty", color: "#0d542b" },
  kroliki: { label: "Króliki", color: "#84cc16" },
  chomiki: { label: "Chomiki", color: "#eab308" },
  zolwie: { label: "Żółwie", color: "#14b8a6" },
  inne: { label: "Inne", color: "#64748b" },
} satisfies ChartConfig;

const animalStatusChartConfig = {
  szukaDomu: { label: "Szuka domu", color: "#00a63e" },
  znaleziony: { label: "Znaleziony", color: "#3b82f6" },
  wTrakcieAdopcji: { label: "W trakcie adopcji", color: "#eab308" },
  adoptowany: { label: "Adoptowany", color: "#0d542b" },
} satisfies ChartConfig;

const animalHealthChartConfig = {
  zdrowy: { label: "Zdrowy", color: "#00a63e" },
  chory: { label: "Chory", color: "#f97316" },
  zarazony: { label: "Zarażony", color: "#ef4444" },
  potrzebujeOperacji: { label: "Potrzebuje operacji", color: "#a855f7" },
} satisfies ChartConfig;

const animalsFoundChartConfig = {
  count: {
    label: "Nowe zwierzęta",
    color: "#00a63e",
  },
} satisfies ChartConfig;

const animalsByTypeChartConfig = {
  count: {
    label: "Liczba zwierząt",
    color: "#00a63e",
  },
} satisfies ChartConfig;

const adoptionStats = {
  total: 100,
  pending: 18,
  accepted: 14,
  completed: 52,
  rejected: 12,
  cancelled: 4,
  thisWeek: 5,
  thisMonth: 12,
  last6Months: 17,
  thisYear: 17,
  successRate: 52,
  avgProcessingDays: 9,
};

const adoptionKpiCards = [
  {
    label: "Łącznie",
    value: adoptionStats.total,
    icon: FileText,
    description: "wszystkie wnioski adopcyjne",
  },
  {
    label: "Oczekujące",
    value: adoptionStats.pending,
    icon: Clock,
    description: "do rozpatrzenia przez pracownika",
  },
  {
    label: "Zaakceptowane",
    value: adoptionStats.accepted,
    icon: CheckCircle2,
    description: "oczekują na odbiór zwierzęcia",
  },
  {
    label: "Zakończone",
    value: adoptionStats.completed,
    icon: HeartHandshake,
    description: "zwierzę odebrane przez adoptującego",
  },
  {
    label: "Odrzucone",
    value: adoptionStats.rejected,
    icon: XCircle,
    description: "wnioski odrzucone przez schronisko",
  },
];

const adoptionsByStatus = [
  {
    status: "oczekujaca",
    value: adoptionStats.pending,
    fill: "var(--color-oczekujaca)",
  },
  {
    status: "zaakceptowana",
    value: adoptionStats.accepted,
    fill: "var(--color-zaakceptowana)",
  },
  {
    status: "zakonczona",
    value: adoptionStats.completed,
    fill: "var(--color-zakonczona)",
  },
  {
    status: "odrzucona",
    value: adoptionStats.rejected,
    fill: "var(--color-odrzucona)",
  },
  {
    status: "anulowana",
    value: adoptionStats.cancelled,
    fill: "var(--color-anulowana)",
  },
];

const adoptionsByMonth = [
  { month: "Styczeń", count: 2 },
  { month: "Luty", count: 1 },
  { month: "Marzec", count: 3 },
  { month: "Kwiecień", count: 4 },
  { month: "Maj", count: 4 },
  { month: "Czerwiec", count: 3 },
];

const completedAdoptionsByAnimalType = [
  { type: "psy", count: 28, fill: "var(--color-psy)" },
  { type: "koty", count: 18, fill: "var(--color-koty)" },
  { type: "kroliki", count: 4, fill: "var(--color-kroliki)" },
  { type: "inne", count: 2, fill: "var(--color-inne)" },
];

const adoptionStatusChartConfig = {
  oczekujaca: { label: "Oczekująca", color: "#eab308" },
  zaakceptowana: { label: "Zaakceptowana", color: "#3b82f6" },
  zakonczona: { label: "Zakończona", color: "#00a63e" },
  odrzucona: { label: "Odrzucona", color: "#ef4444" },
  anulowana: { label: "Anulowana", color: "#64748b" },
} satisfies ChartConfig;

const adoptionsByMonthChartConfig = {
  count: {
    label: "Nowe wnioski",
    color: "#00a63e",
  },
} satisfies ChartConfig;

const adoptionsByAnimalTypeChartConfig = {
  psy: { label: "Psy", color: "#00a63e" },
  koty: { label: "Koty", color: "#0d542b" },
  kroliki: { label: "Króliki", color: "#84cc16" },
  inne: { label: "Inne", color: "#64748b" },
  count: { label: "Zakończone adopcje", color: "#00a63e" },
} satisfies ChartConfig;

const medicalRecordStats = {
  total: 100,
  pending: 22,
  inProgress: 15,
  completed: 63,
  totalCost: 24_850,
  avgCost: 249,
  thisWeek: 5,
  thisMonth: 12,
  last6Months: 17,
  thisYear: 17,
};

const medicalRecordKpiCards = [
  {
    label: "Łącznie",
    value: medicalRecordStats.total,
    icon: ClipboardPlus,
    description: "wszystkie raporty medyczne",
  },
  {
    label: "Do realizacji",
    value: medicalRecordStats.pending,
    icon: Clock,
    description: "zaplanowane zabiegi i wizyty",
  },
  {
    label: "W trakcie",
    value: medicalRecordStats.inProgress,
    icon: Activity,
    description: "aktualnie realizowane",
  },
  {
    label: "Zrealizowane",
    value: medicalRecordStats.completed,
    icon: CheckCircle2,
    description: "zakończone procedury",
  },
  {
    label: "Łączny koszt",
    value: `${medicalRecordStats.totalCost.toLocaleString("pl-PL")} zł`,
    icon: Wallet,
    description: "suma wydatków na leczenie",
  },
];

const medicalRecordsByMonth = [
  { month: "Styczeń", count: 3, cost: 3200 },
  { month: "Luty", count: 2, cost: 2800 },
  { month: "Marzec", count: 4, cost: 4100 },
  { month: "Kwiecień", count: 3, cost: 3900 },
  { month: "Maj", count: 3, cost: 4500 },
  { month: "Czerwiec", count: 2, cost: 6350 },
];

const medicalRecordsByType = [
  { type: "wizyta", value: 35, fill: "var(--color-wizyta)" },
  { type: "badanie", value: 20, fill: "var(--color-badanie)" },
  { type: "operacja", value: 12, fill: "var(--color-operacja)" },
  { type: "szczepienie", value: 18, fill: "var(--color-szczepienie)" },
  { type: "uraz", value: 8, fill: "var(--color-uraz)" },
  { type: "inne", value: 7, fill: "var(--color-inne)" },
];

const medicalRecordsByStatus = [
  {
    status: "doRealizacji",
    value: medicalRecordStats.pending,
    fill: "var(--color-doRealizacji)",
  },
  {
    status: "wTrakcie",
    value: medicalRecordStats.inProgress,
    fill: "var(--color-wTrakcie)",
  },
  {
    status: "zrealizowana",
    value: medicalRecordStats.completed,
    fill: "var(--color-zrealizowana)",
  },
];

const topVetClinics = [
  { clinic: "VetCare Centrum", records: 28 },
  { clinic: "Klinika Przyjaźń", records: 22 },
  { clinic: "AnimalMed", records: 18 },
  { clinic: "Zdrowy Łapek", records: 15 },
  { clinic: "SpecVet", records: 10 },
];

const medicalRecordsByMonthChartConfig = {
  count: { label: "Raporty", color: "#00a63e" },
  cost: { label: "Koszt (zł)", color: "#0d542b" },
} satisfies ChartConfig;

const medicalRecordTypeChartConfig = {
  wizyta: { label: "Wizyta", color: "#00a63e" },
  badanie: { label: "Badanie", color: "#3b82f6" },
  operacja: { label: "Operacja", color: "#ef4444" },
  szczepienie: { label: "Szczepienie", color: "#84cc16" },
  uraz: { label: "Uraz", color: "#f97316" },
  inne: { label: "Inne", color: "#64748b" },
} satisfies ChartConfig;

const medicalRecordStatusChartConfig = {
  doRealizacji: { label: "Do realizacji", color: "#eab308" },
  wTrakcie: { label: "W trakcie", color: "#3b82f6" },
  zrealizowana: { label: "Zrealizowana", color: "#00a63e" },
} satisfies ChartConfig;

const topClinicsChartConfig = {
  records: { label: "Raporty", color: "#00a63e" },
} satisfies ChartConfig;

const blogStats = {
  total: 24,
  published: 22,
  drafts: 2,
  thisWeek: 1,
  thisMonth: 3,
  last6Months: 8,
  thisYear: 8,
  totalViews: 12_480,
  avgViews: 567,
};

const blogKpiCards = [
  {
    label: "Łącznie",
    value: blogStats.total,
    icon: Newspaper,
    description: "wszystkie artykuły na blogu",
  },
  {
    label: "Opublikowane",
    value: blogStats.published,
    icon: BookOpen,
    description: "widoczne dla użytkowników",
  },
  {
    label: "Szkice",
    value: blogStats.drafts,
    icon: PenLine,
    description: "oczekują na publikację",
  },
  {
    label: "Wyświetlenia",
    value: blogStats.totalViews.toLocaleString("pl-PL"),
    icon: Eye,
    description: "łącznie na wszystkich artykułach",
  },
  {
    label: "Śr. wyświetleń",
    value: blogStats.avgViews,
    icon: Activity,
    description: "na jeden opublikowany artykuł",
  },
];

const blogPostsByMonth = [
  { month: "Styczeń", count: 1 },
  { month: "Luty", count: 0 },
  { month: "Marzec", count: 2 },
  { month: "Kwiecień", count: 1 },
  { month: "Maj", count: 2 },
  { month: "Czerwiec", count: 2 },
];

const blogPostsByCategory = [
  { category: "adopcje", value: 8, fill: "var(--color-adopcje)" },
  { category: "porady", value: 7, fill: "var(--color-porady)" },
  { category: "aktualnosci", value: 5, fill: "var(--color-aktualnosci)" },
  { category: "historie", value: 4, fill: "var(--color-historie)" },
];

const topBlogPosts = [
  { title: "Jak przygotować dom na adopcję", views: 1840 },
  { title: "Pierwsze dni z psem ze schroniska", views: 1520 },
  { title: "Kot po adopcji — co warto wiedzieć", views: 1280 },
  { title: "Historie adopcyjne: Luna", views: 980 },
  { title: "Jak wspierać schronisko", views: 870 },
];

const blogPostsByMonthChartConfig = {
  count: { label: "Nowe artykuły", color: "#00a63e" },
} satisfies ChartConfig;

const blogCategoryChartConfig = {
  adopcje: { label: "Adopcje", color: "#00a63e" },
  porady: { label: "Porady", color: "#3b82f6" },
  aktualnosci: { label: "Aktualności", color: "#eab308" },
  historie: { label: "Historie adopcyjne", color: "#ec4899" },
} satisfies ChartConfig;

const topBlogPostsChartConfig = {
  views: { label: "Wyświetlenia", color: "#00a63e" },
} satisfies ChartConfig;

const AdminStatisticsPage = () => {
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
              <p className="text-sm leading-6 md:text-base md:leading-7">
                Podsumowanie zespołu schroniska — role, bezpieczeństwo kont i
                aktywność przy adopcjach.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              {workerKpiCards.map((card) => (
                <div
                  key={card.label}
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
                  <BarChart accessibilityLayer data={newWorkersByMonth}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </div>

              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h3 className="text-lg font-semibold text-green-900">
                  Aktywność przy adopcjach
                </h3>
                <p className="text-sm text-gray-500">
                  Liczba zakończonych adopcji obsłużonych przez pracownika.
                </p>
                <ChartContainer
                  config={adoptionActivityChartConfig}
                  className="min-h-[260px] w-full"
                >
                  <BarChart
                    accessibilityLayer
                    data={adoptionActivity}
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
                        value.length > 14 ? `${value.slice(0, 14)}…` : value
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
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
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
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
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
          </section>

          <section id="users" className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-green-900 md:text-4xl">
                Użytkownicy
              </h2>
              <p className="text-sm leading-6 md:text-base md:leading-7">
                Rejestracje, kompletność profili adopcyjnych i rozkład
                geograficzny osób zainteresowanych adopcją.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              {userKpiCards.map((card) => (
                <div
                  key={card.label}
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

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">Ostatnie 6 miesięcy</p>
                <p className="text-xl font-bold text-green-900">
                  {userStats.newLast6Months}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">W tym roku</p>
                <p className="text-xl font-bold text-green-900">
                  {userStats.newThisYear}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">
                  Posiadają inne zwierzęta
                </p>
                <p className="text-xl font-bold text-green-900">
                  {userStats.hasOtherAnimals}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">Niewypełnione profile</p>
                <p className="text-xl font-bold text-green-900">
                  {userStats.formIncomplete}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h3 className="text-lg font-semibold text-green-900">
                  Nowi użytkownicy w ostatnich 6 miesiącach
                </h3>
                <ChartContainer
                  config={newUsersChartConfig}
                  className="min-h-[260px] w-full"
                >
                  <BarChart accessibilityLayer data={newUsersByMonth}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </div>

              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h3 className="text-lg font-semibold text-green-900">
                  Top 5 miast
                </h3>
                <p className="text-sm text-gray-500">
                  Miasta z największą liczbą zarejestrowanych użytkowników.
                </p>
                <ChartContainer
                  config={topCitiesChartConfig}
                  className="min-h-[260px] w-full"
                >
                  <BarChart
                    accessibilityLayer
                    data={topUserCities}
                    layout="vertical"
                    margin={{ left: 8 }}
                  >
                    <CartesianGrid horizontal={false} />
                    <YAxis
                      dataKey="city"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      width={80}
                    />
                    <XAxis type="number" hide />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="users" fill="var(--color-users)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h3 className="text-lg font-semibold text-green-900">
                  Status formularza adopcyjnego
                </h3>
                <ChartContainer
                  config={formStatusChartConfig}
                  className="mx-auto min-h-[260px] w-full max-w-sm"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={formStatusDistribution}
                      dataKey="value"
                      nameKey="status"
                      innerRadius={60}
                      strokeWidth={2}
                    >
                      {formStatusDistribution.map((entry) => (
                        <Cell key={entry.status} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend
                      content={<ChartLegendContent nameKey="status" />}
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
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={userGenderDistribution}
                      dataKey="value"
                      nameKey="gender"
                      innerRadius={60}
                      strokeWidth={2}
                    >
                      {userGenderDistribution.map((entry) => (
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
          </section>

          <section id="animals" className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-green-900 md:text-4xl">
                Zwierzęta
              </h2>
              <p className="text-sm leading-6 md:text-base md:leading-7">
                Stan populacji schroniska — gatunki, statusy adopcyjne i
                kondycja zdrowotna podopiecznych.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              {animalKpiCards.map((card) => (
                <div
                  key={card.label}
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

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">Psy</p>
                <p className="text-xl font-bold text-green-900">
                  {animalStats.dogs}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">Koty</p>
                <p className="text-xl font-bold text-green-900">
                  {animalStats.cats}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">
                  Znalezione w tym miesiącu
                </p>
                <p className="text-xl font-bold text-green-900">
                  {animalStats.foundThisMonth}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">Nadchodzące wizyty</p>
                <p className="text-xl font-bold text-green-900">
                  {animalStats.upcomingVisits}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h3 className="text-lg font-semibold text-green-900">
                  Nowe zwierzęta w ostatnich 6 miesiącach
                </h3>
                <p className="text-sm text-gray-500">
                  Liczba zwierząt trafiących do schroniska wg daty znalezienia.
                </p>
                <ChartContainer
                  config={animalsFoundChartConfig}
                  className="min-h-[260px] w-full"
                >
                  <BarChart accessibilityLayer data={animalsFoundByMonth}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </div>

              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h3 className="text-lg font-semibold text-green-900">
                  Podział według gatunku
                </h3>
                <ChartContainer
                  config={animalsByTypeChartConfig}
                  className="min-h-[260px] w-full"
                >
                  <BarChart
                    accessibilityLayer
                    data={animalsByType}
                    layout="vertical"
                    margin={{ left: 8 }}
                  >
                    <CartesianGrid horizontal={false} />
                    <YAxis
                      dataKey="type"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      width={72}
                      tickFormatter={(value) =>
                        animalTypeChartConfig[
                          value as keyof typeof animalTypeChartConfig
                        ]?.label ?? value
                      }
                    />
                    <XAxis type="number" hide />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          nameKey="type"
                          labelFormatter={(value) =>
                            animalTypeChartConfig[
                              value as keyof typeof animalTypeChartConfig
                            ]?.label ?? value
                          }
                        />
                      }
                    />
                    <Bar dataKey="count" radius={4}>
                      {animalsByType.map((entry) => (
                        <Cell key={entry.type} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h3 className="text-lg font-semibold text-green-900">
                  Status adopcyjny
                </h3>
                <ChartContainer
                  config={animalStatusChartConfig}
                  className="mx-auto min-h-[260px] w-full max-w-sm"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={animalsByStatus}
                      dataKey="value"
                      nameKey="status"
                      innerRadius={60}
                      strokeWidth={2}
                    >
                      {animalsByStatus.map((entry) => (
                        <Cell key={entry.status} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend
                      content={<ChartLegendContent nameKey="status" />}
                    />
                  </PieChart>
                </ChartContainer>
              </div>

              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h3 className="text-lg font-semibold text-green-900">
                  Stan zdrowia
                </h3>
                <ChartContainer
                  config={animalHealthChartConfig}
                  className="mx-auto min-h-[260px] w-full max-w-sm"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={animalsByHealth}
                      dataKey="value"
                      nameKey="health"
                      innerRadius={60}
                      strokeWidth={2}
                    >
                      {animalsByHealth.map((entry) => (
                        <Cell key={entry.health} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend
                      content={<ChartLegendContent nameKey="health" />}
                    />
                  </PieChart>
                </ChartContainer>
              </div>
            </div>
          </section>

          <section id="adoptions" className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-green-900 md:text-4xl">
                Adopcje
              </h2>
              <p className="text-sm leading-6 md:text-base md:leading-7">
                Przegląd wniosków adopcyjnych — statusy, tempo składania i
                skuteczność procesu adopcji.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              {adoptionKpiCards.map((card) => (
                <div
                  key={card.label}
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

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">W tym tygodniu</p>
                <p className="text-xl font-bold text-green-900">
                  {adoptionStats.thisWeek}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">W tym miesiącu</p>
                <p className="text-xl font-bold text-green-900">
                  {adoptionStats.thisMonth}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">Wskaźnik sukcesu</p>
                <p className="text-xl font-bold text-green-900">
                  {adoptionStats.successRate}%
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">Śr. czas obsługi</p>
                <p className="text-xl font-bold text-green-900">
                  {adoptionStats.avgProcessingDays} dni
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h3 className="text-lg font-semibold text-green-900">
                  Nowe wnioski w ostatnich 6 miesiącach
                </h3>
                <ChartContainer
                  config={adoptionsByMonthChartConfig}
                  className="min-h-[260px] w-full"
                >
                  <BarChart accessibilityLayer data={adoptionsByMonth}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </div>

              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h3 className="text-lg font-semibold text-green-900">
                  Zakończone adopcje wg gatunku
                </h3>
                <p className="text-sm text-gray-500">
                  Liczba zwierząt, które trafiły do nowych domów.
                </p>
                <ChartContainer
                  config={adoptionsByAnimalTypeChartConfig}
                  className="min-h-[260px] w-full"
                >
                  <BarChart
                    accessibilityLayer
                    data={completedAdoptionsByAnimalType}
                    layout="vertical"
                    margin={{ left: 8 }}
                  >
                    <CartesianGrid horizontal={false} />
                    <YAxis
                      dataKey="type"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      width={72}
                      tickFormatter={(value) =>
                        adoptionsByAnimalTypeChartConfig[
                          value as keyof typeof adoptionsByAnimalTypeChartConfig
                        ]?.label ?? value
                      }
                    />
                    <XAxis type="number" hide />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          nameKey="type"
                          labelFormatter={(value) =>
                            adoptionsByAnimalTypeChartConfig[
                              value as keyof typeof adoptionsByAnimalTypeChartConfig
                            ]?.label ?? value
                          }
                        />
                      }
                    />
                    <Bar dataKey="count" radius={4}>
                      {completedAdoptionsByAnimalType.map((entry) => (
                        <Cell key={entry.type} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h3 className="text-lg font-semibold text-green-900">
                  Status wniosków
                </h3>
                <ChartContainer
                  config={adoptionStatusChartConfig}
                  className="mx-auto min-h-[280px] w-full max-w-sm"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={adoptionsByStatus}
                      dataKey="value"
                      nameKey="status"
                      innerRadius={60}
                      strokeWidth={2}
                    >
                      {adoptionsByStatus.map((entry) => (
                        <Cell key={entry.status} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend
                      content={<ChartLegendContent nameKey="status" />}
                    />
                  </PieChart>
                </ChartContainer>
              </div>

              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h3 className="text-lg font-semibold text-green-900">
                  Podsumowanie okresów
                </h3>
                <ul className="space-y-4 pt-2 text-sm md:text-base">
                  <li className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                    <span className="text-gray-600">Ostatnie 6 miesięcy</span>
                    <span className="font-bold text-green-900">
                      {adoptionStats.last6Months} wniosków
                    </span>
                  </li>
                  <li className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                    <span className="text-gray-600">W tym roku</span>
                    <span className="font-bold text-green-900">
                      {adoptionStats.thisYear} wniosków
                    </span>
                  </li>
                  <li className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                    <span className="text-gray-600">Anulowane</span>
                    <span className="font-bold text-green-900">
                      {adoptionStats.cancelled}
                    </span>
                  </li>
                  <li className="flex items-center justify-between rounded-xl bg-green-50 px-4 py-3">
                    <span className="text-gray-600">
                      Wnioski zakończone sukcesem
                    </span>
                    <span className="font-bold text-green-900">
                      {adoptionStats.completed} / {adoptionStats.total}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section id="medical-records" className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-green-900 md:text-4xl">
                Raporty medyczne
              </h2>
              <p className="text-sm leading-6 md:text-base md:leading-7">
                Koszty leczenia, typy procedur i obciążenie klinik
                weterynaryjnych współpracujących ze schroniskiem.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              {medicalRecordKpiCards.map((card) => (
                <div
                  key={card.label}
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

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">W tym tygodniu</p>
                <p className="text-xl font-bold text-green-900">
                  {medicalRecordStats.thisWeek}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">W tym miesiącu</p>
                <p className="text-xl font-bold text-green-900">
                  {medicalRecordStats.thisMonth}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">Średni koszt raportu</p>
                <p className="text-xl font-bold text-green-900">
                  {medicalRecordStats.avgCost} zł
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">Ostatnie 6 miesięcy</p>
                <p className="text-xl font-bold text-green-900">
                  {medicalRecordStats.last6Months}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h3 className="text-lg font-semibold text-green-900">
                  Raporty w ostatnich 6 miesiącach
                </h3>
                <ChartContainer
                  config={medicalRecordsByMonthChartConfig}
                  className="min-h-[260px] w-full"
                >
                  <BarChart accessibilityLayer data={medicalRecordsByMonth}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </div>

              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h3 className="text-lg font-semibold text-green-900">
                  Top 5 klinik weterynaryjnych
                </h3>
                <p className="text-sm text-gray-500">
                  Liczba raportów medycznych przypisanych do kliniki.
                </p>
                <ChartContainer
                  config={topClinicsChartConfig}
                  className="min-h-[260px] w-full"
                >
                  <BarChart
                    accessibilityLayer
                    data={topVetClinics}
                    layout="vertical"
                    margin={{ left: 8 }}
                  >
                    <CartesianGrid horizontal={false} />
                    <YAxis
                      dataKey="clinic"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      width={120}
                      tickFormatter={(value) =>
                        value.length > 16 ? `${value.slice(0, 16)}…` : value
                      }
                    />
                    <XAxis type="number" hide />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="records"
                      fill="var(--color-records)"
                      radius={4}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h3 className="text-lg font-semibold text-green-900">
                  Typ procedury
                </h3>
                <ChartContainer
                  config={medicalRecordTypeChartConfig}
                  className="mx-auto min-h-[280px] w-full max-w-sm"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={medicalRecordsByType}
                      dataKey="value"
                      nameKey="type"
                      innerRadius={60}
                      strokeWidth={2}
                    >
                      {medicalRecordsByType.map((entry) => (
                        <Cell key={entry.type} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend
                      content={<ChartLegendContent nameKey="type" />}
                    />
                  </PieChart>
                </ChartContainer>
              </div>

              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h3 className="text-lg font-semibold text-green-900">
                  Status realizacji
                </h3>
                <ChartContainer
                  config={medicalRecordStatusChartConfig}
                  className="mx-auto min-h-[280px] w-full max-w-sm"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={medicalRecordsByStatus}
                      dataKey="value"
                      nameKey="status"
                      innerRadius={60}
                      strokeWidth={2}
                    >
                      {medicalRecordsByStatus.map((entry) => (
                        <Cell key={entry.status} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend
                      content={<ChartLegendContent nameKey="status" />}
                    />
                  </PieChart>
                </ChartContainer>
              </div>
            </div>
          </section>

          <section id="blogs" className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-green-900 md:text-4xl">
                Blogi
              </h2>
              <p className="text-sm leading-6 md:text-base md:leading-7">
                Aktywność redakcyjna schroniska — publikacje, kategorie i zasięg
                artykułów na blogu.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              {blogKpiCards.map((card) => (
                <div
                  key={card.label}
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

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">W tym tygodniu</p>
                <p className="text-xl font-bold text-green-900">
                  {blogStats.thisWeek}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">W tym miesiącu</p>
                <p className="text-xl font-bold text-green-900">
                  {blogStats.thisMonth}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">Ostatnie 6 miesięcy</p>
                <p className="text-xl font-bold text-green-900">
                  {blogStats.last6Months}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">W tym roku</p>
                <p className="text-xl font-bold text-green-900">
                  {blogStats.thisYear}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h3 className="text-lg font-semibold text-green-900">
                  Nowe artykuły w ostatnich 6 miesiącach
                </h3>
                <ChartContainer
                  config={blogPostsByMonthChartConfig}
                  className="min-h-[260px] w-full"
                >
                  <BarChart accessibilityLayer data={blogPostsByMonth}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </div>

              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h3 className="text-lg font-semibold text-green-900">
                  Najpopularniejsze artykuły
                </h3>
                <p className="text-sm text-gray-500">
                  Artykuły z największą liczbą wyświetleń.
                </p>
                <ChartContainer
                  config={topBlogPostsChartConfig}
                  className="min-h-[260px] w-full"
                >
                  <BarChart
                    accessibilityLayer
                    data={topBlogPosts}
                    layout="vertical"
                    margin={{ left: 8 }}
                  >
                    <CartesianGrid horizontal={false} />
                    <YAxis
                      dataKey="title"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      width={140}
                      tickFormatter={(value) =>
                        value.length > 22 ? `${value.slice(0, 22)}…` : value
                      }
                    />
                    <XAxis type="number" hide />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="views" fill="var(--color-views)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h3 className="text-lg font-semibold text-green-900">
                  Artykuły wg kategorii
                </h3>
                <ChartContainer
                  config={blogCategoryChartConfig}
                  className="mx-auto min-h-[280px] w-full max-w-sm"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={blogPostsByCategory}
                      dataKey="value"
                      nameKey="category"
                      innerRadius={60}
                      strokeWidth={2}
                    >
                      {blogPostsByCategory.map((entry) => (
                        <Cell key={entry.category} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend
                      content={<ChartLegendContent nameKey="category" />}
                    />
                  </PieChart>
                </ChartContainer>
              </div>

              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h3 className="text-lg font-semibold text-green-900">
                  Podsumowanie publikacji
                </h3>
                <ul className="space-y-4 pt-2 text-sm md:text-base">
                  <li className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                    <span className="text-gray-600">Opublikowane artykuły</span>
                    <span className="font-bold text-green-900">
                      {blogStats.published}
                    </span>
                  </li>
                  <li className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                    <span className="text-gray-600">Szkice do publikacji</span>
                    <span className="font-bold text-green-900">
                      {blogStats.drafts}
                    </span>
                  </li>
                  <li className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                    <span className="text-gray-600">Łączne wyświetlenia</span>
                    <span className="font-bold text-green-900">
                      {blogStats.totalViews.toLocaleString("pl-PL")}
                    </span>
                  </li>
                  <li className="flex items-center justify-between rounded-xl bg-green-50 px-4 py-3">
                    <span className="text-gray-600">Wskaźnik publikacji</span>
                    <span className="font-bold text-green-900">
                      {Math.round(
                        (blogStats.published / blogStats.total) * 100,
                      )}
                      %
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section id="pdf" className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-green-900 md:text-4xl">
                Raporty do pobrania
              </h2>
              <p className="text-sm leading-6 md:text-base md:leading-7">
                Kliknij w poszczególny kafelek i pobierz raporty jako pliki w
                formacie .pdf
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h3 className="text-lg font-semibold text-green-900">
                  Raport ogólny
                </h3>
                <Button variant="success">Pobierz</Button>
              </div>
              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h3 className="text-lg font-semibold text-green-900">
                  Raport pracowników
                </h3>
                <Button variant="success">Pobierz</Button>
              </div>
              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h3 className="text-lg font-semibold text-green-900">
                  Raport użytkowników
                </h3>
                <Button variant="success">Pobierz</Button>
              </div>
              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h3 className="text-lg font-semibold text-green-900">
                  Raport zwierząt
                </h3>
                <Button variant="success">Pobierz</Button>
              </div>
              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h3 className="text-lg font-semibold text-green-900">
                  Raport adopcji
                </h3>
                <Button variant="success">Pobierz</Button>
              </div>
              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h3 className="text-lg font-semibold text-green-900">
                  Raport medyczny
                </h3>
                <Button variant="success">Pobierz</Button>
              </div>
              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
                <h3 className="text-lg font-semibold text-green-900">
                  Raport blogu
                </h3>
                <Button variant="success">Pobierz</Button>
              </div>
            </div>
          </section>
        </section>
      </Container>
    </main>
  );
};

export default AdminStatisticsPage;

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Container,
  Input,
  Label,
  Skeleton,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardNavbar from "@/components/layout/admin/DashboardNavbar";
import { UserAvatar } from "@/components/shared";
import axios from "axios";
import { SingleValueSelector, MultiValueSelector } from "@/components/shared";
import type { LabelValueType } from "@/types/common";
import type { User } from "@/types/user";

const zoneOverviewQueryKey = ["zone-assignments", "workers-overview"] as const;
const workersQueryKey = ["users", "workers", "zone-assign"] as const;
const cageOptionsQueryKey = ["cages", "options"] as const;

const toLocalDateInputValue = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const todayDate = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const minAssignableDate = toLocalDateInputValue(todayDate());

const assignmentSchema = z
  .object({
    workerIds: z
      .array(z.string())
      .min(1, "Wybierz co najmniej jednego pracownika."),
    zone: z
      .string()
      .trim()
      .regex(/^[A-Za-z]$/, "Strefa musi być jedną literą (np. A, B, C).")
      .transform((value) => value.toUpperCase()),
    dateFrom: z.string().min(1, "Podaj datę początkową."),
    dateTo: z.string().min(1, "Podaj datę końcową."),
  })
  .refine((data) => data.dateFrom <= data.dateTo, {
    message: "Data początkowa nie może być późniejsza niż końcowa.",
    path: ["dateTo"],
  })
  .refine((data) => data.dateFrom >= minAssignableDate, {
    message: "Nie można przypisywać stref do dni z przeszłości.",
    path: ["dateFrom"],
  })
  .refine((data) => data.dateTo >= minAssignableDate, {
    message: "Nie można przypisywać stref do dni z przeszłości.",
    path: ["dateTo"],
  });

type AssignmentFormInput = z.input<typeof assignmentSchema>;
type AssignmentFormData = z.output<typeof assignmentSchema>;

type CageOptionsResponse = {
  zones: string[];
};

type WeekInfo = {
  from: string;
  to: string;
  label: string;
};

type ZoneWeekAssignment = {
  zone: string;
  dates: string[];
  label: string;
};

type WorkerZoneRow = {
  id: number;
  fullName: string;
  imageUrl: string | null;
  role: string;
  currentWeekZones: ZoneWeekAssignment[];
  nextWeekZones: ZoneWeekAssignment[];
  previousWeekZones: ZoneWeekAssignment[];
  twoWeeksAgoZones: ZoneWeekAssignment[];
};

type ZoneCoverageWorker = {
  id: number;
  fullName: string;
  dates: string[];
  label: string;
};

type ZoneWeekCoverage = {
  uncoveredDates: string[];
  uncoveredLabel: string;
  workers: ZoneCoverageWorker[];
};

type ZoneCoverageRow = {
  zone: string;
  currentWeek: ZoneWeekCoverage;
  nextWeek: ZoneWeekCoverage;
  previousWeek: ZoneWeekCoverage;
  twoWeeksAgo: ZoneWeekCoverage;
};

type WorkersZoneOverviewResponse = {
  weeks: {
    current: WeekInfo;
    next: WeekInfo;
    previous: WeekInfo;
    twoWeeksAgo: WeekInfo;
  };
  workers: WorkerZoneRow[];
  zones: ZoneCoverageRow[];
};

const startOfWeekMonday = (input = new Date()) => {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
};

const clampToTodayOrLater = (date: Date) => {
  const minDate = todayDate();
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value < minDate ? minDate : value;
};

const ZoneAssignmentsCell = ({ zones }: { zones: ZoneWeekAssignment[] }) => {
  if (zones.length === 0) return "—";

  return (
    <div className="space-y-1">
      {zones.map((item) => (
        <div key={`${item.zone}-${item.dates.join("-")}`}>
          <span className="font-bold">{item.zone}</span>
          {item.label.length > item.zone.length && (
            <span>{item.label.slice(item.zone.length)}</span>
          )}
        </div>
      ))}
    </div>
  );
};

const weekHeadClass = "w-[21%] whitespace-normal";
const weekCellClass = "align-middle whitespace-normal break-words";
const currentWeekHeadClass = `${weekHeadClass} bg-green-50 text-green-900`;
const currentWeekCellClass = `${weekCellClass} bg-green-50 font-medium text-green-900`;
const currentWeekZoneCellClass = `${weekCellClass} bg-green-50`;

const ZoneCoverageCell = ({
  coverage,
  highlightGaps = false,
}: {
  coverage: ZoneWeekCoverage;
  highlightGaps?: boolean;
}) => {
  const hasWorkers = coverage.workers.length > 0;
  const hasGaps = coverage.uncoveredDates.length > 0;
  const gapClassName = highlightGaps
    ? "font-medium text-red-700"
    : "font-medium text-foreground";

  if (!hasWorkers) {
    return <span className={gapClassName}>Nie przypisano nikogo</span>;
  }

  return (
    <div className="space-y-1">
      {coverage.workers.map((worker) => (
        <div key={worker.id}>{worker.label}</div>
      ))}
      {hasGaps && (
        <div className={gapClassName}>
          Brak przypisania: {coverage.uncoveredLabel}
        </div>
      )}
    </div>
  );
};
const getWorkers = async () => {
  const res = await axios.get<User[]>("/api/users/workers", {
    withCredentials: true,
  });
  return res.data;
};

const getCageOptions = async () => {
  const res = await axios.get<CageOptionsResponse>("/api/cages/options", {
    withCredentials: true,
  });
  return res.data;
};

const getWorkersZoneOverview = async () => {
  const res = await axios.get<WorkersZoneOverviewResponse>(
    "/api/zone-assignments/workers-overview",
    { withCredentials: true },
  );
  return res.data;
};

type ZoneAssignmentConflict = {
  workerId: number;
  fullName: string;
  currentLabel: string;
  newLabel: string;
  summary: string;
};

type AssignZoneConflictResponse = {
  requiresConfirmation: true;
  msg: string;
  conflicts: ZoneAssignmentConflict[];
};

const assignZoneRange = async ({
  data,
  confirm = false,
}: {
  data: AssignmentFormData;
  confirm?: boolean;
}) => {
  const res = await axios.post(
    "/api/zone-assignments",
    {
      workerIds: data.workerIds.map((id) => Number(id)),
      zone: data.zone,
      dateFrom: data.dateFrom,
      dateTo: data.dateTo,
      confirm,
    },
    {
      withCredentials: true,
      validateStatus: (status) =>
        (status >= 200 && status < 300) || status === 409,
    },
  );

  if (res.status === 409) {
    return {
      type: "conflict" as const,
      ...(res.data as AssignZoneConflictResponse),
    };
  }

  return {
    type: "success" as const,
    ...(res.data as { msg: string }),
  };
};

const WorkWeekPage = () => {
  const queryClient = useQueryClient();
  const [pendingAssignment, setPendingAssignment] =
    useState<AssignmentFormData | null>(null);
  const [conflicts, setConflicts] = useState<ZoneAssignmentConflict[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const weekStart = startOfWeekMonday();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const defaultDateFrom = toLocalDateInputValue(clampToTodayOrLater(weekStart));
  const defaultDateTo = toLocalDateInputValue(clampToTodayOrLater(weekEnd));
  const minDate = minAssignableDate;

  const { data: workers = [] } = useQuery({
    queryKey: workersQueryKey,
    queryFn: getWorkers,
  });

  const { data: cageOptions } = useQuery({
    queryKey: cageOptionsQueryKey,
    queryFn: getCageOptions,
  });

  const {
    data: overview,
    isLoading: isOverviewLoading,
    isError: isOverviewError,
    isFetching: isOverviewFetching,
  } = useQuery({
    queryKey: zoneOverviewQueryKey,
    queryFn: getWorkersZoneOverview,
    staleTime: 0,
  });

  const workerOptions: LabelValueType[] = useMemo(
    () =>
      workers
        .filter((worker) => worker.role === "PRACOWNIK")
        .map((worker) => ({
          label: worker.fullName,
          value: String(worker.id),
        })),
    [workers],
  );

  const zoneItems = useMemo(() => {
    const zones = cageOptions?.zones ?? [];
    return zones.length > 0 ? zones : ["A", "B", "C", "D"];
  }, [cageOptions?.zones]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AssignmentFormInput, unknown, AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      workerIds: [],
      zone: zoneItems[0] ?? "A",
      dateFrom: defaultDateFrom,
      dateTo: defaultDateTo,
    },
  });

  const assignMutation = useMutation({
    mutationFn: assignZoneRange,
    onSuccess: async (result) => {
      if (result.type === "conflict") {
        setConflicts(result.conflicts);
        setIsConfirmOpen(true);
        return;
      }

      toast.success(result.msg);
      setPendingAssignment(null);
      setConflicts([]);
      setIsConfirmOpen(false);
      await queryClient.invalidateQueries({ queryKey: zoneOverviewQueryKey });
      await queryClient.refetchQueries({ queryKey: zoneOverviewQueryKey });
      reset({
        workerIds: [],
        zone: zoneItems[0] ?? "A",
        dateFrom: defaultDateFrom,
        dateTo: defaultDateTo,
      });
    },
    onError: (err) => {
      const message =
        axios.isAxiosError(err) && err.response?.data?.msg
          ? String(err.response.data.msg)
          : "Nie udało się przypisać strefy.";
      toast.error(message);
    },
  });

  const onSubmit = (data: AssignmentFormData) => {
    setPendingAssignment(data);
    assignMutation.mutate({ data, confirm: false });
  };

  const handleConfirmOverwrite = () => {
    if (!pendingAssignment) return;
    const data = pendingAssignment;
    assignMutation.mutate({ data, confirm: true });
  };

  return (
    <main>
      <Container className="mb-6 space-y-12 md:mb-10 md:space-y-16">
        <section id="info" className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-green-900 md:text-5xl">
              Zarządzaj tygodniem pracy
            </h1>
            <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
              Przypisz pracownikowi opiekę nad wybraną strefą w podanym zakresie
              dat.
            </p>
          </div>
          <DashboardNavbar />
        </section>

        <section id="assign" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-green-900 md:text-3xl">
              Nowe przypisanie
            </h2>
            <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
              Wybierz jednego lub wielu pracowników, strefę oraz zakres dni.
              Pracownik może mieć kilka różnych stref. <br />
              Ponowne przypisanie tej samej strefy wymaga potwierdzenia i
              nadpisuje jej poprzedni zakres.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="max-w-4xl space-y-6"
          >
            <div className="space-y-2">
              <Label>Pracownicy</Label>
              <Controller
                name="workerIds"
                control={control}
                render={({ field }) => (
                  <MultiValueSelector
                    items={workerOptions}
                    placeholder="Wybierz pracowników"
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                )}
              />
              {errors.workerIds && (
                <p className="text-xs font-medium text-red-600 lg:text-sm">
                  {errors.workerIds.message}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="space-y-2">
                <Label>Strefa</Label>
                <Controller
                  name="zone"
                  control={control}
                  render={({ field }) => (
                    <SingleValueSelector
                      items={zoneItems}
                      placeholder="Wybierz strefę"
                      value={field.value}
                      onValueChange={(value) =>
                        field.onChange(value?.toUpperCase() ?? "A")
                      }
                    />
                  )}
                />
                {errors.zone && (
                  <p className="text-xs font-medium text-red-600 lg:text-sm">
                    {errors.zone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateFrom">Od</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  min={minDate}
                  {...register("dateFrom")}
                  className={errors.dateFrom ? "bg-red-600/20" : undefined}
                />
                {errors.dateFrom && (
                  <p className="text-xs font-medium text-red-600 lg:text-sm">
                    {errors.dateFrom.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateTo">Do</Label>
                <Input
                  id="dateTo"
                  type="date"
                  min={minDate}
                  {...register("dateTo")}
                  className={errors.dateTo ? "bg-red-600/20" : undefined}
                />
                {errors.dateTo && (
                  <p className="text-xs font-medium text-red-600 lg:text-sm">
                    {errors.dateTo.message}
                  </p>
                )}
              </div>

              <div className="flex items-end self-end pb-0.5">
                <Button
                  type="submit"
                  variant="success"
                  disabled={assignMutation.isPending}
                >
                  {assignMutation.isPending
                    ? "Zapisywanie..."
                    : "Przypisz strefę"}
                </Button>
              </div>
            </div>
          </form>
        </section>

        <section id="overview" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-green-900 md:text-3xl">
              Przypisania pracowników
            </h2>
            <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
              Podsumowanie stref w bieżącym, przyszłym oraz dwóch poprzednich
              tygodniach.
            </p>
          </div>

          {isOverviewLoading && <LoadingOverview />}
          {isOverviewError && (
            <p className="text-sm font-medium text-red-600">
              Nie udało się pobrać przypisań stref.
            </p>
          )}

          {!isOverviewLoading && !isOverviewError && overview && (
            <Table
              className={
                isOverviewFetching ? "table-fixed opacity-60" : "table-fixed"
              }
            >
              <TableCaption>
                Aktualny tydzień: {overview.weeks.current.label}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[16%]">Pracownik</TableHead>
                  <TableHead className={weekHeadClass}>
                    Przyszły tydzień
                    <span className="mt-1 block text-xs font-normal text-gray-500">
                      {overview.weeks.next.label}
                    </span>
                  </TableHead>
                  <TableHead className={currentWeekHeadClass}>
                    Aktualny tydzień
                    <span className="mt-1 block text-xs font-normal text-green-700">
                      {overview.weeks.current.label}
                    </span>
                  </TableHead>
                  <TableHead className={weekHeadClass}>
                    Poprzedni tydzień
                    <span className="mt-1 block text-xs font-normal text-gray-500">
                      {overview.weeks.previous.label}
                    </span>
                  </TableHead>
                  <TableHead className={weekHeadClass}>
                    2 tygodnie temu
                    <span className="mt-1 block text-xs font-normal text-gray-500">
                      {overview.weeks.twoWeeksAgo.label}
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.workers.length > 0 ? (
                  overview.workers.map((worker) => (
                    <TableRow key={worker.id}>
                      <TableCell className="align-middle font-medium whitespace-normal">
                        <div className="flex items-center gap-x-4">
                          <UserAvatar
                            src={worker.imageUrl}
                            alt={worker.fullName}
                          />
                          {worker.fullName}
                        </div>
                      </TableCell>
                      <TableCell className={weekCellClass}>
                        <ZoneAssignmentsCell zones={worker.nextWeekZones} />
                      </TableCell>
                      <TableCell className={currentWeekCellClass}>
                        <ZoneAssignmentsCell zones={worker.currentWeekZones} />
                      </TableCell>
                      <TableCell className={weekCellClass}>
                        <ZoneAssignmentsCell zones={worker.previousWeekZones} />
                      </TableCell>
                      <TableCell className={weekCellClass}>
                        <ZoneAssignmentsCell zones={worker.twoWeeksAgoZones} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Brak pracowników do wyświetlenia.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </section>

        <section id="zones-overview" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-green-900 md:text-3xl">
              Pokrycie stref
            </h2>
            <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
              Dla każdej strefy widać przypisanych pracowników oraz dni bez
              opieki w bieżącym, przyszłym i dwóch poprzednich tygodniach.
            </p>
          </div>

          {isOverviewLoading && <LoadingOverview />}
          {isOverviewError && (
            <p className="text-sm font-medium text-red-600">
              Nie udało się pobrać pokrycia stref.
            </p>
          )}

          {!isOverviewLoading && !isOverviewError && overview && (
            <Table
              className={
                isOverviewFetching ? "table-fixed opacity-60" : "table-fixed"
              }
            >
              <TableCaption>
                W aktualnym tygodniu dni bez opiekuna są oznaczone na czerwono.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[16%]">Strefa</TableHead>
                  <TableHead className={weekHeadClass}>
                    Przyszły tydzień
                    <span className="mt-1 block text-xs font-normal text-gray-500">
                      {overview.weeks.next.label}
                    </span>
                  </TableHead>
                  <TableHead className={currentWeekHeadClass}>
                    Aktualny tydzień
                    <span className="mt-1 block text-xs font-normal text-green-700">
                      {overview.weeks.current.label}
                    </span>
                  </TableHead>
                  <TableHead className={weekHeadClass}>
                    Poprzedni tydzień
                    <span className="mt-1 block text-xs font-normal text-gray-500">
                      {overview.weeks.previous.label}
                    </span>
                  </TableHead>
                  <TableHead className={weekHeadClass}>
                    2 tygodnie temu
                    <span className="mt-1 block text-xs font-normal text-gray-500">
                      {overview.weeks.twoWeeksAgo.label}
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(overview.zones ?? []).length > 0 ? (
                  overview.zones.map((zoneRow) => (
                    <TableRow key={zoneRow.zone}>
                      <TableCell className="font-bold whitespace-normal text-green-900">
                        {zoneRow.zone}
                      </TableCell>
                      <TableCell className={weekCellClass}>
                        <ZoneCoverageCell coverage={zoneRow.nextWeek} />
                      </TableCell>
                      <TableCell className={currentWeekZoneCellClass}>
                        <ZoneCoverageCell
                          coverage={zoneRow.currentWeek}
                          highlightGaps
                        />
                      </TableCell>
                      <TableCell className={weekCellClass}>
                        <ZoneCoverageCell coverage={zoneRow.previousWeek} />
                      </TableCell>
                      <TableCell className={weekCellClass}>
                        <ZoneCoverageCell coverage={zoneRow.twoWeeksAgo} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Brak stref do wyświetlenia.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </section>
      </Container>

      <AlertDialog
        open={isConfirmOpen}
        onOpenChange={(open) => {
          setIsConfirmOpen(open);
          if (!open) {
            setConflicts([]);
            setPendingAssignment(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Czy na pewno chcesz nadpisać przypisania?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-muted-foreground space-y-3 text-sm">
                <p>
                  Wybrani pracownicy mają już przypisaną tę strefę. Po
                  potwierdzeniu jej zakres dat zostanie nadpisany:
                </p>
                <ul className="text-foreground list-disc space-y-1 pl-5">
                  {conflicts.map((conflict) => (
                    <li key={conflict.workerId}>
                      <span className="font-medium">{conflict.fullName}:</span>{" "}
                      {conflict.currentLabel} → {conflict.newLabel}
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmOverwrite}
              className="cursor-pointer"
              disabled={assignMutation.isPending}
            >
              {assignMutation.isPending ? "Zapisywanie..." : "Tak, nadpisz"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

const LoadingOverview = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, index) => (
      <Skeleton key={index} className="h-14 w-full rounded-2xl" />
    ))}
  </div>
);

export default WorkWeekPage;

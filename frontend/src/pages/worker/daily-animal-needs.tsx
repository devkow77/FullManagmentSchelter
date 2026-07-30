import {
  Label,
  Button,
  Skeleton,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Input,
} from "@/components/ui";
import { useMemo, useState, type ChangeEvent } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import axios from "axios";
import {
  AnimalAvatar,
  MultiValueSelector,
  SingleValueSelector,
  UserAvatar,
  TablePagination,
  DashboardErrorState,
  DashboardTableSkeleton,
  DashboardPage,
  FilterToolbar,
} from "@/components/shared";
import { useAuth } from "@/context/AuthContext";
import type { Worker } from "@/types/user";
import type { AnimalType } from "@/types/animal";

const dailyCareStatusQueryKey = ["animals", "daily-care-status"] as const;
const workersProgressQueryKey = [
  "animals",
  "daily-care",
  "workers-progress",
] as const;
const workersForCareFilterQueryKey = [
  "users",
  "workers",
  "daily-care-filter",
] as const;
const cageOptionsQueryKey = ["cages", "options", "daily-care-filter"] as const;

const PAGE_SIZE = 8;

const CARE_STATUS_OPTIONS = ["Wykonano", "Niewykonano"] as const;
type CareStatusLabel = (typeof CARE_STATUS_OPTIONS)[number];

const careStatusToParam = (
  label: CareStatusLabel | null,
): "complete" | "incomplete" | null => {
  if (label === "Wykonano") return "complete";
  if (label === "Niewykonano") return "incomplete";
  return null;
};

type CareUser = {
  id: number;
  fullName: string;
} | null;

type AssignedWorker = {
  id: number;
  fullName: string;
};

type TodayCare = {
  fed: boolean;
  watered: boolean;
  cleaned: boolean;
  fedBy: CareUser;
  wateredBy: CareUser;
  cleanedBy: CareUser;
};

type CareField = "fed" | "watered" | "cleaned";

export type AnimalListItem = {
  id: number;
  name: string;
  type: AnimalType;
  gender: string;
  cageNumber: string | null;
  imageUrl: string[];
  todayCare: TodayCare;
  assignedWorkers?: AssignedWorker[];
};

type AnimalsPageResponse = {
  data: AnimalListItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

type CageOptionsResponse = {
  zones: string[];
};

type Filters = {
  careStatus: CareStatusLabel | null;
  careBy: string[];
  zones: string[];
};

type WorkerProgressItem = {
  id: number;
  fullName: string;
  imageUrl: string | null;
  zones: string[];
  completedCages: number;
  totalCages: number;
  percent: number;
};

type WorkersProgressResponse = {
  workers: WorkerProgressItem[];
};

const emptyCare = (): TodayCare => ({
  fed: false,
  watered: false,
  cleaned: false,
  fedBy: null,
  wateredBy: null,
  cleanedBy: null,
});

const isCareComplete = (care: TodayCare) =>
  care.fed && care.watered && care.cleaned;

const getWorkersForFilter = async () => {
  const res = await axios.get<Worker[]>("/api/users/workers", {
    params: { role: "PRACOWNIK" },
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

const getWorkersProgress = async () => {
  const res = await axios.get<WorkersProgressResponse>(
    "/api/animals/daily-care/workers-progress",
    { withCredentials: true },
  );
  return res.data;
};

const getAnimalsPage = async ({
  page,
  filters,
}: {
  page: number;
  filters: Filters;
}) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
    dailyCare: "true",
  });

  const careStatus = careStatusToParam(filters.careStatus);
  if (careStatus) {
    params.set("dailyCareStatus", careStatus);
  }
  if (filters.careBy.length > 0) {
    params.set("careBy", filters.careBy.join(","));
  }
  if (filters.zones.length > 0) {
    params.set("zone", filters.zones.join(","));
  }

  const res = await axios.get<AnimalsPageResponse>(
    `/api/animals?${params.toString()}`,
  );
  return res.data;
};

const updateDailyCare = async ({
  animalId,
  field,
  value,
}: {
  animalId: number;
  field: CareField;
  value: boolean;
}) => {
  const res = await axios.patch<TodayCare>(
    `/api/animals/${animalId}/daily-care`,
    { field, value },
    { withCredentials: true },
  );
  return res.data;
};

const getPerformersLabel = (care: TodayCare) => {
  const names = [care.fedBy, care.wateredBy, care.cleanedBy]
    .filter((user): user is NonNullable<CareUser> => user !== null)
    .map((user) => user.fullName);

  return [...new Set(names)].join(", ") || "—";
};

const getAssignedWorkersLabel = (workers: AssignedWorker[] | undefined) =>
  workers && workers.length > 0
    ? workers.map((worker) => worker.fullName).join(", ")
    : "—";

const DailyAnimalNeedsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canEditCare = user?.role === "PRACOWNIK";

  const [page, setPage] = useState(1);
  const [careStatus, setCareStatus] = useState<CareStatusLabel | null>(null);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());

  const filters: Filters = useMemo(
    () => ({
      careStatus,
      careBy: selectedWorkers,
      zones: selectedZones,
    }),
    [careStatus, selectedWorkers, selectedZones],
  );

  const { data: workers = [] } = useQuery({
    queryKey: workersForCareFilterQueryKey,
    queryFn: getWorkersForFilter,
  });

  const { data: cageOptions } = useQuery({
    queryKey: cageOptionsQueryKey,
    queryFn: getCageOptions,
  });

  const {
    data: workersProgressData,
    isPending: isWorkersProgressPending,
    isError: isWorkersProgressError,
  } = useQuery({
    queryKey: workersProgressQueryKey,
    queryFn: getWorkersProgress,
  });

  const workerOptions = useMemo(
    () =>
      workers.map((worker) => ({
        label: worker.fullName,
        value: String(worker.id),
      })),
    [workers],
  );

  const zoneOptions = useMemo(
    () =>
      (cageOptions?.zones ?? []).map((zone) => ({
        label: zone,
        value: zone,
      })),
    [cageOptions?.zones],
  );

  const queryKey = ["daily-animal-needs", page, filters] as const;

  const { data, isPending, isFetching, isError } = useQuery({
    queryKey,
    queryFn: () => getAnimalsPage({ page, filters }),
    placeholderData: keepPreviousData,
  });

  const animals = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isFiltering = isFetching && !isPending;

  if (page > totalPages) {
    setPage(totalPages);
  }

  const careMutation = useMutation({
    mutationFn: updateDailyCare,
    onMutate: async ({ animalId, field }) => {
      const key = `${animalId}-${field}`;
      setPendingKeys((prev) => new Set(prev).add(key));
      await queryClient.cancelQueries({ queryKey });
    },
    onSuccess: (todayCare, { animalId }) => {
      const activeStatus = careStatusToParam(careStatus);
      const matchesStatusFilter =
        activeStatus === null ||
        (activeStatus === "complete"
          ? isCareComplete(todayCare)
          : !isCareComplete(todayCare));

      const performerIds = [
        todayCare.fedBy,
        todayCare.wateredBy,
        todayCare.cleanedBy,
      ]
        .filter((user): user is NonNullable<CareUser> => user !== null)
        .map((user) => String(user.id));

      const matchesWorkerFilter =
        selectedWorkers.length === 0 ||
        selectedWorkers.some((id) => performerIds.includes(id));

      void queryClient.invalidateQueries({ queryKey: dailyCareStatusQueryKey });
      void queryClient.invalidateQueries({ queryKey: workersProgressQueryKey });

      if (!matchesStatusFilter || !matchesWorkerFilter) {
        void queryClient.invalidateQueries({
          queryKey: ["daily-animal-needs"],
        });
        return;
      }

      queryClient.setQueryData<AnimalsPageResponse>(queryKey, (old) => {
        if (!old) return old;

        return {
          ...old,
          data: old.data.map((animal) =>
            animal.id === animalId ? { ...animal, todayCare } : animal,
          ),
        };
      });
    },
    onSettled: (_data, _error, { animalId, field }) => {
      const key = `${animalId}-${field}`;
      setPendingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    },
  });

  const handleFilterChange = <T,>(setter: (value: T) => void, value: T) => {
    setter(value);
    setPage(1);
  };

  const resetFilters = () => {
    setCareStatus(null);
    setSelectedWorkers([]);
    setSelectedZones([]);
    setPage(1);
  };

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
  };

  const handleCareToggle = (
    animalId: number,
    field: CareField,
    value: boolean,
  ) => {
    if (!canEditCare) return;
    careMutation.mutate({ animalId, field, value });
  };

  return (
    <DashboardPage
      title="Codzienne obowiązki pracowników"
      description={
        <>
          W tym panelu znajdują się codzienne obowiązki pracowników. <br />
          Lista wykonanych zadań na dzień:{" "}
          {new Date().toLocaleDateString("pl-PL")} r.
        </>
      }
    >
      {isPending && (
        <DashboardTableSkeleton
          columns={7}
          showAvatar
          showActions={false}
          filters={3}
          rows={PAGE_SIZE}
          tableClassName="table-fixed"
        />
      )}
      {isError && (
        <DashboardErrorState
          title="Nie udało się załadować zwierząt"
          description="Wystąpił problem podczas pobierania listy zwierząt. Sprawdź połączenie z internetem i spróbuj ponownie."
        />
      )}
      {!isPending && !isError && (
        <div id="table">
          <FilterToolbar className="grid grid-cols-2 items-center md:flex md:flex-wrap">
            <div className="col-span-2 flex flex-row items-center gap-x-2">
              <Label htmlFor="care-status-filter">Status wykonania</Label>
              <SingleValueSelector
                items={[...CARE_STATUS_OPTIONS]}
                placeholder="Wybierz"
                value={careStatus}
                onValueChange={(value) =>
                  handleFilterChange(
                    setCareStatus,
                    value as CareStatusLabel | null,
                  )
                }
              />
            </div>

            <MultiValueSelector
              items={workerOptions}
              placeholder="Pracownik"
              value={selectedWorkers}
              onValueChange={(value) =>
                handleFilterChange(setSelectedWorkers, value)
              }
            />

            <MultiValueSelector
              items={zoneOptions}
              placeholder="Strefa"
              value={selectedZones}
              onValueChange={(value) =>
                handleFilterChange(setSelectedZones, value)
              }
            />

            <Button onClick={resetFilters} variant="destructive">
              Resetuj filtry
            </Button>
            {isFiltering && (
              <span className="flex items-center gap-2 text-sm text-green-900">
                <Loader2 className="size-4 animate-spin" />
                Filtrowanie...
              </span>
            )}
          </FilterToolbar>
          <Table className={isFiltering ? "opacity-60" : ""}>
            <TableCaption>Lista zwierząt w schronisku</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Imię</TableHead>
                <TableHead>Numer klatki</TableHead>
                <TableHead>Przypisany pracownik</TableHead>
                <TableHead>Jedzenie</TableHead>
                <TableHead>Woda</TableHead>
                <TableHead>Sprzątanie</TableHead>
                <TableHead>Wykonał</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {animals.length ? (
                animals.map((animal) => {
                  const care = animal.todayCare ?? emptyCare();

                  return (
                    <TableRow
                      key={animal.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/zwierzeta/${animal.id}`)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-x-4">
                          <AnimalAvatar
                            type={animal.type}
                            src={animal.imageUrl[0]}
                            alt={animal.name}
                          />
                          {animal.name}
                        </div>
                      </TableCell>
                      <TableCell>{animal.cageNumber ?? "—"}</TableCell>
                      <TableCell className="whitespace-normal">
                        {getAssignedWorkersLabel(animal.assignedWorkers)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <CareCheckbox
                          checked={care.fed}
                          disabled={
                            !canEditCare ||
                            pendingKeys.has(`${animal.id}-fed`)
                          }
                          ariaLabel={`Jedzenie — ${animal.name}`}
                          onChange={(value) =>
                            handleCareToggle(animal.id, "fed", value)
                          }
                        />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <CareCheckbox
                          checked={care.watered}
                          disabled={
                            !canEditCare ||
                            pendingKeys.has(`${animal.id}-watered`)
                          }
                          ariaLabel={`Woda — ${animal.name}`}
                          onChange={(value) =>
                            handleCareToggle(animal.id, "watered", value)
                          }
                        />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <CareCheckbox
                          checked={care.cleaned}
                          disabled={
                            !canEditCare ||
                            pendingKeys.has(`${animal.id}-cleaned`)
                          }
                          ariaLabel={`Sprzątanie — ${animal.name}`}
                          onChange={(value) =>
                            handleCareToggle(animal.id, "cleaned", value)
                          }
                        />
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        {getPerformersLabel(care)}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-5 text-center font-medium"
                  >
                    Brak zwierząt o podanych filtrach.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={7}>
                  <TablePagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={6}>Suma zwierząt</TableCell>
                <TableCell className="text-right">{total}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}

      {isWorkersProgressPending && <LoadingWorkersProgress />}
      {isWorkersProgressError && (
        <DashboardErrorState
          title="Wystąpił błąd"
          description="Wystąpił błąd podczas ładowania postępu pracowników. Spróbuj później ponownie."
        />
      )}
      {!isWorkersProgressPending && !isWorkersProgressError && (
        <WorkersProgressTable
          workers={workersProgressData?.workers ?? []}
        />
      )}
    </DashboardPage>
  );
};

// Komponent checkbox
const CareCheckbox = ({
  checked,
  disabled,
  ariaLabel,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  ariaLabel: string;
  onChange: (value: boolean) => void;
}) => {
  return (
    <Input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(event: ChangeEvent<HTMLInputElement>) =>
        onChange(event.target.checked)
      }
      className="size-5 w-5 min-w-5 cursor-pointer rounded border accent-green-600 disabled:cursor-not-allowed disabled:opacity-60"
    />
  );
};

// Tabela do wyswietlania postępu pracowników
const WorkersProgressTable = ({
  workers,
}: {
  workers: WorkerProgressItem[];
}) => {
  return (
    <div id="workers-progress" className="space-y-3">
      <h2 className="text-xl font-semibold text-green-900 md:text-2xl">
        Postęp pracowników
      </h2>
      <Table>
        <TableCaption>
          Wykonanie opieki w przypisanych strefach na dziś
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Pracownik</TableHead>
            <TableHead>Strefy przypisane</TableHead>
            <TableHead>Wykonane klatki</TableHead>
            <TableHead>Postęp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workers.length ? (
            workers.map((worker) => (
              <TableRow key={worker.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-x-4">
                    <UserAvatar src={worker.imageUrl} alt={worker.fullName} />
                    {worker.fullName}
                  </div>
                </TableCell>
                <TableCell>
                  {worker.zones.length > 0 ? worker.zones.join(", ") : "—"}
                </TableCell>
                <TableCell>
                  {worker.completedCages} / {worker.totalCages}
                </TableCell>
                <TableCell>{worker.percent}%</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="py-5 text-center font-medium">
                Brak przypisań stref na dziś.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

// UI ładowania postępu pracowników
const LoadingWorkersProgress = () => {
  return (
    <div className="space-y-3">
      <Skeleton className="h-7 w-56" />
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: 4 }).map((_, index) => (
              <TableHead key={index}>
                <Skeleton className="h-4 w-24" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 3 }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              <TableCell>
                <div className="flex items-center gap-x-4">
                  <Skeleton className="size-12 shrink-0 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </TableCell>
              {Array.from({ length: 3 }).map((_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DailyAnimalNeedsPage;

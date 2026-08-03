import {
  Label,
  Button,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Input,
} from "@/components/ui";
import { useState, type ChangeEvent } from "react";
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
  SingleValueSelector,
  DashboardErrorState,
  DashboardTableSkeleton,
  DashboardTableFooter,
  DashboardPage,
  FilterToolbar,
} from "@/components/shared";
import type { AnimalType } from "@/types/animal";

const dailyCareStatusQueryKey = ["animals", "daily-care-status"] as const;
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

type TodayCare = {
  fed: boolean;
  watered: boolean;
  cleaned: boolean;
};

type CareField = "fed" | "watered" | "cleaned";

type AnimalListItem = {
  id: number;
  name: string;
  type: AnimalType;
  gender: string;
  cageNumber: string | null;
  imageUrl: string[];
  todayCare: TodayCare;
};

type MyTasksResponse = {
  data: AnimalListItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  zones: string[];
};

const emptyCare = (): TodayCare => ({
  fed: false,
  watered: false,
  cleaned: false,
});

const isCareComplete = (care: TodayCare) =>
  care.fed && care.watered && care.cleaned;

const getMyDailyTasks = async ({
  page,
  careStatus,
}: {
  page: number;
  careStatus: CareStatusLabel | null;
}) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });

  const status = careStatusToParam(careStatus);
  if (status) {
    params.set("dailyCareStatus", status);
  }

  const res = await axios.get<MyTasksResponse>(
    `/api/animals/daily-care/my-tasks?${params.toString()}`,
    { withCredentials: true },
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

const MyDailyDutiesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [careStatus, setCareStatus] = useState<CareStatusLabel | null>(null);
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());

  const queryKey = ["my-daily-duties", page, careStatus] as const;

  const { data, isPending, isFetching, isError } = useQuery({
    queryKey,
    queryFn: () => getMyDailyTasks({ page, careStatus }),
    placeholderData: keepPreviousData,
  });

  const animals = data?.data ?? [];
  const total = data?.total ?? 0;
  const zones = data?.zones ?? [];
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

      void queryClient.invalidateQueries({ queryKey: dailyCareStatusQueryKey });

      if (!matchesStatusFilter) {
        void queryClient.invalidateQueries({ queryKey: ["my-daily-duties"] });
        return;
      }

      queryClient.setQueryData<MyTasksResponse>(queryKey, (old) => {
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

  const resetFilters = () => {
    setCareStatus(null);
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
    careMutation.mutate({ animalId, field, value });
  };

  const zonesLabel =
    zones.length > 0 ? zones.join(", ") : "brak przypisanych stref";

  return (
    <DashboardPage
      title="Moje codzienne obowiązki"
      description={
        <>
          Lista zwierząt z Twoich stref na dziś{" "}
          {new Date().toLocaleDateString("pl-PL")} r.
          <br />
          Przypisane strefy: {zonesLabel}.
        </>
      }
    >
      {isPending && (
        <DashboardTableSkeleton
          columns={5}
          showAvatar
          showActions={false}
          filters={1}
          rows={PAGE_SIZE}
          tableClassName="table-fixed"
        />
      )}
      {isError && (
        <DashboardErrorState
          title="Nie udało się załadować obowiązków"
          description="Wystąpił problem podczas pobierania Twoich zadań. Sprawdź połączenie z internetem i spróbuj ponownie."
        />
      )}
      {!isPending && !isError && (
        <div id="table">
          <FilterToolbar className="grid grid-cols-2 items-center md:flex md:flex-wrap">
            <div className="col-span-2 flex items-center gap-x-2 sm:col-span-1">
              <Label htmlFor="care-status-filter">Status wykonania</Label>
              <SingleValueSelector
                items={[...CARE_STATUS_OPTIONS]}
                placeholder="Wybierz"
                value={careStatus}
                onValueChange={(value) => {
                  setCareStatus(value as CareStatusLabel | null);
                  setPage(1);
                }}
              />
            </div>

            <Button
              onClick={resetFilters}
              variant="destructive"
              className="col-span-2 sm:col-span-1"
            >
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
            <TableCaption>Twoje zwierzęta do opieki na dziś</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Imię</TableHead>
                <TableHead>Numer klatki</TableHead>
                <TableHead>Jedzenie</TableHead>
                <TableHead>Woda</TableHead>
                <TableHead>Sprzątanie</TableHead>
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
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <CareCheckbox
                          checked={care.fed}
                          disabled={pendingKeys.has(`${animal.id}-fed`)}
                          ariaLabel={`Jedzenie — ${animal.name}`}
                          onChange={(value) =>
                            handleCareToggle(animal.id, "fed", value)
                          }
                        />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <CareCheckbox
                          checked={care.watered}
                          disabled={pendingKeys.has(`${animal.id}-watered`)}
                          ariaLabel={`Woda — ${animal.name}`}
                          onChange={(value) =>
                            handleCareToggle(animal.id, "watered", value)
                          }
                        />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <CareCheckbox
                          checked={care.cleaned}
                          disabled={pendingKeys.has(`${animal.id}-cleaned`)}
                          ariaLabel={`Sprzątanie — ${animal.name}`}
                          onChange={(value) =>
                            handleCareToggle(animal.id, "cleaned", value)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-5 text-center font-medium"
                  >
                    {zones.length === 0
                      ? "Nie masz dziś przypisanych stref. Skontaktuj się z administratorem."
                      : "Brak zwierząt w Twoich strefach o podanych filtrach."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <DashboardTableFooter
              columns={Array(5).fill("always")}
              page={page}
              totalPages={totalPages}
              onPageChange={goToPage}
              sumLabel="Suma zwierząt"
              sumValue={total}
            />
          </Table>
        </div>
      )}
    </DashboardPage>
  );
};

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

export default MyDailyDutiesPage;

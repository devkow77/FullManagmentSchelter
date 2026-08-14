import {
  DeleteCageDialog,
  Button,
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
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { Link } from "react-router";
import axios from "axios";
import {
  MultiValueSelector,
  SingleValueSelector,
  AnimalAvatar,
  DashboardTableFooter,
  DashboardErrorState,
  DashboardTableSkeleton,
  TableRowActions,
  DashboardPage,
  FilterToolbar,
} from "@/components/shared";
import type { CageListItem, CageOptions, PaginatedResponse } from "@/types";
import { formatCageLabel } from "@/lib/utils";

const PAGE_SIZE = 8;
const adminCagesQueryKey = ["admin-cages"] as const;
const cageOptionsQueryKey = ["cages", "options"] as const;

const CAGE_STATUS_OPTIONS = ["Puste", "Zajęte"] as const;
type CageStatusLabel = (typeof CAGE_STATUS_OPTIONS)[number];

const cageStatusToParam = (
  label: CageStatusLabel | null,
): "empty" | "occupied" | null => {
  if (label === "Puste") return "empty";
  if (label === "Zajęte") return "occupied";
  return null;
};

type CagesFilters = {
  zones: string[];
  numbers: string[];
  status: CageStatusLabel | null;
};

const getCageOptions = async () => {
  const res = await axios.get<CageOptions>("/api/cages/options", {
    withCredentials: true,
  });
  return res.data;
};

const getCagesPage = async ({
  page,
  filters,
}: {
  page: number;
  filters: CagesFilters;
}) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });

  if (filters.zones.length > 0) {
    params.set("zone", filters.zones.join(","));
  }
  if (filters.numbers.length > 0) {
    params.set("number", filters.numbers.join(","));
  }
  const status = cageStatusToParam(filters.status);
  if (status) {
    params.set("status", status);
  }

  const res = await axios.get<PaginatedResponse<CageListItem>>(
    `/api/cages?${params.toString()}`,
    { withCredentials: true },
  );
  return res.data;
};

const styleCageStatus = (isOccupied: boolean) =>
  isOccupied
    ? "bg-amber-100 border border-amber-300 text-amber-900"
    : "bg-emerald-100 border border-emerald-300 text-emerald-900";

const AdminCagesPage = () => {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<CageStatusLabel | null>(
    null,
  );

  const filters: CagesFilters = useMemo(
    () => ({
      zones: selectedZones,
      numbers: selectedNumbers,
      status: selectedStatus,
    }),
    [selectedZones, selectedNumbers, selectedStatus],
  );

  const { data: cageOptions } = useQuery({
    queryKey: cageOptionsQueryKey,
    queryFn: getCageOptions,
  });

  const zoneOptions = useMemo(
    () =>
      (cageOptions?.zones ?? []).map((zone) => ({
        label: zone,
        value: zone,
      })),
    [cageOptions?.zones],
  );

  const numberOptions = useMemo(
    () =>
      (cageOptions?.numbers ?? []).map((number) => ({
        label: String(number),
        value: String(number),
      })),
    [cageOptions?.numbers],
  );

  const {
    data,
    isLoading = true,
    error,
    isFetching,
  } = useQuery({
    queryKey: [...adminCagesQueryKey, page, filters],
    queryFn: () => getCagesPage({ page, filters }),
    placeholderData: keepPreviousData,
  });

  const cages = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (page > totalPages) {
    setPage(totalPages);
  }

  const deleteCageMutation = useMutation({
    mutationFn: (id: number) =>
      axios.delete(`/api/cages/${id}`, { withCredentials: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminCagesQueryKey });
      void queryClient.invalidateQueries({ queryKey: cageOptionsQueryKey });
      toast.success("Pomyślnie usunięto klatkę!");
    },
    onError: (err) => {
      console.error(err);
      const message =
        axios.isAxiosError(err) && err.response?.data?.msg
          ? String(err.response.data.msg)
          : "Nie udało się usunąć klatki.";
      toast.error(message);
    },
  });

  const resetFilters = () => {
    setSelectedZones([]);
    setSelectedNumbers([]);
    setSelectedStatus(null);
    setPage(1);
  };

  const handleFilterChange = <T,>(setter: (value: T) => void, value: T) => {
    setter(value);
    setPage(1);
  };

  const handleDeleteCage = (id: number) => {
    deleteCageMutation.mutate(id);
  };

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
  };

  return (
    <DashboardPage
      title="Zarządzaj klatkami zwierząt"
      description="W tym panelu znajdują się wszystkie klatki zwierząt w schronisku."
    >
      {isLoading && (
        <DashboardTableSkeleton columns={4} filters={3} rows={PAGE_SIZE} />
      )}
      {error && (
        <DashboardErrorState
          title="Nie udało się załadować klatek"
          description="Wystąpił problem podczas pobierania listy klatek. Sprawdź połączenie z internetem i spróbuj ponownie."
        />
      )}
      {!isLoading && !error && (
        <section id="table">
          <FilterToolbar className="grid grid-cols-2 items-center md:sticky md:flex md:flex-wrap">
            <MultiValueSelector
              items={zoneOptions}
              placeholder="Strefa"
              value={selectedZones}
              onValueChange={(value) =>
                handleFilterChange(setSelectedZones, value)
              }
            />
            <MultiValueSelector
              items={numberOptions}
              placeholder="Numer klatki"
              value={selectedNumbers}
              onValueChange={(value) =>
                handleFilterChange(setSelectedNumbers, value)
              }
            />

            <SingleValueSelector
              items={[...CAGE_STATUS_OPTIONS]}
              placeholder="Status"
              value={selectedStatus}
              onValueChange={(value) =>
                handleFilterChange(
                  setSelectedStatus,
                  value as CageStatusLabel | null,
                )
              }
            />

            <Button onClick={resetFilters} variant="destructive">
              Resetuj filtry
            </Button>

            <Button
              variant="success"
              asChild
              className="col-span-2 sm:col-span-1"
            >
              <Link to="/admin/klatki/dodaj">Dodaj klatkę</Link>
            </Button>
          </FilterToolbar>

          <Table className={isFetching ? "opacity-60" : undefined}>
            <TableCaption>Lista klatek w schronisku</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Numer strefy i klatki</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden sm:table-cell">Zwierzę</TableHead>
                <TableHead className="w-0 text-right">Opcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cages.length ? (
                cages.map((cage) => {
                  const label = cage.label ?? formatCageLabel(cage);
                  const isOccupied = cage.isOccupied || !!cage.animal;

                  return (
                    <TableRow key={cage.id}>
                      <TableCell className="font-medium">
                        {cage.zone}-{cage.number}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span
                          className={`${styleCageStatus(isOccupied)} rounded-2xl px-4 py-2 text-xs`}
                        >
                          {isOccupied ? "Zajęte" : "Puste"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {cage.animal ? (
                          <div className="flex items-center gap-x-4 font-medium">
                            <AnimalAvatar
                              type={cage.animal.type}
                              src={cage.animal.imageUrl?.[0]}
                              alt={cage.animal.name}
                            />
                            {cage.animal.name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Brak</span>
                        )}
                      </TableCell>
                      <TableCell className="w-0 text-right">
                        <TableRowActions
                          deleteSlot={
                            <DeleteCageDialog
                              cageId={cage.id}
                              cageLabel={label}
                              disabled={isOccupied}
                              onConfirm={handleDeleteCage}
                            />
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-5 text-center font-medium"
                  >
                    Brak klatek o podanych filtrach.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <DashboardTableFooter
              columns={["always", "sm", "sm", "always"]}
              page={page}
              totalPages={totalPages}
              onPageChange={goToPage}
              sumLabel="Suma klatek"
              sumValue={total}
            />
          </Table>
        </section>
      )}
    </DashboardPage>
  );
};

export default AdminCagesPage;

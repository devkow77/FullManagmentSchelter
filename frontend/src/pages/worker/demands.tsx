import {
  Button,
  Input,
  Label,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  DeleteAnimalNeedDialog,
} from "@/components/ui";
import { useMemo, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Link } from "react-router";
import axios from "axios";
import { toast } from "sonner";
import {
  AnimalAvatar,
  MultiValueSelector,
  TablePagination,
  DashboardErrorState,
  DashboardTableSkeleton,
  TableRowActions,
  DashboardPage,
  FilterToolbar,
} from "@/components/shared";
import type { Worker } from "@/types/user";

const PAGE_SIZE = 8;
const animalNeedsQueryKey = ["animal-needs"] as const;
const workersForNeedsFilterQueryKey = [
  "users",
  "workers",
  "animal-needs-filter",
] as const;

type AnimalNeedListItem = {
  id: number;
  name: string;
  description: string | null;
  category: string;
  isActive: boolean;
  animal: {
    id: number;
    name: string;
    type: string;
    imageUrl: string[];
    cageNumber: string | null;
  };
  reportedBy: {
    id: number;
    fullName: string;
  } | null;
};

type AnimalNeedsPageResponse = {
  data: AnimalNeedListItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

type NeedsFilters = {
  search: string;
  reportedBy: string[];
};

const getWorkersForFilter = async () => {
  const res = await axios.get<Worker[]>("/api/users/workers", {
    params: { role: "PRACOWNIK" },
    withCredentials: true,
  });
  return res.data;
};

const getAnimalNeedsPage = async ({
  page,
  filters,
}: {
  page: number;
  filters: NeedsFilters;
}) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
    isActive: "true",
  });

  if (filters.search.trim()) {
    params.set("search", filters.search.trim());
  }
  if (filters.reportedBy.length > 0) {
    params.set("reportedBy", filters.reportedBy.join(","));
  }

  const res = await axios.get<AnimalNeedsPageResponse>(
    `/api/animal-needs?${params.toString()}`,
    { withCredentials: true },
  );
  return res.data;
};

const AnimalDemandsPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReporters, setSelectedReporters] = useState<string[]>([]);

  const filters: NeedsFilters = useMemo(
    () => ({
      search: searchQuery,
      reportedBy: selectedReporters,
    }),
    [searchQuery, selectedReporters],
  );

  const { data: workers = [] } = useQuery({
    queryKey: workersForNeedsFilterQueryKey,
    queryFn: getWorkersForFilter,
  });

  const workerOptions = useMemo(
    () =>
      workers.map((worker) => ({
        label: worker.fullName,
        value: String(worker.id),
      })),
    [workers],
  );

  const { data, isPending, isError, isFetching } = useQuery({
    queryKey: [...animalNeedsQueryKey, page, filters],
    queryFn: () => getAnimalNeedsPage({ page, filters }),
    placeholderData: keepPreviousData,
  });

  const needs = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasActiveFilters =
    searchQuery.trim().length > 0 || selectedReporters.length > 0;

  if (page > totalPages) {
    setPage(totalPages);
  }

  const deleteAnimalNeedMutation = useMutation({
    mutationFn: (id: number) =>
      axios.delete(`/api/animal-needs/${id}`, { withCredentials: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: animalNeedsQueryKey });
      toast.success("Pomyślnie usunięto zapotrzebowanie!");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Nie udało się usunąć zapotrzebowania.");
    },
  });

  const handleDeleteAnimalNeed = (id: number) => {
    deleteAnimalNeedMutation.mutate(id);
  };

  const handleFilterChange = <T,>(setter: (value: T) => void, value: T) => {
    setter(value);
    setPage(1);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedReporters([]);
    setPage(1);
  };

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
  };

  return (
    <DashboardPage
      title="Zapotrzebowania zwierząt"
      description="Lista aktywnych zapotrzebowań zgłoszonych przez pracowników."
    >
      {isPending && (
        <DashboardTableSkeleton
          columns={6}
          showAvatar
          showActions={false}
          rows={PAGE_SIZE}
          tableClassName="table-fixed"
        />
      )}
      {isError && (
        <DashboardErrorState
          title="Nie udało się załadować zapotrzebowań"
          description="Wystąpił problem podczas pobierania listy. Sprawdź połączenie z internetem i spróbuj ponownie."
        />
      )}

      {!isPending && !isError && (
        <section id="table" className="space-y-0">
          <FilterToolbar>
              <div className="flex flex-row items-center gap-x-2">
                <Label htmlFor="search-input">Wyszukaj</Label>
                <Input
                  id="search-input"
                  value={searchQuery}
                  onChange={(e) =>
                    handleFilterChange(setSearchQuery, e.target.value)
                  }
                  placeholder="Nazwa zwierzęcia..."
                />
              </div>

              <MultiValueSelector
                items={workerOptions}
                placeholder="Zgłosił"
                value={selectedReporters}
                onValueChange={(value) =>
                  handleFilterChange(setSelectedReporters, value)
                }
              />

              <Button onClick={resetFilters} variant="destructive">
                Resetuj filtry
              </Button>

              <Button variant="success" asChild className="ml-auto">
                <Link to="/pracownik/zapotrzebowania-zwierzat/dodaj">
                  Dodaj zapotrzebowanie
                </Link>
              </Button>
          </FilterToolbar>

            <Table className={isFetching ? "opacity-60" : undefined}>
              <TableCaption>Aktywne zapotrzebowania</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Zwierzę</TableHead>
                  <TableHead>Numer klatki</TableHead>
                  <TableHead>Rzecz</TableHead>
                  <TableHead>Powód</TableHead>
                  <TableHead>Zgłosił</TableHead>
                  <TableHead className="text-right">Opcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {needs.length > 0 ? (
                  needs.map((need) => (
                    <TableRow key={need.id}>
                      <TableCell className="align-middle font-medium">
                        <div className="flex items-center gap-x-4">
                          <AnimalAvatar
                            type={need.animal.type}
                            src={need.animal.imageUrl[0]}
                            alt={need.animal.name}
                          />
                          <Link
                            to={`/zwierzeta/${need.animal.id}`}
                            className="underline-offset-4 hover:underline"
                          >
                            {need.animal.name}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>{need.animal.cageNumber ?? "—"}</TableCell>
                      <TableCell className="whitespace-normal">
                        {need.name}
                      </TableCell>
                      <TableCell className="max-w-xs whitespace-normal">
                        {need.description?.trim() || "—"}
                      </TableCell>
                      <TableCell>{need.reportedBy?.fullName ?? "—"}</TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <TableRowActions
                          deleteSlot={
                            <DeleteAnimalNeedDialog
                              animalNeedId={need.id}
                              onConfirm={handleDeleteAnimalNeed}
                            />
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-5 text-center font-medium"
                    >
                      {hasActiveFilters
                        ? "Brak zapotrzebowań dla podanych filtrów."
                        : "Brak aktywnych zapotrzebowań."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6}>
                    <TablePagination
                      page={page}
                      totalPages={totalPages}
                      onPageChange={goToPage}
                    />
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell colSpan={5}>Suma zapotrzebowań</TableCell>
                  <TableCell className="text-right">{total}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
        </section>
      )}
    </DashboardPage>
  );
};

export default AnimalDemandsPage;

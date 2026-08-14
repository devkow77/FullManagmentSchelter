import {
  Input,
  Label,
  Button,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  DeleteUserDialog,
} from "@/components/ui";
import { useState, useMemo } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router";
import {
  formatUserRole,
  styleUserRole,
  formatUserGender,
  styleEmptyField,
} from "@/lib/utils";
import { toast } from "sonner";
import {
  MultiValueSelector,
  UserAvatar,
  DashboardTableFooter,
  DashboardErrorState,
  DashboardTableSkeleton,
  TableRowActions,
  DashboardPage,
  FilterToolbar,
} from "@/components/shared";
import {
  workerRoleOptions,
  genderOptions,
  booleanFilterOptions,
} from "@/constants/user.constants";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { PaginatedResponse, Worker } from "@/types";

const PAGE_SIZE = 8;
const adminWorkersQueryKey = ["admin-workers"] as const;

type WorkersFilters = {
  search: string;
  roles: string[];
  genders: string[];
  cities: string[];
  hasChildren: string[];
  isFormFilled: string[];
};

const getWorkersPage = async ({
  page,
  filters,
}: {
  page: number;
  filters: WorkersFilters;
}) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });

  if (filters.search.trim()) {
    params.set("search", filters.search.trim());
  }
  if (filters.roles.length > 0) {
    params.set("role", filters.roles.join(","));
  }
  if (filters.genders.length > 0) {
    params.set("gender", filters.genders.join(","));
  }
  if (filters.cities.length > 0) {
    params.set("city", filters.cities.join(","));
  }
  if (filters.hasChildren.length > 0) {
    params.set("hasChildren", filters.hasChildren.join(","));
  }
  if (filters.isFormFilled.length > 0) {
    params.set("isFormFilled", filters.isFormFilled.join(","));
  }

  const res = await axios.get<PaginatedResponse<Worker>>(
    `/api/users/workers?${params.toString()}`,
  );
  return res.data;
};

const AdminWorkersPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedGender, setSelectedGender] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string[]>([]);
  const [selectedHasChildren, setSelectedHasChildren] = useState<string[]>([]);
  const [selectedIsFormFilled, setSelectedIsFormFilled] = useState<string[]>(
    [],
  );

  const filters: WorkersFilters = {
    search: searchQuery,
    roles: selectedRoles,
    genders: selectedGender,
    cities: selectedCity,
    hasChildren: selectedHasChildren,
    isFormFilled: selectedIsFormFilled,
  };

  const {
    data,
    isLoading = true,
    error,
    isFetching,
  } = useQuery({
    queryKey: [...adminWorkersQueryKey, page, filters],
    queryFn: () => getWorkersPage({ page, filters }),
    placeholderData: keepPreviousData,
  });

  const workers = useMemo(() => data?.data ?? [], [data?.data]);
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (page > totalPages) {
    setPage(totalPages);
  }

  const deleteWorkerMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`/api/users/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminWorkersQueryKey });
      toast.success("Pomyślnie usunięto pracownika!");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Nie udało się usunąć pracownika.");
    },
  });

  const resetFilters = () => {
    setSelectedRoles([]);
    setSelectedGender([]);
    setSelectedCity([]);
    setSelectedHasChildren([]);
    setSelectedIsFormFilled([]);
    setSearchQuery("");
    setPage(1);
  };

  const handleFilterChange = <T,>(setter: (value: T) => void, value: T) => {
    setter(value);
    setPage(1);
  };

  const handleDeleteWorker = (id: number) => {
    deleteWorkerMutation.mutate(id);
  };

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
  };

  const workerCities = useMemo(() => {
    const cities = [
      ...new Set(workers.map((w) => w.city).filter(Boolean)),
    ] as string[];
    return cities.map((city) => ({ label: city, value: city }));
  }, [workers]);

  return (
    <DashboardPage
      title="Zarządzaj pracownikami"
      description="W tym panelu znajdują się wszyscy pracownicy schroniska."
    >
      {isLoading && (
        <DashboardTableSkeleton columns={8} showAvatar filters={11} rows={8} />
      )}
      {error && (
        <DashboardErrorState
          title="Nie udało się załadować pracowników"
          description="Wystąpił problem podczas pobierania listy pracowników. Sprawdź połączenie z internetem i spróbuj ponownie."
        />
      )}
      {!isLoading && !error && (
        <section id="table">
          <FilterToolbar className="grid grid-cols-2 items-center md:sticky md:flex md:flex-wrap">
            <div className="col-span-2 flex flex-row gap-x-2 sm:col-span-1">
              <Label>Wyszukaj</Label>
              <Input
                value={searchQuery}
                onChange={(e) =>
                  handleFilterChange(setSearchQuery, e.target.value)
                }
                placeholder="Szukaj po imieniu..."
              />
            </div>

            <MultiValueSelector
              items={workerRoleOptions}
              placeholder="Rola pracownika"
              value={selectedRoles}
              onValueChange={(value) =>
                handleFilterChange(setSelectedRoles, value)
              }
            />

            <MultiValueSelector
              items={genderOptions}
              placeholder="Płeć"
              value={selectedGender}
              onValueChange={(value) =>
                handleFilterChange(setSelectedGender, value)
              }
            />

            <MultiValueSelector
              items={workerCities}
              placeholder="Miasto"
              value={selectedCity}
              onValueChange={(value) =>
                handleFilterChange(setSelectedCity, value)
              }
            />

            <MultiValueSelector
              items={booleanFilterOptions}
              placeholder="Czy ma dzieci"
              value={selectedHasChildren}
              onValueChange={(value) =>
                handleFilterChange(setSelectedHasChildren, value)
              }
            />

            <MultiValueSelector
              items={booleanFilterOptions}
              placeholder="Wypełniony formularz"
              value={selectedIsFormFilled}
              onValueChange={(value) =>
                handleFilterChange(setSelectedIsFormFilled, value)
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
              <Link to="/admin/uzytkownicy/dodaj">Dodaj użytkownika</Link>
            </Button>
          </FilterToolbar>
          <Table className={isFetching ? "opacity-60" : undefined}>
            <TableCaption>Lista pracowników schroniska</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Imię i nazwisko</TableHead>
                <TableHead className="hidden sm:table-cell">Rola</TableHead>
                <TableHead className="hidden xl:table-cell">Płeć</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Miejsce zamieszkania
                </TableHead>
                <TableHead className="hidden xl:table-cell">
                  Posiada dzieci
                </TableHead>
                <TableHead className="hidden xl:table-cell">
                  Wypełniony formularz
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  Zatrudniony od
                </TableHead>
                <TableHead className="w-0 text-right">Opcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.length ? (
                workers.map((worker) => (
                  <TableRow
                    key={worker.id}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate(`/admin/uzytkownicy/${worker.id}/edycja`)
                    }
                  >
                    <TableCell className="flex items-center gap-x-4 font-medium">
                      <UserAvatar src={worker.imageUrl} alt={worker.fullName} />
                      {worker.fullName}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span
                        className={`${styleUserRole(
                          worker.role,
                        )} rounded-2xl px-4 py-2 text-xs`}
                      >
                        {formatUserRole[worker.role]}
                      </span>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {formatUserGender(worker.gender)}
                    </TableCell>
                    <TableCell
                      className={`${styleEmptyField(worker.city)} hidden sm:table-cell`}
                    >
                      {worker.city ?? "Brak"}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {worker.hasChildren ? "Tak" : "Nie"}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {worker.isFormFilled ? "Tak" : "Nie"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {new Date(worker.createdAt).toLocaleDateString("pl-PL")}{" "}
                      r.
                    </TableCell>
                    <TableCell
                      className="w-0 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <TableRowActions
                        editTo={`/admin/uzytkownicy/${worker.id}/edycja`}
                        deleteSlot={
                          <DeleteUserDialog
                            userId={worker.id}
                            onConfirm={handleDeleteWorker}
                          />
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-5 text-center font-medium"
                  >
                    Brak pracowników o podanych filtrach.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <DashboardTableFooter
              columns={["always", "sm", "xl", "sm", "xl", "xl", "lg", "always"]}
              page={page}
              totalPages={totalPages}
              onPageChange={goToPage}
              sumLabel="Suma pracowników"
              sumValue={workers.length}
            />
          </Table>
        </section>
      )}
    </DashboardPage>
  );
};

export default AdminWorkersPage;

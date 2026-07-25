import {
  Container,
  Input,
  Label,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  Skeleton,
  PaginationEllipsis,
  PaginationLink,
} from "@/components/ui";
import DashboardNavbar from "@/components/layout/admin/DashboardNavbar";
import { Button } from "@/components/ui";
import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  PaginationNext,
} from "@/components/ui";
import { CircleAlert, MoreHorizontalIcon } from "lucide-react";
import axios from "axios";
import { Link, useNavigate } from "react-router";
import {
  formatUserRole,
  styleUserRole,
  formatUserGender,
  styleEmptyField,
} from "@/lib/utils";
import { toast } from "sonner";
import { DeleteUserDialog } from "@/components/ui";
import { MultiValueSelector } from "@/components/shared";
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
import type { Worker } from "@/types/user";

const PAGE_SIZE = 8;
const adminWorkersQueryKey = ["admin-workers"] as const;

type WorkersPageResponse = {
  data: Worker[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

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

  const res = await axios.get<WorkersPageResponse>(
    `/api/users/workers?${params.toString()}`,
  );
  return res.data;
};

const getPageItems = (current: number, total: number) => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (current > 3) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let page = start; page <= end; page++) {
    pages.push(page);
  }

  if (current < total - 2) pages.push("ellipsis");

  pages.push(total);
  return pages;
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
    <main>
      <Container className="mb-6 space-y-12 md:mb-10 md:space-y-16">
        <section id="info" className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-green-900 md:text-5xl">
              Zarządzaj pracownikami
            </h1>
            <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
              W tym panelu znajdują się wszyscy pracownicy schroniska.
            </p>
          </div>
          <DashboardNavbar />
        </section>
        {isLoading && <LoadingWorkers />}
        {error && <ErrorWorkers />}
        {!isLoading && !error && (
          <section id="table">
            <div className="top-0 z-2 flex flex-wrap items-center gap-4 bg-white py-4 sm:sticky">
              <div className="flex flex-row gap-x-2">
                <Label>Wyszukaj</Label>
                <Input
                  value={searchQuery}
                  onChange={(e) =>
                    handleFilterChange(setSearchQuery, e.target.value)
                  }
                  placeholder="Szukaj po imieniu..."
                  className="h-7.5 placeholder:text-sm"
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

              <Button variant="success" asChild>
                <Link to="/admin/uzytkownicy/dodaj">Dodaj użytkownika</Link>
              </Button>
            </div>
            <Table className={isFetching ? "opacity-60" : undefined}>
              <TableCaption>Lista pracowników schroniska</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Imię i nazwisko</TableHead>
                  <TableHead>Rola</TableHead>
                  <TableHead>Płeć</TableHead>
                  <TableHead>Miejsce zamieszkania</TableHead>
                  <TableHead>Posiada dzieci</TableHead>
                  <TableHead>Wypełniony formularz</TableHead>
                  <TableHead>Zatrudniony od</TableHead>
                  <TableHead className="text-right">Opcje</TableHead>
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
                        {worker.imageUrl ? (
                          <img
                            src={worker.imageUrl}
                            className="size-12 rounded-full object-cover"
                            alt={worker.fullName}
                          />
                        ) : (
                          <div className="size-12 rounded-full bg-gray-200" />
                        )}
                        {worker.fullName}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`${styleUserRole(
                            worker.role,
                          )} rounded-2xl px-4 py-2 text-xs`}
                        >
                          {formatUserRole[worker.role]}
                        </span>
                      </TableCell>
                      <TableCell>{formatUserGender(worker.gender)}</TableCell>
                      <TableCell className={styleEmptyField(worker.city)}>
                        {worker.city ?? "Brak"}
                      </TableCell>
                      <TableCell>
                        {worker.hasChildren ? "Tak" : "Nie"}
                      </TableCell>
                      <TableCell>
                        {worker.isFormFilled ? "Tak" : "Nie"}
                      </TableCell>
                      <TableCell>
                        {new Date(worker.createdAt).toLocaleDateString("pl-PL")}{" "}
                        r.
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="transparent"
                              size="icon"
                              className="size-8"
                            >
                              <MoreHorizontalIcon />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              asChild
                              className="cursor-pointer"
                            >
                              <Link
                                to={`/admin/uzytkownicy/${worker.id}/edycja`}
                                state={{ returnTo: "/admin/pracownicy" }}
                              >
                                Edytuj dane
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <div
                              onSelect={(e) => e.preventDefault()}
                              className="hover:bg-accent rounded-sm"
                            >
                              <DeleteUserDialog
                                userId={worker.id}
                                onConfirm={handleDeleteWorker}
                              />
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={9}>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            aria-disabled={page <= 1}
                            className={
                              page <= 1
                                ? "pointer-events-none opacity-50"
                                : undefined
                            }
                            onClick={(e) => {
                              e.preventDefault();
                              goToPage(page - 1);
                            }}
                          />
                        </PaginationItem>

                        {getPageItems(page, totalPages).map((item, index) =>
                          item === "ellipsis" ? (
                            <PaginationItem key={`ellipsis-${index}`}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          ) : (
                            <PaginationItem key={item}>
                              <PaginationLink
                                href="#"
                                isActive={item === page}
                                onClick={(e) => {
                                  e.preventDefault();
                                  goToPage(item);
                                }}
                              >
                                {item}
                              </PaginationLink>
                            </PaginationItem>
                          ),
                        )}

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            aria-disabled={page >= totalPages}
                            className={
                              page >= totalPages
                                ? "pointer-events-none opacity-50"
                                : undefined
                            }
                            onClick={(e) => {
                              e.preventDefault();
                              goToPage(page + 1);
                            }}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={7}>Suma pracowników</TableCell>
                  <TableCell className="text-right">{workers.length}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </section>
        )}
      </Container>
    </main>
  );
};

// Nie udało się załadować pracowników UI
const ErrorWorkers = () => {
  return (
    <section
      id="error"
      className="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center"
    >
      <CircleAlert className="size-12 text-red-600" />
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-red-900">
          Nie udało się załadować pracowników
        </h2>
        <p className="max-w-md text-sm text-red-800 md:text-base">
          Wystąpił problem podczas pobierania listy pracowników. Sprawdź
          połączenie z internetem i spróbuj ponownie.
        </p>
      </div>
    </section>
  );
};

// Ładowanie pracowników UI
const LoadingWorkers = () => {
  return (
    <section id="table" className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 py-4">
        <Skeleton className="h-9 w-48" />
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-28" />
        ))}
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-36" />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: 8 }).map((_, index) => (
              <TableHead key={index}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              <TableCell>
                <div className="flex items-center gap-x-4">
                  <Skeleton className="size-12 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </TableCell>
              {Array.from({ length: 6 }).map((_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
              ))}
              <TableCell className="text-right">
                <Skeleton className="ml-auto size-8 rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
};

export default AdminWorkersPage;

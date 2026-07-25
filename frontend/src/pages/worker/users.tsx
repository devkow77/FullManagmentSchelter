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
  Button,
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
  DeleteUserDialog,
} from "@/components/ui";
import DashboardNavbar from "@/components/layout/admin/DashboardNavbar";
import { useState, useMemo } from "react";
import { CircleAlert, MoreHorizontalIcon } from "lucide-react";
import axios from "axios";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import type { User } from "@/types/user";
import { MultiValueSelector } from "@/components/shared";
import {
  genderOptions,
  booleanFilterOptions,
} from "@/constants/user.constants";
import { formatUserGender, styleEmptyField } from "@/lib/utils";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

const PAGE_SIZE = 10;
const workerUsersQueryKey = ["worker-users"] as const;

type UsersPageResponse = {
  data: User[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

type UsersFilters = {
  search: string;
  genders: string[];
  cities: string[];
  isBanned: string[];
  isFormFilled: string[];
};

const getUsersPage = async ({
  page,
  filters,
}: {
  page: number;
  filters: UsersFilters;
}) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });

  if (filters.search.trim()) {
    params.set("search", filters.search.trim());
  }
  if (filters.genders.length > 0) {
    params.set("gender", filters.genders.join(","));
  }
  if (filters.cities.length > 0) {
    params.set("city", filters.cities.join(","));
  }
  if (filters.isBanned.length > 0) {
    params.set("isBanned", filters.isBanned.join(","));
  }
  if (filters.isFormFilled.length > 0) {
    params.set("isFormFilled", filters.isFormFilled.join(","));
  }

  const res = await axios.get<UsersPageResponse>(
    `/api/users?${params.toString()}`,
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

const WorkerUsersPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: loggedUser } = useAuth();
  const isAdmin = loggedUser?.role === "ADMINISTRATOR";

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedGender, setSelectedGender] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string[]>([]);
  const [selectedIsBanned, setSelectedIsBanned] = useState<string[]>([]);
  const [selectedIsFormFilled, setSelectedIsFormFilled] = useState<string[]>(
    [],
  );

  const filters: UsersFilters = {
    search: searchQuery,
    genders: selectedGender,
    cities: selectedCity,
    isBanned: selectedIsBanned,
    isFormFilled: selectedIsFormFilled,
  };

  const {
    data,
    isLoading = true,
    error,
    isFetching,
  } = useQuery({
    queryKey: [...workerUsersQueryKey, page, filters],
    queryFn: () => getUsersPage({ page, filters }),
    placeholderData: keepPreviousData,
  });

  const users = useMemo(() => data?.data ?? [], [data?.data]);
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (page > totalPages) {
    setPage(totalPages);
  }

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`/api/users/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workerUsersQueryKey });
      toast.success("Pomyślnie usunięto użytkownika!");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Nie udało się usunąć użytkownika.");
    },
  });

  const resetFilters = () => {
    setSelectedGender([]);
    setSelectedCity([]);
    setSelectedIsBanned([]);
    setSelectedIsFormFilled([]);
    setSearchQuery("");
    setPage(1);
  };

  const handleFilterChange = <T,>(setter: (value: T) => void, value: T) => {
    setter(value);
    setPage(1);
  };

  const handleDeleteUser = (id: number) => {
    deleteUserMutation.mutate(id);
  };

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
  };

  const userCities = useMemo(() => {
    const cities = [
      ...new Set(users.map((u) => u.city).filter(Boolean)),
    ] as string[];
    return cities.map((city) => ({ label: city, value: city }));
  }, [users]);

  return (
    <main>
      <Container className="mb-6 space-y-12 md:mb-10 md:space-y-16">
        <section id="info" className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-green-900 md:text-5xl">
              {loggedUser?.role === "ADMINISTRATOR"
                ? "Zarządzaj użytkownikami"
                : "Przeglądaj użytkowników"}
            </h1>
            <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
              W tym panelu znajdują się wszyscy użytkownicy schroniska.
            </p>
          </div>
          <DashboardNavbar />
        </section>
        {isLoading && <LoadingUsers />}
        {error && <ErrorUsers />}
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
                items={genderOptions}
                placeholder="Płeć"
                value={selectedGender}
                onValueChange={(value) =>
                  handleFilterChange(setSelectedGender, value)
                }
              />

              <MultiValueSelector
                items={userCities}
                placeholder="Miasto"
                value={selectedCity}
                onValueChange={(value) =>
                  handleFilterChange(setSelectedCity, value)
                }
              />

              <MultiValueSelector
                items={booleanFilterOptions}
                placeholder="Konto zablokowane"
                value={selectedIsBanned}
                onValueChange={(value) =>
                  handleFilterChange(setSelectedIsBanned, value)
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

              {isAdmin ? (
                <Button variant="success" asChild>
                  <Link to="/admin/uzytkownicy/dodaj">Dodaj użytkownika</Link>
                </Button>
              ) : null}
            </div>

            <Table className={isFetching ? "opacity-60" : undefined}>
              <TableCaption>Lista użytkowników schroniska</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Imię i nazwisko</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Płeć</TableHead>
                  <TableHead>Miejsce zamieszkania</TableHead>
                  <TableHead>Konto zablokowane</TableHead>
                  <TableHead>Wypełniony formularz</TableHead>
                  <TableHead>Zarejestrowany od</TableHead>
                  {isAdmin ? (
                    <TableHead className="text-right">Opcje</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length ? (
                  users.map((user) => (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer"
                      onClick={() =>
                        navigate(`/admin/uzytkownicy/${user.id}/edycja`)
                      }
                    >
                      <TableCell className="flex items-center gap-x-4 font-medium">
                        {user.imageUrl ? (
                          <img
                            src={user.imageUrl}
                            className="size-12 rounded-full object-cover"
                            alt={user.fullName}
                          />
                        ) : (
                          <div className="size-12 rounded-full bg-gray-200" />
                        )}
                        {user.fullName}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{formatUserGender(user.gender)}</TableCell>
                      <TableCell className={styleEmptyField(user.city)}>
                        {user.city ?? "Brak"}
                      </TableCell>
                      <TableCell>{user.isBanned ? "Tak" : "Nie"}</TableCell>
                      <TableCell>
                        {user.isFormFilled ? "Tak" : "Nie"}
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString("pl-PL")}{" "}
                        r.
                      </TableCell>
                      {isAdmin ? (
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
                              <DropdownMenuItem asChild>
                                <Link
                                  to={`/admin/uzytkownicy/${user.id}/edycja`}
                                  state={{ returnTo: "/pracownik/uzytkownicy" }}
                                  className="cursor-pointer"
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
                                  userId={user.id}
                                  onConfirm={handleDeleteUser}
                                />
                              </div>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 8 : 7}
                      className="py-5 text-center font-medium"
                    >
                      Brak użytkowników o podanych filtrach.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 7}>
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
                  <TableCell colSpan={isAdmin ? 7 : 6}>
                    Suma użytkowników
                  </TableCell>
                  <TableCell className="text-right">{users.length}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </section>
        )}
      </Container>
    </main>
  );
};

const ErrorUsers = () => {
  return (
    <section
      id="error"
      className="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center"
    >
      <CircleAlert className="size-12 text-red-600" />
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-red-900">
          Nie udało się załadować użytkowników
        </h2>
        <p className="max-w-md text-sm text-red-800 md:text-base">
          Wystąpił problem podczas pobierania listy użytkowników. Sprawdź
          połączenie z internetem i spróbuj ponownie.
        </p>
      </div>
    </section>
  );
};

const LoadingUsers = () => {
  return (
    <section id="table" className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 py-4">
        <Skeleton className="h-9 w-48" />
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-28" />
        ))}
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

export default WorkerUsersPage;

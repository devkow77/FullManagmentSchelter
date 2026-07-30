import {
  Input,
  Label,
  Button,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  DeleteUserDialog,
} from "@/components/ui";
import {
  UserAvatar,
  MultiValueSelector,
  TablePagination,
  DashboardErrorState,
  DashboardTableSkeleton,
  TableRowActions,
  DashboardPage,
  FilterToolbar,
} from "@/components/shared";
import { useState, useMemo } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import type { User } from "@/types/user";
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
    <DashboardPage
      title={
        loggedUser?.role === "ADMINISTRATOR"
          ? "Zarządzaj użytkownikami"
          : "Przeglądaj użytkowników"
      }
      description="W tym panelu znajdują się wszyscy użytkownicy schroniska."
    >
      {isLoading && (
        <DashboardTableSkeleton
          columns={8}
          showAvatar
          filters={6}
          rows={8}
        />
      )}
      {error && (
        <DashboardErrorState
          title="Nie udało się załadować użytkowników"
          description="Wystąpił problem podczas pobierania listy użytkowników. Sprawdź połączenie z internetem i spróbuj ponownie."
        />
      )}
      {!isLoading && !error && (
        <section id="table">
          <FilterToolbar>
              <div className="flex flex-row gap-x-2">
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
          </FilterToolbar>

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
                        <UserAvatar src={user.imageUrl} alt={user.fullName} />
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
                          <TableRowActions
                            editTo={`/admin/uzytkownicy/${user.id}/edycja`}
                            deleteSlot={
                              <DeleteUserDialog
                                userId={user.id}
                                onConfirm={handleDeleteUser}
                              />
                            }
                          />
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
                    <TablePagination
                      page={page}
                      totalPages={totalPages}
                      onPageChange={goToPage}
                    />
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
    </DashboardPage>
  );
};

export default WorkerUsersPage;

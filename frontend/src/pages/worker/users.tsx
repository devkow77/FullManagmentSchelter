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
import {
  UserAvatar,
  MultiValueSelector,
  DashboardErrorState,
  DashboardTableSkeleton,
  DashboardTableFooter,
  TableRowActions,
  DashboardPage,
  FilterToolbar,
} from "@/components/shared";
import { useState, useMemo } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import type { PaginatedResponse, User } from "@/types";
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

  const res = await axios.get<PaginatedResponse<User>>(
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
        <DashboardTableSkeleton columns={8} showAvatar filters={6} rows={8} />
      )}
      {error && (
        <DashboardErrorState
          title="Nie udało się załadować użytkowników"
          description="Wystąpił problem podczas pobierania listy użytkowników. Sprawdź połączenie z internetem i spróbuj ponownie."
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

            <Button
              onClick={resetFilters}
              variant="destructive"
              className="col-span-2 sm:col-span-1"
            >
              Resetuj filtry
            </Button>

            {isAdmin ? (
              <Button
                variant="success"
                asChild
                className="col-span-2 sm:col-span-1"
              >
                <Link to="/admin/uzytkownicy/dodaj">Dodaj użytkownika</Link>
              </Button>
            ) : null}
          </FilterToolbar>

          <Table className={isFetching ? "opacity-60" : undefined}>
            <TableCaption>Lista użytkowników schroniska</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Imię i nazwisko</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="hidden xl:table-cell">Płeć</TableHead>
                <TableHead className="hidden md:table-cell">
                  Miejsce zamieszkania
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  Konto zablokowane
                </TableHead>
                <TableHead className="hidden xl:table-cell">
                  Wypełniony formularz
                </TableHead>
                {isAdmin ? (
                  <TableHead className="w-0 text-right">Opcje</TableHead>
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
                    <TableCell className="hidden sm:table-cell">
                      {user.email}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {formatUserGender(user.gender)}
                    </TableCell>
                    <TableCell
                      className={`${styleEmptyField(user.city)} hidden md:table-cell`}
                    >
                      {user.city ?? "Brak"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {user.isBanned ? "Tak" : "Nie"}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {user.isFormFilled ? "Tak" : "Nie"}
                    </TableCell>
                    {isAdmin ? (
                      <TableCell
                        className="w-0 text-right"
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
                    colSpan={isAdmin ? 7 : 6}
                    className="py-5 text-center font-medium"
                  >
                    Brak użytkowników o podanych filtrach.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <DashboardTableFooter
              columns={
                isAdmin
                  ? ["always", "sm", "xl", "md", "lg", "xl", "xl", "always"]
                  : ["always", "sm", "xl", "md", "lg", "xl", "xl"]
              }
              page={page}
              totalPages={totalPages}
              onPageChange={goToPage}
              sumLabel="Suma użytkowników"
              sumValue={users.length}
            />
          </Table>
        </section>
      )}
    </DashboardPage>
  );
};

export default WorkerUsersPage;

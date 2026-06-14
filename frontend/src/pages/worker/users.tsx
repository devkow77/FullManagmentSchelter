import { Container, Input, Label } from "@/components/ui";
import DashboardNavbar from "@/components/layout/admin/DashboardNavbar";
import { Button } from "@/components/ui";
import { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon } from "lucide-react";
import axios from "axios";
import { Link } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { DeleteUserDialog } from "@/components/ui";
import type { User } from "@/types/user";
import { MultiValueSelector } from "@/components/shared";
import {
  genderOptions,
  booleanFilterOptions,
} from "@/constants/user.constants";

const WorkerUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedGender, setSelectedGender] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string[]>([]);
  const [selectedIsBanned, setSelectedIsBanned] = useState<string[]>([]);
  const [selectedIsFormFilled, setSelectedIsFormFilled] = useState<string[]>(
    [],
  );

  const { user: loggedUser } = useAuth();
  const isAdmin = loggedUser?.role === "ADMINISTRATOR";

  const userCities = useMemo(() => {
    const cities = [
      ...new Set(users.map((u) => u.city).filter(Boolean)),
    ] as string[];
    return cities.map((city) => ({ label: city, value: city }));
  }, [users]);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await axios.get("/api/users");
        setUsers(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchWorkers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesGender =
        selectedGender.length === 0 || selectedGender.includes(user.gender);

      const matchesCity =
        selectedCity.length === 0 ||
        (user.city != null && selectedCity.includes(user.city));

      const matchesIsBanned =
        selectedIsBanned.length === 0 ||
        selectedIsBanned.includes(String(user.isBanned));

      const matchesIsFormFilled =
        selectedIsFormFilled.length === 0 ||
        selectedIsFormFilled.includes(String(user.isFormFilled));

      return (
        matchesSearch &&
        matchesGender &&
        matchesCity &&
        matchesIsBanned &&
        matchesIsFormFilled
      );
    });
  }, [
    users,
    searchQuery,
    selectedGender,
    selectedCity,
    selectedIsBanned,
    selectedIsFormFilled,
  ]);

  const resetFilters = () => {
    setSelectedGender([]);
    setSelectedCity([]);
    setSelectedIsBanned([]);
    setSelectedIsFormFilled([]);
    setSearchQuery("");
  };

  const handleDeleteUser = async (id: number) => {
    try {
      await axios.delete(`/api/users/${id}`);
      setUsers((prev) => prev.filter((a) => a.id !== id));
      toast.success("Pomyślnie usunięto użytkownika!");
    } catch (err) {
      console.error(err);
    }
  };

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
        <section id="table">
          <div className="top-0 z-2 flex flex-wrap items-center gap-4 bg-white py-4 sm:sticky">
            <div className="flex flex-row gap-x-2">
              <Label>Wyszukaj</Label>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Szukaj po imieniu..."
                className="h-7.5 placeholder:text-sm"
              />
            </div>

            <MultiValueSelector
              items={genderOptions}
              placeholder="Płeć"
              value={selectedGender}
              onValueChange={setSelectedGender}
            />

            <MultiValueSelector
              items={userCities}
              placeholder="Miasto"
              value={selectedCity}
              onValueChange={setSelectedCity}
            />

            <MultiValueSelector
              items={booleanFilterOptions}
              placeholder="Konto zablokowane"
              value={selectedIsBanned}
              onValueChange={setSelectedIsBanned}
            />

            <MultiValueSelector
              items={booleanFilterOptions}
              placeholder="Wypełniony formularz"
              value={selectedIsFormFilled}
              onValueChange={setSelectedIsFormFilled}
            />

            <Button onClick={resetFilters} variant="destructive">
              Resetuj filtry
            </Button>

            {isAdmin ? (
              <Button variant="success">
                <a href="/admin/uzytkownicy/dodaj">Dodaj użytkownika</a>
              </Button>
            ) : null}
          </div>

          <Table>
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
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
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
                  <TableCell>{user.gender}</TableCell>
                  <TableCell>{user.city ?? "—"}</TableCell>
                  <TableCell>{user.isBanned ? "Tak" : "Nie"}</TableCell>
                  <TableCell>{user.isFormFilled ? "Tak" : "Nie"}</TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString("pl-PL")} r.
                  </TableCell>
                  {isAdmin ? (
                    <TableCell className="text-right">
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
                            >
                              Edytuj dane
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DeleteUserDialog
                            userId={user.id}
                            onConfirm={handleDeleteUser}
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={isAdmin ? 7 : 6}>
                  Suma użytkowników
                </TableCell>
                <TableCell className="text-right">
                  {filteredUsers.length}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </section>
      </Container>
    </main>
  );
};

export default WorkerUsersPage;

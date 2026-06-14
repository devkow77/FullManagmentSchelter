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
import { formatUserRole, styleUserRole } from "@/lib/utils";
import { toast } from "sonner";
import { DeleteUserDialog } from "@/components/ui";
import { MultiValueSelector } from "@/components/shared";
import {
  workerRoleOptions,
  genderOptions,
  booleanFilterOptions,
} from "@/constants/user.constants";

import type { Worker } from "@/types/user";

const AdminWorkersPage = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>(""); // stan do przechowywania wartości wyszukiwania
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]); // stan do przechowywania wybranych typów pracowników
  const [selectedGender, setSelectedGender] = useState<string[]>([]); // stan do przechowywania wybranych płci
  const [selectedCity, setSelectedCity] = useState<string[]>([]);
  const [selectedHasChildren, setSelectedHasChildren] = useState<string[]>([]);
  const [selectedIsFormFilled, setSelectedIsFormFilled] = useState<string[]>(
    [],
  );

  const workerCities = useMemo(() => {
    const cities = [
      ...new Set(workers.map((w) => w.city).filter(Boolean)),
    ] as string[];
    return cities.map((city) => ({ label: city, value: city }));
  }, [workers]);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await axios.get("/api/users/workers");
        setWorkers(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchWorkers();
  }, []);

  const filteredWorkers = useMemo(() => {
    return workers.filter((worker) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        worker.fullName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRoles =
        selectedRoles.length === 0 || selectedRoles.includes(worker.role);

      const matchesGender =
        selectedGender.length === 0 || selectedGender.includes(worker.gender);

      const matchesCity =
        selectedCity.length === 0 || selectedCity.includes(worker.city);

      const matchesHasChildren =
        selectedHasChildren.length === 0 ||
        selectedHasChildren.includes(String(worker.hasChildren));

      const matchesIsFormFilled =
        selectedIsFormFilled.length === 0 ||
        selectedIsFormFilled.includes(String(worker.isFormFilled));

      return (
        matchesSearch &&
        matchesRoles &&
        matchesGender &&
        matchesCity &&
        matchesHasChildren &&
        matchesIsFormFilled
      );
    });
  }, [
    workers,
    searchQuery,
    selectedRoles,
    selectedGender,
    selectedCity,
    selectedHasChildren,
    selectedIsFormFilled,
  ]);

  // Funkcja do resetowania wszystkich filtrów
  const resetFilters = () => {
    setSelectedRoles([]);
    setSelectedGender([]);
    setSearchQuery("");
    setSelectedCity([]);
    setSelectedHasChildren([]);
    setSelectedIsFormFilled([]);
  };

  const handleDeleteWorker = async (id: number) => {
    try {
      await axios.delete(`/api/users/${id}`);
      setWorkers((prev) => prev.filter((a) => a.id !== id));
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
              Zarządzaj pracownikami
            </h1>
            <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
              W tym panelu znajdują się wszyscy pracownicy schroniska.
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
              items={workerRoleOptions}
              placeholder="Rola pracownika"
              value={selectedRoles}
              onValueChange={setSelectedRoles}
            />

            <MultiValueSelector
              items={genderOptions}
              placeholder="Płeć"
              value={selectedGender}
              onValueChange={setSelectedGender}
            />

            <MultiValueSelector
              items={workerCities}
              placeholder="Miasto"
              value={selectedCity}
              onValueChange={setSelectedCity}
            />

            <MultiValueSelector
              items={booleanFilterOptions}
              placeholder="Czy ma dzieci"
              value={selectedHasChildren}
              onValueChange={setSelectedHasChildren}
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

            <Button variant="success">
              <a href="/admin/uzytkownicy/dodaj">Dodaj użytkownika</a>
            </Button>
          </div>

          <Table>
            <TableCaption>Lista pracowników schroniska</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Imię i nazwisko</TableHead>
                <TableHead>Rola</TableHead>
                <TableHead>Płeć</TableHead>
                <TableHead>Miejsce zamieszkania</TableHead>
                <TableHead>Posiada dzieci</TableHead>
                <TableHead>Wypełniony formularz</TableHead>
                <TableHead>Pracuje od</TableHead>
                <TableHead className="text-right">Opcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkers.map((worker) => (
                <TableRow key={worker.id}>
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
                  <TableCell>{worker.gender}</TableCell>
                  <TableCell>{worker.city ?? "—"}</TableCell>
                  <TableCell>{worker.hasChildren ? "Tak" : "Nie"}</TableCell>
                  <TableCell>{worker.isFormFilled ? "Tak" : "Nie"}</TableCell>
                  <TableCell>
                    {new Date(worker.createdAt).toLocaleDateString("pl-PL")} r.
                  </TableCell>
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
                            to={`/admin/uzytkownicy/${worker.id}/edycja`}
                            state={{ returnTo: "/admin/pracownicy" }}
                          >
                            Edytuj dane
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DeleteUserDialog
                          userId={worker.id}
                          onConfirm={handleDeleteWorker}
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={7}>Suma pracowników</TableCell>
                <TableCell className="text-right">
                  {filteredWorkers.length}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </section>
      </Container>
    </main>
  );
};

export default AdminWorkersPage;

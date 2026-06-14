import { Container, DeleteAnimalDialog, Input, Label } from "@/components/ui";
import { toast } from "sonner";
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
import { Button } from "@/components/ui";
import { MoreHorizontalIcon } from "lucide-react";
import DashboardNavbar from "@/components/layout/admin/DashboardNavbar";
import axios from "axios";
import {
  formatAnimalStatus,
  formatAnimalHealthStatus,
  styleAnimalHealthStatus,
  styleAnimalStatus,
  formatAnimalGender,
  formatAnimalType,
} from "@/lib/utils";
import { MultiValueSelector, AgeSlider } from "@/components/shared";
import type { AnimalListItem } from "@/types/animal";
import {
  animalTypeOptions,
  animalGenderOptions,
  animalStatusOptions,
  animalSizeOptions,
  animalTraitOptions,
  animalHealthStatusOptions,
} from "@/constants/animal.constants";

const AdminAnimalsPage = () => {
  const [animals, setAnimals] = useState<AnimalListItem[]>([]);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>([]);
  const [selectedGender, setSelectedGender] = useState<string[]>([]);
  const [selectedStatutes, setSelectedStatutes] = useState<string[]>([]);
  const [selectedHealthStatus, setSelectedHealthStatus] = useState<string[]>(
    [],
  );
  const [selectedSize, setSelectedSize] = useState<string[]>([]);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 25]);

  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        const res = await axios.get("/api/animals");
        setAnimals(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchAnimals();
  }, []);

  const calculateAge = (dateOfBirth: string | Date) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();

    return today.getFullYear() - birthDate.getFullYear();
  };

  const filteredAnimals = useMemo(() => {
    return animals.filter((animal) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        animal.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        selectedAnimals.length === 0 || selectedAnimals.includes(animal.type);

      const matchesGender =
        selectedGender.length === 0 || selectedGender.includes(animal.gender);

      const matchesStatus =
        selectedStatutes.length === 0 ||
        selectedStatutes.includes(animal.status);

      const matchesHealthStatus =
        selectedHealthStatus.length === 0 ||
        selectedHealthStatus.includes(animal.healthStatus);

      const matchesSize =
        selectedSize.length === 0 || selectedSize.includes(animal.size);

      const matchesTraits =
        selectedTraits.length === 0 ||
        selectedTraits.every((t) => animal.traits.includes(t));

      const animalAge = calculateAge(animal.dateOfBirth);
      const matchesAge = animalAge >= ageRange[0] && animalAge <= ageRange[1];

      return (
        matchesSearch &&
        matchesType &&
        matchesGender &&
        matchesStatus &&
        matchesHealthStatus &&
        matchesSize &&
        matchesTraits &&
        matchesAge
      );
    });
  }, [
    animals,
    searchQuery,
    selectedAnimals,
    selectedGender,
    selectedStatutes,
    selectedHealthStatus,
    selectedSize,
    selectedTraits,
    ageRange,
  ]);

  const resetFilters = () => {
    setSelectedAnimals([]);
    setSelectedGender([]);
    setSelectedStatutes([]);
    setSelectedHealthStatus([]);
    setSelectedSize([]);
    setSelectedTraits([]);
    setAgeRange([0, 25]);
    setSearchQuery("");
  };

  const handleDeleteAnimal = async (id: number) => {
    try {
      await axios.delete(`/api/animals/${id}`);
      setAnimals((prev) => prev.filter((a) => a.id !== id));
      toast.success("Pomyślnie usunięto zwierzę!");
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
              Zarządzaj zwierzętami
            </h1>
            <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
              W tym panelu znajdują się wszystkie zwierzęta w schronisku.
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
              items={animalTypeOptions}
              placeholder="Gatunek"
              value={selectedAnimals}
              onValueChange={setSelectedAnimals}
            />

            <MultiValueSelector
              items={animalGenderOptions}
              placeholder="Płeć"
              value={selectedGender}
              onValueChange={setSelectedGender}
            />

            <MultiValueSelector
              items={animalStatusOptions}
              placeholder="Status"
              value={selectedStatutes}
              onValueChange={setSelectedStatutes}
            />

            <MultiValueSelector
              items={animalHealthStatusOptions}
              placeholder="Stan zdrowia"
              value={selectedHealthStatus}
              onValueChange={setSelectedHealthStatus}
            />

            <MultiValueSelector
              items={animalSizeOptions}
              placeholder="Rozmiar"
              value={selectedSize}
              onValueChange={setSelectedSize}
            />

            <MultiValueSelector
              items={animalTraitOptions}
              placeholder="Cechy"
              value={selectedTraits}
              onValueChange={setSelectedTraits}
            />

            <AgeSlider value={ageRange} onChange={setAgeRange} />

            <Button onClick={resetFilters} variant="destructive">
              Resetuj filtry
            </Button>

            <Button variant="success">
              <a href="/admin/zwierzeta/dodaj">Dodaj zwierzę</a>
            </Button>
          </div>

          <Table>
            <TableCaption>Lista zwierząt w schronisku</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Imię</TableHead>
                <TableHead>Gatunek</TableHead>
                <TableHead>Płeć</TableHead>
                <TableHead>Status adopcji</TableHead>
                <TableHead>Stan zdrowia</TableHead>
                <TableHead>Wiek (lat)</TableHead>
                <TableHead>Ilość zdjęć</TableHead>
                <TableHead className="text-right">Opcje</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredAnimals.map((animal) => (
                <TableRow key={animal.id}>
                  <TableCell className="flex items-center gap-x-4 font-medium">
                    {animal.imageUrl.length ? (
                      <img
                        src={animal.imageUrl[0]}
                        className="size-12 rounded-full object-cover"
                        alt={animal.name}
                      />
                    ) : (
                      <div className="size-12 rounded-full bg-gray-200" />
                    )}
                    {animal.name}
                  </TableCell>
                  <TableCell>{formatAnimalType[animal.type]}</TableCell>
                  <TableCell>{formatAnimalGender(animal.gender)}</TableCell>
                  <TableCell>
                    <span
                      className={`${styleAnimalStatus(
                        animal.status,
                      )} rounded-2xl px-4 py-2 text-xs`}
                    >
                      {formatAnimalStatus[animal.status]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`${styleAnimalHealthStatus(
                        animal.healthStatus,
                      )} rounded-2xl px-4 py-2 text-xs`}
                    >
                      {formatAnimalHealthStatus[animal.healthStatus]}
                    </span>
                  </TableCell>
                  <TableCell>
                    {calculateAge(animal.dateOfBirth) == 0
                      ? "Mniej niż rok"
                      : calculateAge(animal.dateOfBirth)}
                  </TableCell>
                  <TableCell>{animal.imageUrl.length} z 5</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="transparent" size="icon">
                          <MoreHorizontalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <a href={`/admin/zwierzeta/${animal.id}/edycja`}>
                            Edytuj dane
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DeleteAnimalDialog
                          animalId={animal.id}
                          onConfirm={handleDeleteAnimal}
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TableCell colSpan={7}>Suma zwierząt</TableCell>
                <TableCell className="text-right">
                  {filteredAnimals.length}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </section>
      </Container>
    </main>
  );
};

export default AdminAnimalsPage;

import {
  DeleteAnimalDialog,
  Input,
  Label,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { toast } from "sonner";
import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import axios from "axios";
import {
  formatAnimalStatus,
  formatAnimalHealthStatus,
  styleAnimalHealthStatus,
  styleAnimalStatus,
  formatAnimalGender,
  formatAnimalType,
  styleAnimalNeed,
  styleEmptyField,
  calculateAge,
} from "@/lib/utils";
import {
  MultiValueSelector,
  AgeSlider,
  AnimalAvatar,
  TablePagination,
  DashboardErrorState,
  DashboardTableSkeleton,
  TableRowActions,
  DashboardPage,
  FilterToolbar,
} from "@/components/shared";

import {
  animalTypeOptions,
  animalGenderOptions,
  animalStatusOptions,
  animalSizeOptions,
  animalTraitOptions,
  animalHealthStatusOptions,
} from "@/constants/animal.constants";

const PAGE_SIZE = 8;
const adminAnimalsQueryKey = ["admin-animals"] as const;

export type AnimalListItem = {
  id: number;
  name: string;
  type: string;
  gender: string;
  size: string;
  traits: string[];
  dateOfBirth: Date | string;
  status: string;
  healthStatus: string;
  imageUrl: string[];
  needsCount: number;
  nextVisitDate: Date | string;
  description: string;
};

type AnimalsPageResponse = {
  data: AnimalListItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

type AnimalsFilters = {
  search: string;
  types: string[];
  genders: string[];
  statuses: string[];
  healthStatuses: string[];
  sizes: string[];
  traits: string[];
  ageRange: [number, number];
};

const getAnimalsPage = async ({
  page,
  filters,
}: {
  page: number;
  filters: AnimalsFilters;
}) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });

  if (filters.search.trim()) {
    params.set("search", filters.search.trim());
  }
  if (filters.types.length > 0) {
    params.set("type", filters.types.join(","));
  }
  if (filters.genders.length > 0) {
    params.set("gender", filters.genders.join(","));
  }
  if (filters.statuses.length > 0) {
    params.set("status", filters.statuses.join(","));
  }
  if (filters.healthStatuses.length > 0) {
    params.set("healthStatus", filters.healthStatuses.join(","));
  }
  if (filters.sizes.length > 0) {
    params.set("size", filters.sizes.join(","));
  }
  if (filters.traits.length > 0) {
    params.set("traits", filters.traits.join(","));
  }
  if (filters.ageRange[0] !== 0 || filters.ageRange[1] !== 25) {
    params.set("ageMin", String(filters.ageRange[0]));
    params.set("ageMax", String(filters.ageRange[1]));
  }

  const res = await axios.get<AnimalsPageResponse>(
    `/api/animals?${params.toString()}`,
  );
  return res.data;
};

const formatNeedsCount = (count: number) => {
  if (count === 0) return "Brak";
  if (count === 1) return "1 rzecz";
  return `${count} rzeczy`;
};

const AdminAnimalsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>([]);
  const [selectedGender, setSelectedGender] = useState<string[]>([]);
  const [selectedStatutes, setSelectedStatutes] = useState<string[]>([]);
  const [selectedHealthStatus, setSelectedHealthStatus] = useState<string[]>(
    [],
  );
  const [selectedSize, setSelectedSize] = useState<string[]>([]);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 25]);

  const filters: AnimalsFilters = {
    search: searchQuery,
    types: selectedAnimals,
    genders: selectedGender,
    statuses: selectedStatutes,
    healthStatuses: selectedHealthStatus,
    sizes: selectedSize,
    traits: selectedTraits,
    ageRange,
  };

  const {
    data,
    isLoading = true,
    error,
    isFetching,
  } = useQuery({
    queryKey: [...adminAnimalsQueryKey, page, filters],
    queryFn: () => getAnimalsPage({ page, filters }),
    placeholderData: keepPreviousData,
  });

  const animals = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (page > totalPages) {
    setPage(totalPages);
  }

  const deleteAnimalMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`/api/animals/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminAnimalsQueryKey });
      toast.success("Pomyślnie usunięto zwierzę!");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Nie udało się usunąć zwierzęcia.");
    },
  });

  const resetFilters = () => {
    setSelectedAnimals([]);
    setSelectedGender([]);
    setSelectedStatutes([]);
    setSelectedHealthStatus([]);
    setSelectedSize([]);
    setSelectedTraits([]);
    setAgeRange([0, 25]);
    setSearchQuery("");
    setPage(1);
  };

  const handleFilterChange = <T,>(setter: (value: T) => void, value: T) => {
    setter(value);
    setPage(1);
  };

  const handleDeleteAnimal = (id: number) => {
    deleteAnimalMutation.mutate(id);
  };

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
  };

  return (
    <DashboardPage
      title="Zarządzaj zwierzętami"
      description="W tym panelu znajdują się wszystkie zwierzęta w schronisku."
    >
      {isLoading && (
        <DashboardTableSkeleton columns={9} showAvatar filters={11} />
      )}
      {error && (
        <DashboardErrorState
          title="Nie udało się załadować zwierząt"
          description="Wystąpił problem podczas pobierania listy zwierząt. Sprawdź połączenie z internetem i spróbuj ponownie."
        />
      )}

      {!isLoading && !error && (
        <section id="table">
          <FilterToolbar className="grid grid-cols-2 items-center md:sticky md:flex md:flex-wrap">
            <div className="col-span-2 flex flex-row items-center gap-x-2">
              <Label htmlFor="search-input">Wyszukaj</Label>
              <Input
                id="search-input"
                value={searchQuery}
                onChange={(e) =>
                  handleFilterChange(setSearchQuery, e.target.value)
                }
                placeholder="Szukaj po imieniu..."
              />
            </div>

            <MultiValueSelector
              items={animalTypeOptions}
              placeholder="Gatunek"
              value={selectedAnimals}
              onValueChange={(value) =>
                handleFilterChange(setSelectedAnimals, value)
              }
            />
            <MultiValueSelector
              items={animalGenderOptions}
              placeholder="Płeć"
              value={selectedGender}
              onValueChange={(value) =>
                handleFilterChange(setSelectedGender, value)
              }
            />
            <MultiValueSelector
              items={animalStatusOptions}
              placeholder="Status"
              value={selectedStatutes}
              onValueChange={(value) =>
                handleFilterChange(setSelectedStatutes, value)
              }
            />
            <MultiValueSelector
              items={animalHealthStatusOptions}
              placeholder="Stan zdrowia"
              value={selectedHealthStatus}
              onValueChange={(value) =>
                handleFilterChange(setSelectedHealthStatus, value)
              }
            />
            <MultiValueSelector
              items={animalSizeOptions}
              placeholder="Rozmiar"
              value={selectedSize}
              onValueChange={(value) =>
                handleFilterChange(setSelectedSize, value)
              }
            />
            <MultiValueSelector
              items={animalTraitOptions}
              placeholder="Cechy"
              value={selectedTraits}
              onValueChange={(value) =>
                handleFilterChange(setSelectedTraits, value)
              }
            />

            <AgeSlider
              value={ageRange}
              onChange={(value) => handleFilterChange(setAgeRange, value)}
            />

            <Button onClick={resetFilters} variant="destructive">
              Resetuj filtry
            </Button>

            <Button variant="success" asChild>
              <Link to="/admin/zwierzeta/dodaj">Dodaj zwierzę</Link>
            </Button>
          </FilterToolbar>
          <Table className={`${isFetching ? "opacity-60" : undefined}`}>
            <TableHeader>
              <TableRow>
                <TableHead>Imię</TableHead>
                <TableHead className="hidden sm:table-cell">Gatunek</TableHead>
                <TableHead className="hidden md:table-cell">Płeć</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Status adopcji
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  Stan zdrowia
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  Zapotrzebowanie
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  Data następnej wizyty
                </TableHead>
                <TableHead className="hidden sm:table-cell">Wiek</TableHead>
                <TableHead className="w-0 text-right">Opcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {animals.length ? (
                animals.map((animal) => (
                  <TableRow
                    key={animal.id}
                    className="w-full cursor-pointer"
                    onClick={() =>
                      navigate(`/admin/zwierzeta/${animal.id}/edycja`)
                    }
                  >
                    <TableCell className="align-middle font-medium">
                      <div className="flex items-center gap-x-4">
                        <AnimalAvatar
                          type={animal.type}
                          src={animal.imageUrl[0]}
                          alt={animal.name}
                        />
                        {animal.name}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {formatAnimalType[animal.type]}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatAnimalGender(animal.gender)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span
                        className={`${styleAnimalStatus(animal.status)} rounded-2xl px-4 py-2 text-xs`}
                      >
                        {formatAnimalStatus[animal.status]}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span
                        className={`${styleAnimalHealthStatus(animal.healthStatus)} rounded-2xl px-4 py-2 text-xs`}
                      >
                        {formatAnimalHealthStatus[animal.healthStatus]}
                      </span>
                    </TableCell>
                    <TableCell
                      className={`${styleAnimalNeed(animal.needsCount)} hidden md:table-cell`}
                    >
                      {formatNeedsCount(animal.needsCount)}
                    </TableCell>
                    <TableCell
                      className={`${styleEmptyField(animal.nextVisitDate)} hidden lg:table-cell`}
                    >
                      {animal.nextVisitDate
                        ? `${new Date(animal.nextVisitDate).toLocaleDateString()} r.`
                        : "Brak"}
                    </TableCell>

                    <TableCell className="hidden sm:table-cell">
                      {calculateAge(animal.dateOfBirth)}
                    </TableCell>
                    <TableCell
                      className="w-0 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <TableRowActions
                        editTo={`/admin/zwierzeta/${animal.id}/edycja`}
                        deleteSlot={
                          <DeleteAnimalDialog
                            animalId={animal.id}
                            onConfirm={handleDeleteAnimal}
                          />
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-5 text-center font-medium"
                  >
                    Brak zwierząt o podanych filtrach.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="bg-muted/50 border-t font-medium">
            <div className="p-2">
              <TablePagination
                page={page}
                totalPages={totalPages}
                onPageChange={goToPage}
              />
            </div>
            <div className="flex items-center justify-between border-t p-2">
              <span>Suma zwierząt</span>
              <span>{total}</span>
            </div>
          </div>
          <p className="text-muted-foreground mt-4 text-center text-sm">
            Lista zwierząt w schronisku
          </p>
        </section>
      )}
    </DashboardPage>
  );
};

export default AdminAnimalsPage;

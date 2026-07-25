import {
  Container,
  DeleteAnimalDialog,
  Input,
  Label,
  Button,
  Skeleton,
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
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
import { MoreHorizontalIcon, CircleAlert } from "lucide-react";
import DashboardNavbar from "@/components/layout/admin/DashboardNavbar";
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
import { MultiValueSelector, AgeSlider } from "@/components/shared";

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
        {isLoading && <LoadingAnimals />}
        {error && <ErrorAnimals />}
        {!isLoading && !error && (
          <section id="table">
            <div className="sticky top-0 z-10 grid grid-cols-2 items-center gap-4 bg-white py-4 md:flex md:flex-wrap">
              <div className="col-span-2 flex flex-row items-center gap-x-2">
                <Label htmlFor="search-input">Wyszukaj</Label>
                <Input
                  id="search-input"
                  value={searchQuery}
                  onChange={(e) =>
                    handleFilterChange(setSearchQuery, e.target.value)
                  }
                  placeholder="Szukaj po imieniu..."
                  className="h-8 placeholder:text-sm"
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
            </div>
            <Table className={isFetching ? "opacity-60" : undefined}>
              <TableCaption>Lista zwierząt w schronisku</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Imię</TableHead>
                  <TableHead>Gatunek</TableHead>
                  <TableHead>Płeć</TableHead>
                  <TableHead>Status adopcji</TableHead>
                  <TableHead>Stan zdrowia</TableHead>
                  <TableHead>Zapotrzebowanie</TableHead>
                  <TableHead>Data następnej wizyty</TableHead>
                  <TableHead>Wiek</TableHead>
                  <TableHead className="text-right">Opcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {animals.length ? (
                  animals.map((animal) => (
                    <TableRow
                      key={animal.id}
                      className="cursor-pointer"
                      onClick={() =>
                        navigate(`/admin/zwierzeta/${animal.id}/edycja`)
                      }
                    >
                      <TableCell className="flex items-center gap-x-4 font-medium">
                        {animal.imageUrl.length ? (
                          <img
                            src={animal.imageUrl[0]}
                            className="size-12 rounded-full object-cover"
                            alt={animal.name}
                            loading="lazy"
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
                          className={`${styleAnimalStatus(animal.status)} rounded-2xl px-4 py-2 text-xs`}
                        >
                          {formatAnimalStatus[animal.status]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`${styleAnimalHealthStatus(animal.healthStatus)} rounded-2xl px-4 py-2 text-xs`}
                        >
                          {formatAnimalHealthStatus[animal.healthStatus]}
                        </span>
                      </TableCell>
                      <TableCell className={styleAnimalNeed(animal.needsCount)}>
                        {formatNeedsCount(animal.needsCount)}
                      </TableCell>
                      <TableCell
                        className={styleEmptyField(animal.nextVisitDate)}
                      >
                        {animal.nextVisitDate
                          ? `${new Date(animal.nextVisitDate).toLocaleDateString()} r.`
                          : "Brak"}
                      </TableCell>

                      <TableCell>
                        {calculateAge(animal.dateOfBirth)}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="transparent" size="icon">
                              <MoreHorizontalIcon />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              asChild
                              className="cursor-pointer"
                            >
                              <Link to={`/admin/zwierzeta/${animal.id}/edycja`}>
                                Edytuj dane
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <div
                              onSelect={(e) => e.preventDefault()}
                              className="hover:bg-accent rounded-sm"
                            >
                              <DeleteAnimalDialog
                                animalId={animal.id}
                                onConfirm={handleDeleteAnimal}
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
                      colSpan={9}
                      className="py-5 text-center font-medium"
                    >
                      Brak zwierząt o podanych filtrach.
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
                  <TableCell colSpan={8}>Suma zwierząt</TableCell>
                  <TableCell className="text-right">{total}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </section>
        )}
      </Container>
    </main>
  );
};

// Nie udało się załadować zwierząt UI
const ErrorAnimals = () => {
  return (
    <section
      id="error"
      className="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center"
    >
      <CircleAlert className="size-12 text-red-600" />
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-red-900">
          Nie udało się załadować zwierząt
        </h2>
        <p className="max-w-md text-sm text-red-800 md:text-base">
          Wystąpił problem podczas pobierania listy zwierząt. Sprawdź połączenie
          z internetem i spróbuj ponownie.
        </p>
      </div>
    </section>
  );
};

// Ładowanie zwierząt UI
const LoadingAnimals = () => {
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

export default AdminAnimalsPage;

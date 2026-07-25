import {
  Container,
  Input,
  Label,
  Button,
  DeleteVetDialog,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  Skeleton,
  PaginationEllipsis,
  PaginationLink,
  PaginationNext,
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
} from "@/components/ui";
import DashboardNavbar from "@/components/layout/admin/DashboardNavbar";
import { useState, useMemo } from "react";
import { CircleAlert, MoreHorizontalIcon } from "lucide-react";
import axios from "axios";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { MultiValueSelector } from "@/components/shared";
import type { Vet } from "@/types/vet";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

const PAGE_SIZE = 8;
const adminVetsQueryKey = ["admin-vets"] as const;

type VetsPageResponse = {
  data: Vet[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

type VetsFilters = {
  search: string;
  clinics: string[];
};

const getVetsPage = async ({
  page,
  filters,
}: {
  page: number;
  filters: VetsFilters;
}) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });

  if (filters.search.trim()) {
    params.set("search", filters.search.trim());
  }
  if (filters.clinics.length > 0) {
    params.set("clinic", filters.clinics.join(","));
  }

  const res = await axios.get<VetsPageResponse>(
    `/api/vets?${params.toString()}`,
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

const AdminVetsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedClinics, setSelectedClinics] = useState<string[]>([]);

  const filters: VetsFilters = {
    search: searchQuery,
    clinics: selectedClinics,
  };

  const {
    data,
    isLoading = true,
    error,
    isFetching,
  } = useQuery({
    queryKey: [...adminVetsQueryKey, page, filters],
    queryFn: () => getVetsPage({ page, filters }),
    placeholderData: keepPreviousData,
  });

  const vets = useMemo(() => data?.data ?? [], [data?.data]);
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (page > totalPages) {
    setPage(totalPages);
  }

  const deleteVetMutation = useMutation({
    mutationFn: (id: number) =>
      axios.delete(`/api/vets/${id}`, { withCredentials: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminVetsQueryKey });
      toast.success("Pomyślnie usunięto weterynarza!");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Nie udało się usunąć weterynarza.");
    },
  });

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedClinics([]);
    setPage(1);
  };

  const handleFilterChange = <T,>(setter: (value: T) => void, value: T) => {
    setter(value);
    setPage(1);
  };

  const handleDeleteVet = (id: number) => {
    deleteVetMutation.mutate(id);
  };

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
  };

  const clinicOptions = useMemo(() => {
    const clinics = [
      ...new Set(vets.map((v) => v.clinic).filter(Boolean)),
    ] as string[];
    return clinics.map((clinic) => ({ label: clinic, value: clinic }));
  }, [vets]);

  return (
    <main>
      <Container className="mb-6 space-y-12 md:mb-10 md:space-y-16">
        <section id="info" className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-green-900 md:text-5xl">
              Zarządzaj weterynarzami
            </h1>
            <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
              W tym panelu znajdują się wszyscy weterynarze współpracujący ze
              schroniskiem.
            </p>
          </div>
          <DashboardNavbar />
        </section>
        {isLoading && <LoadingVets />}
        {error && <ErrorVets />}
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
                  placeholder="Szukaj po imieniu lub klinice..."
                  className="h-7.5 placeholder:text-sm"
                />
              </div>

              <MultiValueSelector
                items={clinicOptions}
                placeholder="Klinika"
                value={selectedClinics}
                onValueChange={(value) =>
                  handleFilterChange(setSelectedClinics, value)
                }
              />

              <Button onClick={resetFilters} variant="destructive">
                Resetuj filtry
              </Button>

              <Button variant="success" asChild>
                <Link to="/admin/weterynarze/dodaj">Dodaj weterynarza</Link>
              </Button>
            </div>

            <Table className={isFetching ? "opacity-60" : undefined}>
              <TableCaption>
                Lista weterynarzy współpracujących ze schroniskiem
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Imię i nazwisko</TableHead>
                  <TableHead>Klinika</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead className="text-right">Opcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vets.length ? (
                  vets.map((vet) => (
                    <TableRow
                      key={vet.id}
                      className="cursor-pointer"
                      onClick={() =>
                        navigate(`/admin/weterynarze/${vet.id}/edycja`)
                      }
                    >
                      <TableCell className="font-medium">{vet.name}</TableCell>
                      <TableCell>{vet.clinic}</TableCell>
                      <TableCell>
                        {vet.phone.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3")}
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
                                to={`/admin/weterynarze/${vet.id}/edycja`}
                                state={{ returnTo: "/admin/weterynarze" }}
                              >
                                Edytuj dane
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <div
                              onSelect={(e) => e.preventDefault()}
                              className="hover:bg-accent rounded-sm"
                            >
                              <DeleteVetDialog
                                vetId={vet.id}
                                onConfirm={handleDeleteVet}
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
                      colSpan={4}
                      className="py-5 text-center font-medium"
                    >
                      Brak weterynarzy o podanych filtrach.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4}>
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
                  <TableCell colSpan={3}>Suma weterynarzy</TableCell>
                  <TableCell className="text-right">{vets.length}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </section>
        )}
      </Container>
    </main>
  );
};

const ErrorVets = () => {
  return (
    <section
      id="error"
      className="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center"
    >
      <CircleAlert className="size-12 text-red-600" />
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-red-900">
          Nie udało się załadować weterynarzy
        </h2>
        <p className="max-w-md text-sm text-red-800 md:text-base">
          Wystąpił problem podczas pobierania listy weterynarzy. Sprawdź
          połączenie z internetem i spróbuj ponownie.
        </p>
      </div>
    </section>
  );
};

const LoadingVets = () => {
  return (
    <section id="table" className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 py-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-40" />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: 4 }).map((_, index) => (
              <TableHead key={index}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: 3 }).map((_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <Skeleton className="h-4 w-24" />
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

export default AdminVetsPage;

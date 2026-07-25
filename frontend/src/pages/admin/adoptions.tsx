import {
  Container,
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationEllipsis,
  PaginationLink,
  PaginationNext,
  Skeleton,
} from "@/components/ui";
import { useState, useMemo } from "react";
import { CircleAlert, MoreHorizontalIcon } from "lucide-react";
import DashboardNavbar from "@/components/layout/admin/DashboardNavbar";
import axios from "axios";
import { formatAdoptionStatus, styleAdoptionStatus } from "@/lib/utils";
import type { Adoption } from "@/types/adoption";
import { MultiValueSelector } from "@/components/shared";
import { adoptionStatusOptions } from "@/constants/adoption.constants";
import { useNavigate, Link } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

const PAGE_SIZE = 10;
const adminAdoptionsQueryKey = ["admin-adoptions"] as const;

type AdoptionsPageResponse = {
  data: Adoption[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

type AdoptionsFilters = {
  statuses: string[];
};

const getAdoptionsPage = async ({
  page,
  filters,
}: {
  page: number;
  filters: AdoptionsFilters;
}) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });

  if (filters.statuses.length > 0) {
    params.set("status", filters.statuses.join(","));
  }

  const res = await axios.get<AdoptionsPageResponse>(
    `/api/adoptions?${params.toString()}`,
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

const AdminAdoptionsPage = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [selectedStatutes, setSelectedStatutes] = useState<string[]>([
    "OCZEKUJACA",
  ]);

  const filters: AdoptionsFilters = {
    statuses: selectedStatutes,
  };

  const {
    data,
    isLoading = true,
    error,
    isFetching,
  } = useQuery({
    queryKey: [...adminAdoptionsQueryKey, page, filters],
    queryFn: () => getAdoptionsPage({ page, filters }),
    placeholderData: keepPreviousData,
  });

  const adoptions = useMemo(() => data?.data ?? [], [data?.data]);
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (page > totalPages) {
    setPage(totalPages);
  }

  const resetFilters = () => {
    setSelectedStatutes([]);
    setPage(1);
  };

  const handleFilterChange = <T,>(setter: (value: T) => void, value: T) => {
    setter(value);
    setPage(1);
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
              Zarządzaj adopcjami
            </h1>
            <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
              W tym panelu znajdują się wszystkie adopcje użytkowników.
            </p>
          </div>
          <DashboardNavbar />
        </section>

        {isLoading && <LoadingAdoptions />}
        {error && <ErrorAdoptions />}
        {!isLoading && !error && (
          <section id="table">
            <div className="top-0 z-2 flex flex-wrap items-center gap-4 bg-white py-4 sm:sticky">
              <div className="flex flex-row gap-x-2">
                <Label>Wyszukaj po statusie</Label>
                <MultiValueSelector
                  items={adoptionStatusOptions}
                  placeholder="Status"
                  value={selectedStatutes}
                  onValueChange={(value) =>
                    handleFilterChange(setSelectedStatutes, value)
                  }
                />
              </div>

              <Button onClick={resetFilters} variant="destructive">
                Resetuj filtry
              </Button>
            </div>

            <Table className={isFetching ? "opacity-60" : undefined}>
              <TableCaption>Lista adopcji w schronisku</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Użytkownik</TableHead>
                  <TableHead>Zwierzę</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Wiadomość użytkownika</TableHead>
                  <TableHead>Wiadomość pracownika</TableHead>
                  <TableHead className="text-right">Opcje</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {adoptions.length ? (
                  adoptions.map((adoption) => (
                    <TableRow
                      key={adoption.id}
                      className="cursor-pointer"
                      onClick={() =>
                        navigate(`/pracownik/adopcje/${adoption.id}/edycja`)
                      }
                    >
                      <TableCell>{adoption.user.fullName}</TableCell>
                      <TableCell>{adoption.animal.name}</TableCell>
                      <TableCell>
                        <span
                          className={`${styleAdoptionStatus(adoption.status)} rounded-2xl px-4 py-2 text-xs`}
                        >
                          {formatAdoptionStatus[adoption.status]}
                        </span>
                      </TableCell>
                      <TableCell>
                        {adoption.message?.slice(0, 30).concat("...") ?? "Brak"}
                      </TableCell>
                      <TableCell>
                        {adoption.employeeNote?.slice(0, 30).concat("...") ??
                          "Brak"}
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
                            <DropdownMenuItem asChild>
                              <Link
                                to={`/pracownik/adopcje/${adoption.id}/edycja`}
                              >
                                Szczegóły
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-5 text-center font-medium"
                    >
                      Brak adopcji o podanych filtrach.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>

              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6}>
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
                  <TableCell colSpan={5}>Suma adopcji</TableCell>
                  <TableCell className="text-right">
                    {adoptions.length}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </section>
        )}
      </Container>
    </main>
  );
};

const ErrorAdoptions = () => {
  return (
    <section
      id="error"
      className="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center"
    >
      <CircleAlert className="size-12 text-red-600" />
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-red-900">
          Nie udało się załadować adopcji
        </h2>
        <p className="max-w-md text-sm text-red-800 md:text-base">
          Wystąpił problem podczas pobierania listy adopcji. Sprawdź połączenie
          z internetem i spróbuj ponownie.
        </p>
      </div>
    </section>
  );
};

const LoadingAdoptions = () => {
  return (
    <section id="table" className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 py-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-36" />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: 6 }).map((_, index) => (
              <TableHead key={index}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: 5 }).map((_, cellIndex) => (
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

export default AdminAdoptionsPage;

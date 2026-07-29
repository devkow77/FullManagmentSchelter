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
} from "@/components/ui";
import { useState, useMemo } from "react";
import DashboardNavbar from "@/components/layout/admin/DashboardNavbar";
import axios from "axios";
import { formatAdoptionStatus, styleAdoptionStatus } from "@/lib/utils";
import type { Adoption } from "@/types/adoption";
import {
  MultiValueSelector,
  TablePagination,
  DashboardErrorState,
  DashboardTableSkeleton,
  TableRowActions,
} from "@/components/shared";
import { adoptionStatusOptions } from "@/constants/adoption.constants";
import { useNavigate } from "react-router";
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

        {isLoading && (
          <DashboardTableSkeleton columns={6} filters={3} rows={8} />
        )}
        {error && (
          <DashboardErrorState
            title="Nie udało się załadować adopcji"
            description="Wystąpił problem podczas pobierania listy adopcji. Sprawdź połączenie z internetem i spróbuj ponownie."
          />
        )}
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
                        <TableRowActions
                          editTo={`/pracownik/adopcje/${adoption.id}/edycja`}
                          editLabel="Szczegóły"
                        />
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
                    <TablePagination
                      page={page}
                      totalPages={totalPages}
                      onPageChange={goToPage}
                    />
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

export default AdminAdoptionsPage;

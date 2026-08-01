import {
  Label,
  Button,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { useState, useMemo } from "react";
import axios from "axios";
import { formatAdoptionStatus, styleAdoptionStatus } from "@/lib/utils";
import type { Adoption } from "@/types/adoption";
import {
  MultiValueSelector,
  DashboardTableFooter,
  DashboardErrorState,
  DashboardTableSkeleton,
  TableRowActions,
  DashboardPage,
  FilterToolbar,
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
    <DashboardPage
      title="Zarządzaj adopcjami"
      description="W tym panelu znajdują się wszystkie adopcje użytkowników."
    >
      {isLoading && <DashboardTableSkeleton columns={6} filters={3} rows={8} />}
      {error && (
        <DashboardErrorState
          title="Nie udało się załadować adopcji"
          description="Wystąpił problem podczas pobierania listy adopcji. Sprawdź połączenie z internetem i spróbuj ponownie."
        />
      )}
      {!isLoading && !error && (
        <section id="table">
          <FilterToolbar className="grid grid-cols-1 items-center sm:grid-cols-2 md:sticky md:flex md:flex-wrap">
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
          </FilterToolbar>

          <Table className={isFetching ? "opacity-60" : undefined}>
            <TableCaption>Lista adopcji w schronisku</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Użytkownik</TableHead>
                <TableHead className="hidden sm:table-cell">Zwierzę</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Wiadomość użytkownika
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  Wiadomość pracownika
                </TableHead>
                <TableHead className="w-0 text-right">Opcje</TableHead>
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
                    <TableCell className="hidden sm:table-cell">
                      {adoption.animal.name}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span
                        className={`${styleAdoptionStatus(adoption.status)} rounded-2xl px-4 py-2 text-xs`}
                      >
                        {formatAdoptionStatus[adoption.status]}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {adoption.message?.slice(0, 30).concat("...") ?? "Brak"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {adoption.employeeNote?.slice(0, 30).concat("...") ??
                        "Brak"}
                    </TableCell>
                    <TableCell
                      className="w-0 text-right"
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

            <DashboardTableFooter
              columns={["always", "sm", "sm", "lg", "lg", "always"]}
              page={page}
              totalPages={totalPages}
              onPageChange={goToPage}
              sumLabel="Suma adopcji"
              sumValue={adoptions.length}
            />
          </Table>
        </section>
      )}
    </DashboardPage>
  );
};

export default AdminAdoptionsPage;

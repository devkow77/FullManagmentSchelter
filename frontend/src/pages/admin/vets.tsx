import {
  Input,
  Label,
  Button,
  DeleteVetDialog,
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
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  MultiValueSelector,
  DashboardTableFooter,
  DashboardErrorState,
  DashboardTableSkeleton,
  TableRowActions,
  DashboardPage,
  FilterToolbar,
} from "@/components/shared";
import type { PaginatedResponse, Vet } from "@/types";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

const PAGE_SIZE = 8;
const adminVetsQueryKey = ["admin-vets"] as const;

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

  const res = await axios.get<PaginatedResponse<Vet>>(
    `/api/vets?${params.toString()}`,
  );
  return res.data;
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
    <DashboardPage
      title="Zarządzaj weterynarzami"
      description="W tym panelu znajdują się wszyscy weterynarze współpracujący ze schroniskiem."
    >
      {isLoading && <DashboardTableSkeleton columns={4} filters={4} rows={8} />}
      {error && (
        <DashboardErrorState
          title="Nie udało się załadować weterynarzy"
          description="Wystąpił problem podczas pobierania listy weterynarzy. Sprawdź połączenie z internetem i spróbuj ponownie."
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

            <Button
              variant="success"
              asChild
              className="col-span-2 sm:col-span-1"
            >
              <Link to="/admin/weterynarze/dodaj">Dodaj weterynarza</Link>
            </Button>
          </FilterToolbar>

          <Table className={isFetching ? "opacity-60" : undefined}>
            <TableCaption>
              Lista weterynarzy współpracujących ze schroniskiem
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Imię i nazwisko</TableHead>
                <TableHead className="hidden md:table-cell">Klinika</TableHead>
                <TableHead className="hidden sm:table-cell">Telefon</TableHead>
                <TableHead className="w-0 text-right">Opcje</TableHead>
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
                    <TableCell className="hidden md:table-cell">
                      {vet.clinic}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {vet.phone.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3")}
                    </TableCell>
                    <TableCell
                      className="w-0 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <TableRowActions
                        editTo={`/admin/weterynarze/${vet.id}/edycja`}
                        deleteSlot={
                          <DeleteVetDialog
                            vetId={vet.id}
                            onConfirm={handleDeleteVet}
                          />
                        }
                      />
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
            <DashboardTableFooter
              columns={["always", "md", "sm", "always"]}
              page={page}
              totalPages={totalPages}
              onPageChange={goToPage}
              sumLabel="Suma weterynarzy"
              sumValue={vets.length}
            />
          </Table>
        </section>
      )}
    </DashboardPage>
  );
};

export default AdminVetsPage;

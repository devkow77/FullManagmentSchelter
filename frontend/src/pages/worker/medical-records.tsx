import {
  DeleteMedicalRecordDialog,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Input,
  Label,
} from "@/components/ui";
import { useState, useMemo } from "react";
import axios from "axios";
import {
  styleMedicalRecordStatus,
  styleMedicalRecordType,
  formatMedicalRecordStatus,
  formatMedicalRecordType,
  formatAnimalType,
} from "@/lib/utils";
import {
  MultiValueSelector,
  TablePagination,
  DashboardErrorState,
  DashboardTableSkeleton,
  TableRowActions,
  DashboardPage,
  FilterToolbar,
} from "@/components/shared";
import type { MedicalRecord } from "@/types/medical-record";
import {
  medicalRecordAnimalTypeOptions,
  medicalRecordTypeOptions,
  medicalRecordStatusOptions,
} from "@/constants/medical-record.constants";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link } from "react-router";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

const PAGE_SIZE = 10;
const medicalRecordsQueryKey = ["medical-records"] as const;

type MedicalRecordsPageResponse = {
  data: MedicalRecord[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

type MedicalRecordsFilters = {
  search: string;
  animalTypes: string[];
  types: string[];
  statuses: string[];
};

const getMedicalRecordsPage = async ({
  page,
  filters,
}: {
  page: number;
  filters: MedicalRecordsFilters;
}) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });

  if (filters.search.trim()) {
    params.set("search", filters.search.trim());
  }
  if (filters.animalTypes.length > 0) {
    params.set("animalType", filters.animalTypes.join(","));
  }
  if (filters.types.length > 0) {
    params.set("type", filters.types.join(","));
  }
  if (filters.statuses.length > 0) {
    params.set("status", filters.statuses.join(","));
  }

  const res = await axios.get<MedicalRecordsPageResponse>(
    `/api/medical-records?${params.toString()}`,
  );
  return res.data;
};

const MedicalRecordsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [searchClinicName, setSearchClinicName] = useState<string>("");
  const [selectedAnimalType, setSelectedAnimalType] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);

  const filters: MedicalRecordsFilters = {
    search: searchClinicName,
    animalTypes: selectedAnimalType,
    types: selectedTypes,
    statuses: selectedStatus,
  };

  const {
    data,
    isLoading = true,
    error,
    isFetching,
  } = useQuery({
    queryKey: [...medicalRecordsQueryKey, page, filters],
    queryFn: () => getMedicalRecordsPage({ page, filters }),
    placeholderData: keepPreviousData,
  });

  const medicalRecords = useMemo(() => data?.data ?? [], [data?.data]);
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (page > totalPages) {
    setPage(totalPages);
  }

  const deleteMedicalRecordMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`/api/medical-records/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: medicalRecordsQueryKey });
      toast.success("Pomyślnie usunięto raport medyczny!");
    },
    onError: (err) => {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data.msg);
      } else {
        toast.error("Wystąpił błąd podczas usuwania raportu medycznego!");
      }
    },
  });

  const resetFilters = () => {
    setSearchClinicName("");
    setSelectedAnimalType([]);
    setSelectedTypes([]);
    setSelectedStatus([]);
    setPage(1);
  };

  const handleFilterChange = <T,>(setter: (value: T) => void, value: T) => {
    setter(value);
    setPage(1);
  };

  const handleDeleteMedicalRecord = (id: number) => {
    deleteMedicalRecordMutation.mutate(id);
  };

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
  };

  return (
    <DashboardPage
      title="Raporty medyczne"
      description="W tym panelu znajdują się wszystkie raporty medyczne zwierząt w schronisku."
    >
      {isLoading && <DashboardTableSkeleton columns={8} filters={6} rows={8} />}
      {error && (
        <DashboardErrorState
          title="Nie udało się załadować raportów medycznych"
          description="Wystąpił problem podczas pobierania listy raportów. Sprawdź połączenie z internetem i spróbuj ponownie."
        />
      )}
      {!isLoading && !error && (
        <section id="table">
          <FilterToolbar className="grid grid-cols-2 items-center md:sticky md:flex md:flex-wrap">
            <div className="col-span-2 flex flex-row gap-x-2 sm:col-span-1">
              <Label>Wyszukaj</Label>
              <Input
                value={searchClinicName}
                onChange={(e) =>
                  handleFilterChange(setSearchClinicName, e.target.value)
                }
                placeholder="Podaj nazwę kliniki..."
              />
            </div>

            <MultiValueSelector
              items={medicalRecordAnimalTypeOptions}
              placeholder="Gatunek zwierzęcia"
              value={selectedAnimalType}
              onValueChange={(value) =>
                handleFilterChange(setSelectedAnimalType, value)
              }
            />

            <MultiValueSelector
              items={medicalRecordTypeOptions}
              placeholder="Typ raportu"
              value={selectedTypes}
              onValueChange={(value) =>
                handleFilterChange(setSelectedTypes, value)
              }
            />

            <MultiValueSelector
              items={medicalRecordStatusOptions}
              placeholder="Status realizacji"
              value={selectedStatus}
              onValueChange={(value) =>
                handleFilterChange(setSelectedStatus, value)
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
              <Link to="/pracownik/raporty-medyczne/dodaj">Dodaj raport</Link>
            </Button>
          </FilterToolbar>

          <Table className={isFetching ? "opacity-60" : undefined}>
            <TableCaption>Lista raportów medycznych w schronisku</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Weterynarz</TableHead>
                <TableHead className="hidden sm:table-cell">Zwierzę</TableHead>
                <TableHead className="hidden md:table-cell">Gatunek</TableHead>
                <TableHead className="hidden md:table-cell">
                  Typ raportu
                </TableHead>
                <TableHead className="hidden lg:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">
                  Data wizyty
                </TableHead>
                <TableHead className="hidden lg:table-cell">Koszt</TableHead>
                <TableHead className="w-0 text-right">Opcje</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {medicalRecords.length ? (
                medicalRecords.map((medicalRecord) => (
                  <TableRow
                    key={medicalRecord.id}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate(
                        `/pracownik/raporty-medyczne/${medicalRecord.id}/edycja`,
                      )
                    }
                  >
                    <TableCell>
                      <span className="font-medium">
                        {medicalRecord.vet.name}
                      </span>{" "}
                      <br />
                      <span className="text-wrap">
                        {medicalRecord.vet.clinic}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {medicalRecord.animal.name}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatAnimalType[medicalRecord.animal.type]}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span
                        className={`${styleMedicalRecordType(medicalRecord.type)} rounded-2xl px-4 py-2 text-xs`}
                      >
                        {formatMedicalRecordType[medicalRecord.type]}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span
                        className={`${styleMedicalRecordStatus(medicalRecord.status)} rounded-2xl px-4 py-2 text-xs`}
                      >
                        {formatMedicalRecordStatus[medicalRecord.status]}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(medicalRecord.date).toLocaleDateString(
                        "pl-PL",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        },
                      )}{" "}
                      r.
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {medicalRecord.cost} zł
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <TableRowActions
                        editTo={`/pracownik/raporty-medyczne/${medicalRecord.id}/edycja`}
                        editLabel="Szczegóły"
                        deleteSlot={
                          user?.role === "ADMINISTRATOR" ? (
                            <DeleteMedicalRecordDialog
                              medicalRecordId={medicalRecord.id}
                              onConfirm={handleDeleteMedicalRecord}
                            />
                          ) : undefined
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-5 text-center font-medium"
                  >
                    Brak raportów medycznych o podanych filtrach.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TableCell colSpan={8}>
                  <TablePagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={7}>Suma raportów</TableCell>
                <TableCell className="text-right">
                  {medicalRecords.length}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </section>
      )}
    </DashboardPage>
  );
};

export default MedicalRecordsPage;

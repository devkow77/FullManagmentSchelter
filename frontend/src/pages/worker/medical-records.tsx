import {
  Container,
  DeleteMedicalRecordDialog,
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
  Button,
  Input,
  Label,
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
import {
  styleMedicalRecordStatus,
  styleMedicalRecordType,
  formatMedicalRecordStatus,
  formatMedicalRecordType,
  formatAnimalType,
} from "@/lib/utils";
import { MultiValueSelector } from "@/components/shared";
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
    <main>
      <Container className="mb-6 space-y-12 md:mb-10 md:space-y-16">
        <section id="info" className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-green-900 md:text-5xl">
              Raporty medyczne
            </h1>
            <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
              W tym panelu znajdują się wszystkie raporty medyczne zwierząt w
              schronisku.
            </p>
          </div>
          <DashboardNavbar />
        </section>

        {isLoading && <LoadingMedicalRecords />}
        {error && <ErrorMedicalRecords />}
        {!isLoading && !error && (
          <section id="table">
            <div className="top-0 z-2 flex flex-wrap items-center gap-4 bg-white py-4 sm:sticky">
              <div className="flex flex-row gap-x-2">
                <Label>Wyszukaj</Label>
                <Input
                  value={searchClinicName}
                  onChange={(e) =>
                    handleFilterChange(setSearchClinicName, e.target.value)
                  }
                  placeholder="Podaj nazwę kliniki..."
                  className="h-7.5 placeholder:text-sm"
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

              <Button variant="success" asChild>
                <Link to="/pracownik/raporty-medyczne/dodaj">Dodaj raport</Link>
              </Button>
            </div>

            <Table className={isFetching ? "opacity-60" : undefined}>
              <TableCaption>
                Lista raportów medycznych w schronisku
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Weterynarz</TableHead>
                  <TableHead>Zwierzę</TableHead>
                  <TableHead>Gatunek</TableHead>
                  <TableHead>Typ raportu</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data wizyty</TableHead>
                  <TableHead>Koszt</TableHead>
                  <TableHead className="text-right">Opcje</TableHead>
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
                        {medicalRecord.vet.clinic}
                      </TableCell>
                      <TableCell>{medicalRecord.animal.name}</TableCell>
                      <TableCell>
                        {formatAnimalType[medicalRecord.animal.type]}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`${styleMedicalRecordType(medicalRecord.type)} rounded-2xl px-4 py-2 text-xs`}
                        >
                          {formatMedicalRecordType[medicalRecord.type]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`${styleMedicalRecordStatus(medicalRecord.status)} rounded-2xl px-4 py-2 text-xs`}
                        >
                          {formatMedicalRecordStatus[medicalRecord.status]}
                        </span>
                      </TableCell>
                      <TableCell>
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
                      <TableCell>{medicalRecord.cost} zł</TableCell>
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
                                to={`/pracownik/raporty-medyczne/${medicalRecord.id}/edycja`}
                              >
                                Szczegóły
                              </Link>
                            </DropdownMenuItem>
                            {user?.role === "ADMINISTRATOR" && (
                              <>
                                <DropdownMenuSeparator />
                                <div className="hover:bg-accent rounded-sm">
                                  <DeleteMedicalRecordDialog
                                    medicalRecordId={medicalRecord.id}
                                    onConfirm={handleDeleteMedicalRecord}
                                  />
                                </div>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                  <TableCell colSpan={7}>Suma raportów</TableCell>
                  <TableCell className="text-right">
                    {medicalRecords.length}
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

const ErrorMedicalRecords = () => {
  return (
    <section
      id="error"
      className="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center"
    >
      <CircleAlert className="size-12 text-red-600" />
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-red-900">
          Nie udało się załadować raportów medycznych
        </h2>
        <p className="max-w-md text-sm text-red-800 md:text-base">
          Wystąpił problem podczas pobierania listy raportów. Sprawdź połączenie
          z internetem i spróbuj ponownie.
        </p>
      </div>
    </section>
  );
};

const LoadingMedicalRecords = () => {
  return (
    <section id="table" className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 py-4">
        <Skeleton className="h-9 w-48" />
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-28" />
        ))}
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
              {Array.from({ length: 7 }).map((_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <Skeleton className="h-4 w-20" />
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

export default MedicalRecordsPage;

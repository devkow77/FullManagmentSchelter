import {
  Container,
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
  Input,
} from "@/components/ui";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  useInfiniteQuery,
  keepPreviousData,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { CircleAlert, Loader2 } from "lucide-react";
import axios from "axios";
import { SingleValueSelector } from "@/components/shared";
import DashboardNavbar from "@/components/layout/admin/DashboardNavbar";

const dailyCareStatusQueryKey = ["animals", "daily-care-status"] as const;

const PAGE_SIZE = 8;

const CARE_STATUS_OPTIONS = ["Wykonano", "Niewykonano"] as const;
type CareStatusLabel = (typeof CARE_STATUS_OPTIONS)[number];

const careStatusToParam = (
  label: CareStatusLabel | null,
): "complete" | "incomplete" | null => {
  if (label === "Wykonano") return "complete";
  if (label === "Niewykonano") return "incomplete";
  return null;
};

type CareUser = {
  id: number;
  fullName: string;
} | null;

type TodayCare = {
  fed: boolean;
  watered: boolean;
  cleaned: boolean;
  fedBy: CareUser;
  wateredBy: CareUser;
  cleanedBy: CareUser;
};

type CareField = "fed" | "watered" | "cleaned";

export type AnimalListItem = {
  id: number;
  name: string;
  gender: string;
  cageNumber: string;
  imageUrl: string[];
  todayCare: TodayCare;
};

type AnimalsPageResponse = {
  data: AnimalListItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

type Filters = {
  careStatus: CareStatusLabel | null;
};

interface PageParams {
  pageParam: number;
  filters: Filters;
}

const emptyCare = (): TodayCare => ({
  fed: false,
  watered: false,
  cleaned: false,
  fedBy: null,
  wateredBy: null,
  cleanedBy: null,
});

const isCareComplete = (care: TodayCare) =>
  care.fed && care.watered && care.cleaned;

const getAnimalsPage = async ({ pageParam, filters }: PageParams) => {
  const params = new URLSearchParams({
    page: String(pageParam),
    limit: String(PAGE_SIZE),
    dailyCare: "true",
  });

  const careStatus = careStatusToParam(filters.careStatus);
  if (careStatus) {
    params.set("dailyCareStatus", careStatus);
  }

  const res = await axios.get<AnimalsPageResponse>(
    `/api/animals?${params.toString()}`,
  );
  return res.data;
};

const updateDailyCare = async ({
  animalId,
  field,
  value,
}: {
  animalId: number;
  field: CareField;
  value: boolean;
}) => {
  const res = await axios.patch<TodayCare>(
    `/api/animals/${animalId}/daily-care`,
    { field, value },
    { withCredentials: true },
  );
  return res.data;
};

const getPerformersLabel = (care: TodayCare) => {
  const names = [care.fedBy, care.wateredBy, care.cleanedBy]
    .filter((user): user is NonNullable<CareUser> => user !== null)
    .map((user) => user.fullName);

  return [...new Set(names)].join(", ") || "—";
};

const DailyAnimalNeedsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [careStatus, setCareStatus] = useState<CareStatusLabel | null>(null);
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());

  const filters: Filters = useMemo(
    () => ({
      careStatus,
    }),
    [careStatus],
  );

  const queryKey = ["daily-animal-needs", filters] as const;

  const {
    data,
    isPending,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => getAnimalsPage({ pageParam, filters }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    placeholderData: keepPreviousData,
  });

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isFiltering = isFetching && !isFetchingNextPage && !isPending;

  const careMutation = useMutation({
    mutationFn: updateDailyCare,
    onMutate: async ({ animalId, field }) => {
      const key = `${animalId}-${field}`;
      setPendingKeys((prev) => new Set(prev).add(key));
      await queryClient.cancelQueries({ queryKey });
    },
    onSuccess: (todayCare, { animalId }) => {
      const activeStatus = careStatusToParam(careStatus);
      const matchesFilter =
        activeStatus === null ||
        (activeStatus === "complete"
          ? isCareComplete(todayCare)
          : !isCareComplete(todayCare));

      void queryClient.invalidateQueries({ queryKey: dailyCareStatusQueryKey });

      if (!matchesFilter) {
        void queryClient.invalidateQueries({ queryKey });
        return;
      }

      queryClient.setQueryData<InfiniteData<AnimalsPageResponse>>(
        queryKey,
        (old) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((animal) =>
                animal.id === animalId ? { ...animal, todayCare } : animal,
              ),
            })),
          };
        },
      );
    },
    onSettled: (_data, _error, { animalId, field }) => {
      const key = `${animalId}-${field}`;
      setPendingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    },
  });

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const animals = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );
  const total = data?.pages[0]?.total ?? 0;

  const resetFilters = () => {
    setCareStatus(null);
  };

  const handleCareToggle = (
    animalId: number,
    field: CareField,
    value: boolean,
  ) => {
    careMutation.mutate({ animalId, field, value });
  };

  return (
    <main>
      <Container className="mb-6 space-y-12 md:mb-10 md:space-y-16">
        <section id="info" className="space-y-6 lg:space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-green-900 md:text-5xl">
              Codzienne obowiązki pracowników
            </h1>
            <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
              W tym panelu znajdują się codzienne obowiązki pracowników. <br />
              Lista wykonanych zadań na dzień:{" "}
              {new Date().toLocaleDateString("pl-PL")} r.
            </p>
          </div>
          <DashboardNavbar />
          {isPending && <LoadingAnimals />}
          {isError && <ErrorAnimals />}
          {!isPending && !isError && (
            <div id="table">
              <div className="sticky top-0 z-10 grid grid-cols-2 items-center gap-4 bg-white py-4 md:flex md:flex-wrap">
                <div className="col-span-2 flex flex-row items-center gap-x-2">
                  <Label htmlFor="care-status-filter">Status wykonania</Label>
                  <SingleValueSelector
                    items={[...CARE_STATUS_OPTIONS]}
                    placeholder="Wybierz"
                    value={careStatus}
                    onValueChange={(value) =>
                      setCareStatus(value as CareStatusLabel | null)
                    }
                  />
                </div>

                <Button onClick={resetFilters} variant="destructive">
                  Resetuj filtry
                </Button>
                {isFiltering && (
                  <span className="flex items-center gap-2 text-sm text-green-900">
                    <Loader2 className="size-4 animate-spin" />
                    Filtrowanie...
                  </span>
                )}
              </div>
              <Table className={isFiltering ? "opacity-60" : ""}>
                <TableCaption>Lista zwierząt w schronisku</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imię</TableHead>
                    <TableHead>Numer klatki</TableHead>
                    <TableHead>Jedzenie</TableHead>
                    <TableHead>Woda</TableHead>
                    <TableHead>Sprzątanie</TableHead>
                    <TableHead>Wykonał</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {animals.length ? (
                    animals.map((animal) => {
                      const care = animal.todayCare ?? emptyCare();

                      return (
                        <TableRow
                          key={animal.id}
                          className="cursor-pointer"
                          onClick={() => navigate(`/zwierzeta/${animal.id}`)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-x-4">
                              {animal.imageUrl.length ? (
                                <img
                                  src={animal.imageUrl[0]}
                                  className="size-12 shrink-0 rounded-full object-cover"
                                  alt={animal.name}
                                  loading="lazy"
                                />
                              ) : (
                                <div className="size-12 shrink-0 rounded-full bg-gray-200" />
                              )}
                              {animal.name}
                            </div>
                          </TableCell>
                          <TableCell>{animal.cageNumber}</TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <CareCheckbox
                              checked={care.fed}
                              disabled={pendingKeys.has(`${animal.id}-fed`)}
                              ariaLabel={`Jedzenie — ${animal.name}`}
                              onChange={(value) =>
                                handleCareToggle(animal.id, "fed", value)
                              }
                            />
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <CareCheckbox
                              checked={care.watered}
                              disabled={pendingKeys.has(`${animal.id}-watered`)}
                              ariaLabel={`Woda — ${animal.name}`}
                              onChange={(value) =>
                                handleCareToggle(animal.id, "watered", value)
                              }
                            />
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <CareCheckbox
                              checked={care.cleaned}
                              disabled={pendingKeys.has(`${animal.id}-cleaned`)}
                              ariaLabel={`Sprzątanie — ${animal.name}`}
                              onChange={(value) =>
                                handleCareToggle(animal.id, "cleaned", value)
                              }
                            />
                          </TableCell>
                          <TableCell className="whitespace-normal">
                            {getPerformersLabel(care)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-5 text-center font-medium"
                      >
                        Brak zwierząt o podanych filtrach.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={5}>Suma zwierząt</TableCell>
                    <TableCell className="text-right">{total}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
              <div ref={loadMoreRef} className="flex justify-center py-4">
                {isFetchingNextPage && (
                  <Loader2 className="size-8 animate-spin text-green-900" />
                )}
              </div>
            </div>
          )}
        </section>
      </Container>
    </main>
  );
};

const CareCheckbox = ({
  checked,
  disabled,
  ariaLabel,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  ariaLabel: string;
  onChange: (value: boolean) => void;
}) => {
  return (
    <Input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(event: ChangeEvent<HTMLInputElement>) =>
        onChange(event.target.checked)
      }
      className="size-5 w-5 min-w-5 cursor-pointer rounded border accent-green-600 disabled:cursor-wait"
    />
  );
};

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

const LoadingAnimals = () => {
  return (
    <section id="table" className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 py-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <Table className="table-fixed">
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
          {Array.from({ length: PAGE_SIZE }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              <TableCell>
                <div className="flex items-center gap-x-4">
                  <Skeleton className="size-12 shrink-0 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </TableCell>
              {Array.from({ length: 5 }).map((_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
};

export default DailyAnimalNeedsPage;

import { Button, Container, Skeleton } from "@/components/ui";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import axios from "axios";
import {
  animalGenderOptions,
  animalSizeOptions,
  animalTraitOptions,
} from "@/constants/animal.constants";
import { MultiValueSelector, AgeSlider, AnimalCard } from "@/components/shared";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { CircleAlert, Info, Loader2, RefreshCw } from "lucide-react";
import { useLocation } from "react-router";

const PAGE_SIZE = 6;
const DEFAULT_AGE_RANGE: [number, number] = [0, 25];

const TYPE_SLUG_MAP: Record<string, { enum: string; title: string }> = {
  psy: { enum: "PIES", title: "Psy" },
  koty: { enum: "KOT", title: "Koty" },
  kroliki: { enum: "KROLIK", title: "Króliki" },
  króliki: { enum: "KROLIK", title: "Króliki" },
};

interface AnimalListItem {
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
}

type PageResponse = {
  data: AnimalListItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

interface Filters {
  genders: string[];
  sizes: string[];
  traits: string[];
  ageRange: [number, number];
}

interface PageParams {
  pageParam: number;
  filters: Filters;
  animalType: string;
}

const getAnimalsPage = async ({
  pageParam,
  filters,
  animalType,
}: PageParams) => {
  const params = new URLSearchParams({
    page: String(pageParam),
    limit: String(PAGE_SIZE),
    type: animalType,
  });

  if (filters.genders.length > 0)
    params.set("gender", filters.genders.join(","));
  if (filters.sizes.length > 0) params.set("size", filters.sizes.join(","));
  if (filters.traits.length > 0) params.set("traits", filters.traits.join(","));
  if (
    filters.ageRange[0] !== DEFAULT_AGE_RANGE[0] ||
    filters.ageRange[1] !== DEFAULT_AGE_RANGE[1]
  ) {
    params.set("ageMin", String(filters.ageRange[0]));
    params.set("ageMax", String(filters.ageRange[1]));
  }

  const res = await axios.get<PageResponse>(
    `/api/animals?${params.toString()}`,
  );

  return res.data;
};

const TypeAnimalPage = () => {
  const { pathname } = useLocation();
  const typeSlug = pathname.split("/").pop();
  const animalTypeConfig = typeSlug ? TYPE_SLUG_MAP[typeSlug] : undefined;

  const [genders, setGenders] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [traits, setTraits] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState<[number, number]>(DEFAULT_AGE_RANGE);

  const filters: Filters = useMemo(
    () => ({
      genders,
      sizes,
      traits,
      ageRange,
    }),
    [genders, sizes, traits, ageRange],
  );

  const resetFilters = useCallback(() => {
    setGenders([]);
    setSizes([]);
    setTraits([]);
    setAgeRange(DEFAULT_AGE_RANGE);
  }, []);

  const {
    data,
    isPending,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["animals", animalTypeConfig?.enum, filters],
    queryFn: ({ pageParam }) =>
      getAnimalsPage({
        pageParam,
        filters,
        animalType: animalTypeConfig!.enum,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    placeholderData: keepPreviousData,
    enabled: Boolean(animalTypeConfig),
  });

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isFiltering = isFetching && !isFetchingNextPage && !isPending;

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

  useEffect(() => {
    if (animalTypeConfig?.title) {
      document.title = `${animalTypeConfig.title} | Schronisko`;
    }
  }, [animalTypeConfig?.title]);

  const animalsJsonLd = useMemo(() => {
    if (!animalTypeConfig || animals.length === 0) return null;

    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: animalTypeConfig.title,
      numberOfItems: total,
      itemListElement: animals.map((animal, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: animal.name,
        url: `/zwierzeta/${animal.id}`,
      })),
    };
  }, [animalTypeConfig, animals, total]);

  if (!animalTypeConfig) {
    return null;
  }

  if (isError) {
    return (
      <main>
        <Container className="space-y-12 md:space-y-16">
          <section
            aria-labelledby="type-animals-heading"
            className="space-y-6 lg:space-y-8"
          >
            <div className="space-y-2">
              <h1
                id="type-animals-heading"
                className="text-3xl font-bold text-green-900 md:text-5xl"
              >
                {animalTypeConfig.title}
              </h1>
              <p className="text-sm leading-6 md:text-base md:leading-7">
                Aktualnie posiadamy zwierzęta, które czekają na nowy dom!
              </p>
            </div>
          </section>
          <div
            role="alert"
            className="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center"
          >
            <CircleAlert className="size-12 text-red-600" aria-hidden="true" />
            <div className="space-y-2">
              <p className="text-xl font-semibold text-red-900">
                Nie udało się załadować zwierząt
              </p>
              <p className="max-w-md text-sm text-red-800 md:text-base">
                Wystąpił problem podczas pobierania listy zwierząt. Sprawdź
                połączenie z internetem i spróbuj ponownie.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={isFetching ? "animate-spin" : undefined}
                aria-hidden="true"
              />
              {isFetching ? "Ponawianie..." : "Spróbuj ponownie"}
            </Button>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main>
      {animalsJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(animalsJsonLd) }}
        />
      )}
      <Container className="space-y-12 md:space-y-16">
        <section
          id="categories"
          aria-labelledby="type-animals-heading"
          className="space-y-6 lg:space-y-8"
        >
          <div className="space-y-2">
            <h1
              id="type-animals-heading"
              className="text-3xl font-bold text-green-900 md:text-5xl"
            >
              {animalTypeConfig.title}
            </h1>
            <p className="text-sm leading-6 md:text-base md:leading-7">
              Aktualnie posiadamy {isPending ? "..." : total} zwierząt, które
              czekają na nowy dom!
            </p>
          </div>
          <div
            role="search"
            aria-label="Filtry zwierząt"
            className="z-20 -mt-4 flex flex-wrap items-center gap-4 bg-white py-4 lg:-mt-8"
          >
            <MultiValueSelector
              items={animalGenderOptions}
              placeholder="Wybierz płeć"
              value={genders}
              onValueChange={setGenders}
            />
            <MultiValueSelector
              items={animalSizeOptions}
              placeholder="Wybierz rozmiar"
              value={sizes}
              onValueChange={setSizes}
            />
            <MultiValueSelector
              items={animalTraitOptions}
              placeholder="Wybierz cechy"
              value={traits}
              onValueChange={setTraits}
            />
            <AgeSlider value={ageRange} onChange={setAgeRange} />
            <Button onClick={resetFilters} variant="destructive">
              Resetuj filtry
            </Button>
            {isFiltering && (
              <span
                role="status"
                className="flex items-center gap-2 text-sm text-green-900"
              >
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Filtrowanie...
              </span>
            )}
          </div>

          <div
            className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 ${
              isFiltering ? "opacity-60 transition-opacity" : ""
            }`}
          >
            {isPending && <LoadingAnimals />}
            {!isPending && animals.length === 0 && <EmptyAnimals />}
            {animals.map((animal) => (
              <AnimalCard key={animal.id} animal={animal} />
            ))}
          </div>

          <div ref={loadMoreRef} className="flex justify-center py-4">
            {isFetchingNextPage && (
              <Loader2
                className="size-8 animate-spin text-green-900"
                aria-label="Ładowanie kolejnych zwierząt"
              />
            )}
          </div>
        </section>
      </Container>
    </main>
  );
};

const LoadingAnimals = () => {
  return Array.from({ length: PAGE_SIZE }).map((_, index) => (
    <div key={index} className="space-y-2" aria-hidden="true">
      <Skeleton className="aspect-video rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    </div>
  ));
};

const EmptyAnimals = () => {
  return (
    <div
      role="status"
      className="col-span-full flex flex-col items-center justify-center gap-4 rounded-2xl border border-blue-900 bg-blue-50 px-6 py-12 text-center"
    >
      <Info className="size-12 text-blue-600" aria-hidden="true" />
      <div className="space-y-2">
        <p className="text-xl font-semibold text-blue-900">Brak zwierząt</p>
        <p className="max-w-md text-sm text-blue-900 md:text-base">
          Nie znaleziono zwierząt spełniających wybrane kryteria.
        </p>
      </div>
    </div>
  );
};

export default TypeAnimalPage;

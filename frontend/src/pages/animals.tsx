import { Button, Container, Skeleton } from "@/components/ui";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import axios from "axios";
import {
  animalTypeOptions,
  animalGenderOptions,
  animalSizeOptions,
  animalTraitOptions,
} from "@/constants/animal.constants";
import {
  MultiValueSelector,
  AgeSlider,
  AnimalCard,
  EmptyState,
  ErrorState,
} from "@/components/shared";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { AnimalListItem, PaginatedResponse } from "@/types";

const PAGE_SIZE = 6;
const DEFAULT_AGE_RANGE: [number, number] = [0, 25];
const PAGE_TITLE = "Wszystkie zwierzęta | Schronisko";

interface Filters {
  types: string[];
  genders: string[];
  sizes: string[];
  traits: string[];
  ageRange: [number, number];
}

interface PageParams {
  pageParam: number;
  filters: Filters;
}

const getAnimalsPage = async ({ pageParam, filters }: PageParams) => {
  const params = new URLSearchParams({
    page: String(pageParam),
    limit: String(PAGE_SIZE),
  });

  if (filters.types.length > 0) params.set("type", filters.types.join(","));
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

  const res = await axios.get<PaginatedResponse<AnimalListItem>>(
    `/api/animals?${params.toString()}`,
  );

  return res.data;
};

const AnimalsPage = () => {
  const [types, setTypes] = useState<string[]>([]);
  const [genders, setGenders] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [traits, setTraits] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState<[number, number]>(DEFAULT_AGE_RANGE);

  const filters: Filters = useMemo(
    () => ({
      types,
      genders,
      sizes,
      traits,
      ageRange,
    }),
    [types, genders, sizes, traits, ageRange],
  );

  const resetFilters = useCallback(() => {
    setTypes([]);
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
  } = useInfiniteQuery({
    queryKey: ["animals", filters],
    queryFn: ({ pageParam }) => getAnimalsPage({ pageParam, filters }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    placeholderData: keepPreviousData,
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
    document.title = PAGE_TITLE;
  }, []);

  const animalsJsonLd = useMemo(() => {
    if (animals.length === 0) return null;

    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Wszystkie zwierzęta",
      numberOfItems: total,
      itemListElement: animals.map((animal, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: animal.name,
        url: `/zwierzeta/${animal.id}`,
      })),
    };
  }, [animals, total]);

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
          aria-labelledby="animals-heading"
          className="space-y-6 lg:space-y-8"
        >
          <div className="space-y-2">
            <h1
              id="animals-heading"
              className="text-3xl font-bold text-green-900 md:text-5xl"
            >
              Wszystkie zwierzęta
            </h1>
            <p className="text-sm leading-6 md:text-base md:leading-7">
              Aktualnie posiadamy {isPending ? "..." : total} zwierząt, które
              czekają na nowy dom!
            </p>
          </div>
          <div
            role="search"
            aria-label="Filtry zwierząt"
            className={cn(
              "sticky top-0 z-20 -mt-4 flex flex-wrap items-center gap-4 bg-white py-4 lg:-mt-8",
            )}
          >
            <MultiValueSelector
              items={animalTypeOptions}
              placeholder="Wybierz zwierzę"
              value={types}
              onValueChange={setTypes}
            />
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
            {isPending ? (
              <LoadingAnimals />
            ) : isError && animals.length === 0 ? (
              <ErrorState
                title="Nie udało się załadować zwierząt"
                description="Wystąpił problem podczas pobierania listy zwierząt. Sprawdź połączenie z internetem i spróbuj ponownie."
              />
            ) : animals.length === 0 ? (
              <EmptyState
                title="Brak zwierząt"
                description="Nie znaleziono zwierząt spełniających wybrane kryteria."
              />
            ) : (
              animals.map((animal) => (
                <AnimalCard key={animal.id} animal={animal} />
              ))
            )}
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

// UI podczas ładowania zwierzat
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

export default AnimalsPage;

import { Button, Container, Skeleton } from "@/components/ui";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import axios from "axios";
import {
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
import { Loader2, RefreshCw } from "lucide-react";
import { Navigate, useLocation } from "react-router";
import type { AnimalListItem, PaginatedResponse } from "@/types";

const PAGE_SIZE = 6;
const DEFAULT_AGE_RANGE: [number, number] = [0, 25];

const formatWaitingAnimalsText = (count: number) => {
  if (count === 1) {
    return "Aktualnie posiadamy 1 zwierzę, które czeka na nowy dom!";
  }

  const mod10 = count % 10;
  const mod100 = count % 100;
  const noun =
    mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
      ? "zwierzęta"
      : "zwierząt";

  return `Aktualnie posiadamy ${count} ${noun}, które czekają na nowy dom!`;
};

const TYPE_SLUG_MAP: Record<string, { enum: string; title: string }> = {
  psy: { enum: "PIES", title: "Psy" },
  koty: { enum: "KOT", title: "Koty" },
  kroliki: { enum: "KROLIK", title: "Króliki" },
  króliki: { enum: "KROLIK", title: "Króliki" },
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

  const res = await axios.get<PaginatedResponse<AnimalListItem>>(
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
      numberOfItems: animals.length,
      itemListElement: animals.map((animal, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: animal.name,
        url: `/zwierzeta/${animal.id}`,
      })),
    };
  }, [animalTypeConfig, animals]);

  if (!animalTypeConfig) {
    return <Navigate to="/zwierzeta" replace />;
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
              {isPending
                ? "Aktualnie posiadamy zwierzęta, które czekają na nowy dom!"
                : formatWaitingAnimalsText(total)}
            </p>
          </div>
          <div
            role="search"
            aria-label="Filtry zwierząt"
            className="sticky top-0 z-20 -mt-4 flex flex-wrap items-center gap-4 bg-white py-4 lg:-mt-8"
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
            {isPending ? (
              <LoadingAnimals />
            ) : isError && animals.length === 0 ? (
              <ErrorState
                title="Nie udało się załadować zwierząt"
                description="Wystąpił problem podczas pobierania listy zwierząt. Sprawdź połączenie z internetem i spróbuj ponownie."
              >
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
              </ErrorState>
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

export default TypeAnimalPage;

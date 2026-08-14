import { Button, Container, Skeleton } from "@/components/ui";
import { formatAnimalStatus, styleAnimalStatus } from "@/lib/utils";
import { ImageOff, Loader2, RefreshCw } from "lucide-react";
import { Link } from "react-router";
import axios from "axios";
import { useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { EmptyState, ErrorState } from "@/components/shared";
import type { FoundAnimal, PaginatedResponse } from "@/types";

const PAGE_SIZE = 6;
const PAGE_TITLE = "Znalezione zwierzęta | Schronisko";

const getFoundAnimalsPage = async (pageParam: number) => {
  const params = new URLSearchParams({
    page: String(pageParam),
    limit: String(PAGE_SIZE),
    sort: "foundAt:asc",
    status: "ZNALEZIONY",
  });

  const res = await axios.get<PaginatedResponse<FoundAnimal>>(
    `/api/animals?${params.toString()}`,
  );

  return res.data;
};

const FoundAnimalsPage = () => {
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
    queryKey: ["found-animals"],
    queryFn: ({ pageParam }) => getFoundAnimalsPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
  });

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

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

  const foundAnimals = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );

  useEffect(() => {
    document.title = PAGE_TITLE;
  }, []);

  const foundAnimalsJsonLd = useMemo(() => {
    if (foundAnimals.length === 0) return null;

    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Znalezione zwierzęta",
      numberOfItems: foundAnimals.length,
      itemListElement: foundAnimals.map((animal, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: animal.name,
        url: `/zwierzeta/${animal.id}`,
      })),
    };
  }, [foundAnimals]);

  return (
    <main>
      {foundAnimalsJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(foundAnimalsJsonLd),
          }}
        />
      )}
      <Container className="space-y-12 md:space-y-16">
        <section
          id="found-animals"
          aria-labelledby="found-animals-heading"
          className="space-y-6 lg:space-y-8"
        >
          <div className="space-y-2">
            <h1
              id="found-animals-heading"
              className="text-3xl font-bold text-green-900 md:text-5xl"
            >
              Znalezione zwierzęta
            </h1>
            <p className="text-sm leading-6 md:text-base md:leading-7">
              Zgubiłeś swojego pupila? Sprawdź, czy ktoś go nie znalazł i nie
              oddał do naszego schroniska!
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {isPending ? (
              <LoadingFoundAnimals />
            ) : isError && foundAnimals.length === 0 ? (
              <ErrorState
                title="Wystąpił błąd"
                description="Wystąpił błąd podczas ładowania zwierząt. Odśwież stronę lub spróbuj później."
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
            ) : foundAnimals.length === 0 ? (
              <EmptyState
                title="Brak znalezionych zwierząt"
                description="Aktualnie brak znalezionych zwierząt. Wróć wkrótce, aby poznać nasze znalezione zwierzaki."
              />
            ) : (
              foundAnimals.map((foundAnimal) => (
                <FoundAnimalCard
                  key={foundAnimal.id}
                  foundAnimal={foundAnimal}
                />
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

// Komponent karty zwierzęcia
const FoundAnimalCard = ({ foundAnimal }: { foundAnimal: FoundAnimal }) => {
  return (
    <Link
      to={`/zwierzeta/${foundAnimal.id}`}
      className="space-y-2 transition-colors duration-200 hover:text-green-800"
    >
      <div className="relative grid aspect-video place-items-center overflow-hidden rounded-xl bg-gray-100">
        <span
          className={`${styleAnimalStatus("ZNALEZIONY")} absolute top-3 right-3 z-2 rounded-2xl px-4 py-2 text-xs font-semibold`}
        >
          {formatAnimalStatus.ZNALEZIONY}
        </span>
        {foundAnimal.imageUrl.length > 0 ? (
          <img
            src={foundAnimal.imageUrl[0]}
            alt={foundAnimal.name}
            width={640}
            height={360}
            className="absolute size-full object-cover"
          />
        ) : (
          <ImageOff
            className="absolute size-10 object-cover text-gray-300 md:size-20"
            aria-hidden="true"
          />
        )}
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold lg:text-lg">
          Znaleziono dnia{" "}
          {new Date(foundAnimal.foundAt).toLocaleDateString("pl-PL")} w
          miejscowości {foundAnimal.foundLocation || "nieznanej"}.
        </h3>
        <p className="line-clamp-4 text-xs leading-5 lg:text-sm lg:leading-6">
          {foundAnimal.description}
        </p>
      </div>
    </Link>
  );
};

// UI podczas ładowania zwierzat
const LoadingFoundAnimals = () => {
  return Array.from({ length: PAGE_SIZE }).map((_, index) => (
    <div key={index} className="space-y-2" aria-hidden="true">
      <Skeleton className="aspect-video rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  ));
};

export default FoundAnimalsPage;

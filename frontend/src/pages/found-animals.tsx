import { Container, Skeleton } from "@/components/ui";
import { styleAnimalStatus } from "@/lib/utils";
import { CircleAlert, ImageOff, Info, Loader2 } from "lucide-react";
import { Link } from "react-router";
import axios from "axios";
import { useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

const PAGE_SIZE = 6;
const PAGE_TITLE = "Znalezione zwierzęta | Schronisko";

interface FoundAnimal {
  id: number;
  name: string;
  imageUrl: string[];
  description: string;
  foundAt: string;
  foundLocation: string;
}

type PageResponse = {
  data: FoundAnimal[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

const getFoundAnimalsPage = async (pageParam: number) => {
  const params = new URLSearchParams({
    page: String(pageParam),
    limit: String(PAGE_SIZE),
    sort: "foundAt:asc",
    status: "ZNALEZIONY",
  });

  const res = await axios.get<PageResponse>(
    `/api/animals?${params.toString()}`,
  );

  return res.data;
};

const FoundAnimalsPage = () => {
  const {
    data,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
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
  const total = data?.pages[0]?.total ?? 0;

  useEffect(() => {
    document.title = PAGE_TITLE;
  }, []);

  const foundAnimalsJsonLd = useMemo(() => {
    if (foundAnimals.length === 0) return null;

    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Znalezione zwierzęta",
      numberOfItems: total,
      itemListElement: foundAnimals.map((animal, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: animal.name,
        url: `/zwierzeta/${animal.id}`,
      })),
    };
  }, [foundAnimals, total]);

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
            {isPending && <LoadingFoundAnimals />}
            {isError && <ErrorFoundAnimals />}
            {!isPending && !isError && foundAnimals.length === 0 && (
              <EmptyFoundAnimals />
            )}
            {foundAnimals.map((foundAnimal) => (
              <FoundAnimalCard key={foundAnimal.id} foundAnimal={foundAnimal} />
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
          ZNALEZIONY
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
          Znaleziono dnia {new Date(foundAnimal.foundAt).toLocaleDateString()} w
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

// UI podczas wystąpienia błędu
const ErrorFoundAnimals = () => {
  return (
    <div
      role="alert"
      className="col-span-full flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center"
    >
      <CircleAlert className="size-12 text-red-600" aria-hidden="true" />
      <div className="space-y-2">
        <p className="text-lg font-semibold text-red-900 md:text-xl">
          Wystapił błąd
        </p>
        <p className="max-w-md text-sm text-red-800 md:text-base">
          Wystąpił błąd podczas ładowania zwierząt. Odśwież stronę lub spróbuj
          później.
        </p>
      </div>
    </div>
  );
};

// UI podczas braku zwierzat
const EmptyFoundAnimals = () => {
  return (
    <div
      role="status"
      className="col-span-full flex flex-col items-center justify-center gap-4 rounded-2xl border border-blue-900 bg-blue-50 px-6 py-12 text-center"
    >
      <Info className="size-12 text-blue-600" aria-hidden="true" />
      <div className="space-y-2">
        <p className="text-lg font-semibold text-blue-900 md:text-xl">
          Brak znalezionych zwierząt
        </p>
        <p className="max-w-md text-sm text-blue-900 md:text-base">
          Aktualnie brak znalezionych zwierząt. Wróć wkrótce, aby poznać nasze
          znalezione zwierzaki.
        </p>
      </div>
    </div>
  );
};

export default FoundAnimalsPage;

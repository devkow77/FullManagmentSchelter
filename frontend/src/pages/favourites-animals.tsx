import { Button, Container, Skeleton } from "@/components/ui";
import { FavouriteAnimalButton } from "@/components/shared";
import { CircleAlert, ImageOff, Heart, Loader2 } from "lucide-react";
import { Link } from "react-router";
import {
  calculateAge,
  formatAnimalGender,
  formatAnimalType,
} from "@/lib/utils";
import axios from "axios";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useEffect, useMemo, useRef } from "react";

const PAGE_SIZE = 6;

interface FavouritesAnimalsResponse {
  id: number;
  name: string;
  description: string;
  gender: string;
  traits: string;
  dateOfBirth: Date | string;
  type: string;
  imageUrl: string[];
}

type PageResponse = {
  data: FavouritesAnimalsResponse[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

const getFavouritesPage = async ({
  pageParam,
  favoriteIds,
}: {
  pageParam: number;
  favoriteIds: number[];
}): Promise<PageResponse> => {
  const start = (pageParam - 1) * PAGE_SIZE;
  const pageIds = favoriteIds.slice(start, start + PAGE_SIZE);

  const results = await Promise.all(
    pageIds.map((id) =>
      axios
        .get<FavouritesAnimalsResponse>(`/api/animals/${id}`)
        .then((res) => res.data)
        .catch(() => null),
    ),
  );

  const data = results.filter(
    (animal): animal is FavouritesAnimalsResponse => animal !== null,
  );

  return {
    data,
    total: favoriteIds.length,
    page: pageParam,
    pageSize: PAGE_SIZE,
    hasMore: start + PAGE_SIZE < favoriteIds.length,
  };
};

const FavouritesAnimalsPage = () => {
  const favoriteIds = useFavoritesStore((state) => state.favoriteIds);

  const {
    data,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
  } = useInfiniteQuery({
    queryKey: ["favourites-animals", favoriteIds],
    queryFn: ({ pageParam }) =>
      getFavouritesPage({ pageParam, favoriteIds }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    enabled: favoriteIds.length > 0,
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

  const favouritesAnimals = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );

  const isLoadingFavourites = favoriteIds.length > 0 && isPending;

  return (
    <main>
      <Container className="space-y-12 md:space-y-16">
        <section id="categories" className="space-y-6 lg:space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-green-900 md:text-5xl">
              Ulubione zwierzęta
            </h1>
            <p className="text-sm leading-6 md:text-base md:leading-7">
              Tutaj znajdziesz wszystkie zwierzęta, które masz w ulubionych.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:gap-6">
            {isLoadingFavourites && <LoadingFavourites />}
            {isError && <ErrorFavourites />}
            {!isLoadingFavourites &&
              !isError &&
              favouritesAnimals.length === 0 && <EmptyFavourites />}
            {!isLoadingFavourites &&
              !isError &&
              favouritesAnimals.map((animal) => (
                <Link
                  to={`/zwierzeta/${animal.id}`}
                  key={animal.id}
                  className="space-y-2 transition-colors duration-200 hover:text-green-800 sm:flex sm:gap-x-6"
                >
                  <div className="relative grid aspect-video max-w-md flex-1 place-items-center overflow-hidden rounded-xl bg-black/5">
                    <FavouriteAnimalButton
                      animalId={animal.id}
                      animalName={animal.name}
                    />
                    {animal.imageUrl[0] ? (
                      <img
                        src={animal.imageUrl[0]}
                        alt={animal.name}
                        className="absolute size-full object-cover"
                      />
                    ) : (
                      <ImageOff className="absolute size-10 object-cover text-black opacity-20 md:size-20" />
                    )}
                  </div>
                  <div className="max-w-xl flex-1 md:space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs md:text-sm">
                      <p>
                        {formatAnimalType[animal.type]} (
                        {formatAnimalGender(animal.gender)})
                      </p>
                      <p>{animal.traits}</p>
                    </div>
                    <h3 className="font-semibold lg:text-lg">
                      {animal.name} {calculateAge(animal.dateOfBirth)}
                    </h3>
                    <p className="line-clamp-2 text-xs leading-6 sm:line-clamp-none md:text-base md:leading-6">
                      {animal.description}
                    </p>
                  </div>
                </Link>
              ))}
          </div>

          <div ref={loadMoreRef} className="flex justify-center py-4">
            {isFetchingNextPage && (
              <Loader2 className="size-8 animate-spin text-green-900" />
            )}
          </div>
        </section>
      </Container>
    </main>
  );
};

const LoadingFavourites = () => {
  return Array.from({ length: PAGE_SIZE }).map((_, index) => (
    <div key={index} className="space-y-2 sm:flex sm:gap-x-6">
      <Skeleton className="aspect-video flex-1 rounded-xl" />
      <div className="max-w-xl flex-1 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-40 rounded-xl" />
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>
        <Skeleton className="h-15 w-60 rounded-xl" />
        <Skeleton className="h-60 w-120 rounded-xl" />
      </div>
    </div>
  ));
};

const ErrorFavourites = () => {
  return (
    <section
      id="error"
      className="col-span-full flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center"
    >
      <CircleAlert className="size-12 text-red-600" />
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-red-900 md:text-xl">
          Wystąpił błąd
        </h2>
        <p className="max-w-md text-sm text-red-800 md:text-base">
          Wystąpił błąd podczas ładowania zwierząt. Odśwież stronę lub spróbuj
          później.
        </p>
      </div>
    </section>
  );
};

const EmptyFavourites = () => {
  return (
    <section
      id="empty"
      className="col-span-full flex flex-col items-center justify-center gap-4 rounded-xl border border-green-200 bg-green-50 px-6 py-12 text-center"
    >
      <Heart className="size-12 text-green-600" />
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-green-900">
          Brak ulubionych zwierząt
        </h2>
        <p className="max-w-md text-sm text-green-800 md:text-base">
          Nie masz jeszcze żadnych zwierząt w ulubionych. Przejrzyj listę
          zwierząt i dodaj te, które Cię zainteresują.
        </p>
      </div>
      <Button asChild>
        <Link to="/zwierzeta">Przejrzyj zwierzęta</Link>
      </Button>
    </section>
  );
};

export default FavouritesAnimalsPage;

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useFavoritesStore = create<{
  favoriteIds: number[];
  toggleFavorite: (id: number) => void;
  removeFavorites: (ids: number[]) => void;
}>()(
  persist(
    (set) => ({
      favoriteIds: [],
      toggleFavorite: (id) =>
        set((s) => ({
          favoriteIds: s.favoriteIds.includes(id)
            ? s.favoriteIds.filter((x) => x !== id)
            : [...s.favoriteIds, id],
        })),
      removeFavorites: (ids) =>
        set((s) => ({
          favoriteIds: s.favoriteIds.filter((id) => !ids.includes(id)),
        })),
    }),
    { name: "animal-favorites" },
  ),
);

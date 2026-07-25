import { useFavoritesStore } from "@/store/useFavoritesStore";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import { type MouseEvent } from "react";
import { toast } from "sonner";

type FavouriteAnimalButtonProps = {
  animalId: number;
  animalName: string;
  className?: string;
};

const FavouriteAnimalButton = ({
  animalId,
  animalName,
  className,
}: FavouriteAnimalButtonProps) => {
  const favoriteIds = useFavoritesStore((state) => state.favoriteIds);
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const isFavorite = favoriteIds.includes(animalId);

  const handleToggleFavorite = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const wasFavorite = favoriteIds.includes(animalId);
    toggleFavorite(animalId);

    if (wasFavorite) {
      toast.info(`${animalName} usunięto z ulubionych`);
    } else {
      toast.success(`${animalName} dodano do ulubionych`);
    }
  };

  return (
    <button
      type="button"
      aria-label={
        isFavorite
          ? `Usuń ${animalName} z ulubionych`
          : `Dodaj ${animalName} do ulubionych`
      }
      onClick={handleToggleFavorite}
      className={cn(
        "absolute top-3 right-3 z-10 cursor-pointer rounded-full bg-white p-1 transition-transform hover:scale-105 sm:p-2",
        className,
      )}
    >
      <Heart
        className={cn(
          "scale-80 text-red-600 sm:scale-100",
          isFavorite && "fill-red-600",
        )}
      />
    </button>
  );
};

export default FavouriteAnimalButton;

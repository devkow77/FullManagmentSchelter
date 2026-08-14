import {
  Cat,
  Dog,
  PawPrint,
  Rabbit,
  Rat,
  Turtle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnimalType } from "@/types";

const iconByType: Record<AnimalType, LucideIcon> = {
  PIES: Dog,
  KOT: Cat,
  KROLIK: Rabbit,
  CHOMIK: Rat,
  ZOLW: Turtle,
  INNE: PawPrint,
};

type AnimalAvatarProps = {
  type: AnimalType | string;
  src?: string | null;
  alt?: string;
  className?: string;
  iconClassName?: string;
};

const AnimalAvatar = ({
  type,
  src,
  alt = "Zdjęcie zwierzęcia",
  className,
  iconClassName,
}: AnimalAvatarProps) => {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn("size-12 shrink-0 rounded-full object-cover", className)}
        loading="lazy"
      />
    );
  }

  const Icon = iconByType[type as AnimalType] ?? PawPrint;

  return (
    <div
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-full bg-gray-100",
        className,
      )}
      aria-label={alt}
    >
      <Icon className={cn("size-6 text-gray-300", iconClassName)} />
    </div>
  );
};

export default AnimalAvatar;

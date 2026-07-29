import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  src?: string | null;
  alt?: string;
  className?: string;
  iconClassName?: string;
};

const UserAvatar = ({
  src,
  alt = "Zdjęcie profilowe",
  className,
  iconClassName,
}: UserAvatarProps) => {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn("size-12 shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "text flex size-12 shrink-0 items-center justify-center rounded-full bg-gray-100",
        className,
      )}
      aria-label={alt}
    >
      <UserRound className={cn("size-6 text-gray-300", iconClassName)} />
    </div>
  );
};

export default UserAvatar;

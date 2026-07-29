import { Link } from "react-router";
import { ImageOff } from "lucide-react";
import { FavouriteAnimalButton } from "@/components/shared";
import { calculateAge } from "@/lib/utils";

interface Animal {
  id: number;
  name: string;
  imageUrl: string[];
  dateOfBirth: Date | string;
  description: string;
}

const AnimalCard = ({ animal }: { animal: Animal }) => {
  return (
    <Link
      to={`/zwierzeta/${animal.id}`}
      className="space-y-2 transition-colors duration-200 hover:text-green-900"
    >
      <div className="relative grid aspect-video place-items-center overflow-hidden rounded-xl bg-gray-100">
        {animal.imageUrl[0] ? (
          <img
            src={animal.imageUrl[0]}
            alt={animal.name}
            className="absolute size-full object-cover"
          />
        ) : (
          <ImageOff className="absolute size-10 object-cover text-gray-300 md:size-20" />
        )}
        <FavouriteAnimalButton animalId={animal.id} animalName={animal.name} />
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold lg:text-lg">
          {animal.name} {calculateAge(animal.dateOfBirth)}
        </h3>
        <p className="line-clamp-3 text-xs leading-5 md:text-sm md:leading-6">
          {animal.description}
        </p>
      </div>
    </Link>
  );
};

export default AnimalCard;

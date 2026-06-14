import {
  formatAnimalHealthStatus,
  formatAnimalStatus,
  formatAnimalType,
} from "@/lib/utils";
import { toLabelValueOptions } from "@/constants/helpers";
import {
  animalGenderValues,
  animalHealthStatusValues,
  animalSizeValues,
  animalStatusValues,
  animalTypeValues,
} from "@/schemas/animal.schema";

const formatAnimalGenderMap = {
  SAMIEC: "Samiec",
  SAMICA: "Samica",
} as const;

const formatAnimalSizeMap = {
  MALY: "Mały",
  SREDNI: "Średni",
  DUZY: "Duży",
} as const;

const formatAnimalTraitMap = {
  energiczny: "Energetyczny",
  spokojny: "Spokojny",
  przyjazny: "Przyjazny",
  nieśmiały: "Nieśmiały",
  pieszczoch: "Pieszczoch",
  "skory do zabawy": "Skory do zabawy",
  łagodny: "Łagodny",
} as const;

export const animalTypeOptions = toLabelValueOptions(formatAnimalType);
export const animalGenderOptions = toLabelValueOptions(formatAnimalGenderMap);
export const animalSizeOptions = toLabelValueOptions(formatAnimalSizeMap);
export const animalStatusOptions = toLabelValueOptions(formatAnimalStatus);
export const animalHealthStatusOptions = toLabelValueOptions(
  formatAnimalHealthStatus,
);
export const animalTraitOptions = toLabelValueOptions(formatAnimalTraitMap);

export {
  animalTypeValues,
  animalGenderValues,
  animalSizeValues,
  animalStatusValues,
  animalHealthStatusValues,
};

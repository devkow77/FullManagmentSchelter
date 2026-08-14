/** Pozycja listy potrzeb zwierząt (GET /api/animal-needs). */
export type AnimalNeedListItem = {
  id: number;
  name: string;
  description: string | null;
  category: string;
  isActive: boolean;
  animal: {
    id: number;
    name: string;
    type: string;
    imageUrl: string[];
    cageNumber: string | null;
  };
  reportedBy: {
    id: number;
    fullName: string;
  } | null;
};

/** Dane wysyłane przy zgłaszaniu nowej potrzeby. */
export type AnimalNeedInput = {
  animalId: number;
  category: string;
  name: string;
  description: string;
};

export type Cage = {
  id: number;
  zone: string;
  number: number;
};

export type CageListItem = Cage & {
  label: string;
  isOccupied: boolean;
  animal: {
    id: number;
    name: string;
    type: string;
    imageUrl: string[];
  } | null;
};

/** Dostępne strefy i numery klatek do zasilenia list wyboru. */
export type CageOptions = {
  zones: string[];
  numbers: number[];
  byZone: Record<string, number[]>;
};

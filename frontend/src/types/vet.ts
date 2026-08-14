export type Vet = {
  id: number;
  name: string;
  phone: string;
  clinic: string;
};

/** Skrócone dane weterynarza do list wyboru w formularzach. */
export type VetOption = {
  id: number;
  name: string;
  clinic: string | null;
};

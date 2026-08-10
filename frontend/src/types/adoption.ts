export type Adoption = {
  id: number;
  userId: number;
  animalId: number;
  status: string;
  message: string;
  employeeNote: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  acceptedAt: Date | string | null;
  user: {
    fullName: string;
  };
  animal: {
    id: number;
    name: string;
    description: string;
    imageUrl: string[];
  };
};

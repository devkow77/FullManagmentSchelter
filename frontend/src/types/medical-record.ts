export type MedicalRecord = {
  id: number;
  animal: {
    name: string;
    type: string;
  };
  vet: {
    name: string;
    clinic: string;
  };
  description: string;
  type: string;
  status: string;
  date: string;
  cost: number;
};

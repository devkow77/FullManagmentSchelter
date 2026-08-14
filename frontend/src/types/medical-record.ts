import type { MedicalRecordFormData } from "@/schemas/medical-record.schema";

export type MedicalRecordType = MedicalRecordFormData["type"];

export type MedicalRecordStatus = MedicalRecordFormData["status"];

/** Pozycja listy raportów medycznych (GET /api/medical-records). */
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

/** Raport medyczny w formie zasilającej formularz edycji. */
export type MedicalRecordDetails = {
  id: number;
  vetId: number;
  animalId: number;
  type: MedicalRecordType;
  description: string;
  date: string;
  cost: number;
  status: MedicalRecordStatus;
};

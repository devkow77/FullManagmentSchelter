import type { AnimalType } from "./animal";
import type { PaginatedResponse } from "./api";

/** Stan dziennej opieki nad zwierzęciem na dzisiejszy dzień. */
export type TodayCare = {
  fed: boolean;
  watered: boolean;
  cleaned: boolean;
};

export type CareField = keyof TodayCare;

export type AssignedWorker = {
  id: number;
  fullName: string;
};

/** Zwierzę na liście dziennej opieki. */
export type DailyCareAnimal = {
  id: number;
  name: string;
  type: AnimalType;
  gender: string;
  cageNumber: string | null;
  imageUrl: string[];
  todayCare: TodayCare;
  assignedWorkers?: AssignedWorker[];
};

/** Lista zadań opiekuńczych pracownika wraz z przypisanymi mu strefami. */
export type MyTasksResponse = PaginatedResponse<DailyCareAnimal> & {
  zones: string[];
};

export type WorkerProgressItem = {
  id: number;
  fullName: string;
  imageUrl: string | null;
  zones: string[];
  completedCages: number;
  totalCages: number;
  percent: number;
};

export type WorkersProgressResponse = {
  workers: WorkerProgressItem[];
};

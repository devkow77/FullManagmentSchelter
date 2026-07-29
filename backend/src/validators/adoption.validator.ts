import { z } from "zod";

export const createAdoptionSchema = z.object({
  animalId: z.number().int().positive(),
  message: z
    .string()
    .max(500, "Wiadomość może mieć maksymalnie 500 znaków.")
    .optional(),
});

export const editAdoptionStatusSchema = z.object({
    status: z.enum(["OCZEKUJACA", "ZAAKCEPTOWANA", "ODRZUCONA", "ANULOWANA", "ZAKONCZONA"]),
    employeeNote: z
      .string()
      .max(500, "Notatka może mieć maksymalnie 500 znaków.")
      .optional(),
    message: z.string().optional(),
  });
  
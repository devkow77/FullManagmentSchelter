import { z } from "zod";

export const createAdoptionSchema = z.object({
  message: z
    .string()
    .max(500, "Wiadomość może mieć maksymalnie 500 znaków.")
    .optional(),
});

export const editAdoptionSchema = z.object({
  message: z.string().optional(),
  employeeNote: z
    .string()
    .trim()
    .min(1, "Notatka pracownika jest wymagana.")
    .max(500, "Notatka może mieć maksymalnie 500 znaków."),
});

export type CreateAdoptionFormData = z.infer<typeof createAdoptionSchema>;
export type EditAdoptionFormData = z.infer<typeof editAdoptionSchema>;

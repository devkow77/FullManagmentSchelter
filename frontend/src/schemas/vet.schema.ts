import { z } from "zod";

export const vetSchema = z.object({
  name: z
    .string()
    .min(3, "Imię i nazwisko musi mieć minimum 3 znaki.")
    .max(50, "Imię i nazwisko nie może mieć więcej niż 50 znaków."),
  phone: z
    .string()
    .trim()
    .regex(/^\d{9}$/, "Numer telefonu musi składać się z 9 cyfr."),
  clinic: z
    .string()
    .trim()
    .min(3, "Nazwa kliniki musi mieć minimum 3 znaki.")
    .max(500, "Nazwa kliniki może mieć maksymalnie 50 znaków."),
});

export type VetFormData = z.infer<typeof vetSchema>;

// Backward-compatible alias used in existing pages
export const addVetSchema = vetSchema;

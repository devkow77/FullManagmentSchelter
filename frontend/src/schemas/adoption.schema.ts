import { z } from "zod";

export const editAdoptionSchema = z.object({
  message: z.string().optional(),
  employeeNote: z
    .string()
    .max(500, "Notatka może mieć maksymalnie 500 znaków.")
    .optional(),
});

export type EditAdoptionFormData = z.infer<typeof editAdoptionSchema>;

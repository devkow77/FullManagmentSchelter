import { z } from 'zod';

export const chatMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Opis nie może być pusty.')
    .max(500, 'Opis nie może mieć więcej niż 500 znaków.'),
});

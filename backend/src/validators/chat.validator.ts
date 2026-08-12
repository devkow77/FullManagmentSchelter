import { z } from 'zod';

const historyItemSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z
    .string()
    .trim()
    .min(1, 'Element historii nie może być pusty.')
    .max(500, 'Element historii nie może mieć więcej niż 500 znaków.'),
});

export const chatMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Wiadomość nie może być pusta.')
    .max(500, 'Wiadomość nie może mieć więcej niż 500 znaków.'),
  history: z.array(historyItemSchema).max(12).default([]),
});

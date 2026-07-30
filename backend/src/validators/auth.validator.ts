import { z } from 'zod';

interface RegisterSchema {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(3, 'Imię i nazwisko musi mieć minimum 3 znaki.')
      .max(50, 'Imię i nazwisko nie może mieć więcej niż 50 znaków.'),
    email: z
      .string()
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Niepoprawny adres email.'),
    password: z
      .string()
      .min(8, 'Hasło musi mieć min. 8 znaków')
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
        'Hasło musi zawierać min. 1 wielką literę, 1 cyfrę i 1 znak specjalny.',
      ),
    confirmPassword: z.string(),
  })
  .refine((data: RegisterSchema) => data.password === data.confirmPassword, {
    message: 'Hasła muszą być takie same.',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z
    .string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Niepoprawny adres email.'),
  password: z.string().min(1, 'Hasło jest wymagane.'),
});

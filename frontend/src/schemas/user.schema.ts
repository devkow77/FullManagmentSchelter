import { z } from "zod";
import {
  emptyStringToNull,
  nullableDateSchema,
  phoneSchema,
} from "@/schemas/common.schema";

export const RoleEnum = z.enum(["UZYTKOWNIK", "ADMINISTRATOR", "PRACOWNIK"], {
  message: "Rola nie może być pusta.",
});
export const GenderEnum = z.enum(["MEZCZYZNA", "KOBIETA"], {
  message: "Płeć nie może być pusta.",
});

export const editUserSchema = z.object({
  fullName: z
    .string()
    .min(3, "Imię i nazwisko musi mieć minimum 3 znaki.")
    .max(50, "Imię i nazwisko nie może mieć więcej niż 50 znaków."),
  email: z
    .string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Niepoprawny adres email."),
  gender: GenderEnum,
  role: RoleEnum,
  phoneNumber: z.preprocess(emptyStringToNull, phoneSchema.nullable()),
  city: z.preprocess(
    emptyStringToNull,
    z
      .string()
      .trim()
      .min(3, "Miasto musi mieć minimum 3 znaki.")
      .max(50, "Miasto może mieć maksymalnie 50 znaków.")
      .nullable()
      .optional(),
  ),
  postalCode: z.preprocess(
    emptyStringToNull,
    z
      .string()
      .trim()
      .regex(/^\d{2}-\d{3}$/, "Kod pocztowy musi mieć format XX-XXX.")
      .nullable()
      .optional(),
  ),
  street: z.preprocess(
    emptyStringToNull,
    z
      .string()
      .trim()
      .min(3, "Adres musi mieć minimum 3 znaki.")
      .max(100, "Adres może mieć maksymalnie 100 znaków.")
      .nullable()
      .optional(),
  ),
  dateOfBirth: nullableDateSchema,
  hasChildren: z.boolean(),
  hasOtherAnimals: z.boolean(),
  isBanned: z.boolean(),
  adminNote: z
    .string()
    .max(500, "Notatka może mieć maksymalnie 500 znaków.")
    .nullable()
    .optional(),
  imageUrl: z.string().nullable().optional(),
});

export const addUserSchema = z.object({
  fullName: z
    .string()
    .min(3, "Imię i nazwisko musi mieć minimum 3 znaki.")
    .max(50, "Imię i nazwisko nie może mieć więcej niż 50 znaków."),
  email: z.string().email("Niepoprawny adres email."),
  password: z
    .string()
    .min(8, "Hasło musi mieć min. 8 znaków")
    .regex(
      /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
      "Hasło musi zawierać min. 1 wielką literę, 1 cyfrę i 1 znak specjalny.",
    ),
  gender: GenderEnum,
  role: RoleEnum,
  imageUrl: z.string().nullable(),
});

export type EditUserFormData = z.infer<typeof editUserSchema>;
export type AddUserFormData = z.infer<typeof addUserSchema>;

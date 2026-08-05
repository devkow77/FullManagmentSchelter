import { z } from "zod";
import {
  emptyStringToNull,
  phoneSchema,
} from "@/schemas/common.schema";

export const RoleEnum = z.enum(["UZYTKOWNIK", "ADMINISTRATOR", "PRACOWNIK"], {
  message: "Rola nie może być pusta.",
});
export const GenderEnum = z.enum(["MEZCZYZNA", "KOBIETA"], {
  message: "Płeć nie może być pusta.",
});

const emailSchema = z
  .string()
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Niepoprawny adres email.");

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

export const getMaxDateOfBirth = () => {
  const date = startOfToday();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const dateOfBirthSchema = z.preprocess(
  (val) => {
    if (val === "" || val == null) return null;
    return val;
  },
  z.coerce
    .date({ message: "Niepoprawna data." })
    .nullable()
    .optional()
    .refine((date) => {
      if (!date) return true;
      const value = new Date(date);
      value.setHours(0, 0, 0, 0);
      return value.getTime() <= startOfToday().getTime();
    }, "Data urodzenia nie może być z przyszłości."),
);

export const editUserSchema = z.object({
  fullName: z
    .string()
    .min(3, "Imię i nazwisko musi mieć minimum 3 znaki.")
    .max(50, "Imię i nazwisko nie może mieć więcej niż 50 znaków."),
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
  dateOfBirth: dateOfBirthSchema,
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

export const editOwnProfileSchema = editUserSchema.omit({
  role: true,
  isBanned: true,
  adminNote: true,
});

export const addUserSchema = z.object({
  fullName: z
    .string()
    .min(3, "Imię i nazwisko musi mieć minimum 3 znaki.")
    .max(50, "Imię i nazwisko nie może mieć więcej niż 50 znaków."),
  email: emailSchema,
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
export type EditOwnProfileFormData = z.infer<typeof editOwnProfileSchema>;
export type AddUserFormData = z.infer<typeof addUserSchema>;

import { z } from "zod";

export const emptyStringToNull = (val: unknown) =>
  val === "" || val == null ? null : val;

export const emptyStringToUndefined = (val: unknown) =>
  val === "" || val == null ? undefined : val;

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\d{9}$/, "Numer telefonu musi składać się z 9 cyfr.");

export const requiredDateSchema = z.preprocess(
  emptyStringToUndefined,
  z.coerce.date({ message: "Data jest wymagana." }),
);

export const nullableDateSchema = z.preprocess(
  (val) => {
    if (val === "" || val == null) return null;
    return val;
  },
  z.coerce.date({ message: "Niepoprawna data." }).nullable().optional(),
);

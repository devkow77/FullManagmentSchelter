import { z } from "zod";
import { requiredDateSchema } from "@/schemas/common.schema";

export const MedicalRecordTypeEnum = z.enum(
  ["WIZYTA", "BADANIE", "OPERACJA", "SZCZEPIENIE", "URAZ", "INNE"],
  { message: "Typ raportu jest wymagany." },
);

export const MedicalRecordStatusEnum = z.enum(
  ["DO_REALIZACJI", "W_TRAKCIE", "ZREALIZOWANA"],
  { message: "Status raportu jest wymagany." },
);

export const medicalRecordTypeValues = MedicalRecordTypeEnum.options;
export const medicalRecordStatusValues = MedicalRecordStatusEnum.options;

export const medicalRecordSchema = z.object({
  vetId: z.number().min(1, "Wybierz klinikę."),
  animalId: z.number().min(1, "Wybierz zwierzę."),
  type: MedicalRecordTypeEnum,
  description: z.string().min(20, "Opis musi mieć co najmniej 20 znaków."),
  date: requiredDateSchema,
  cost: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce
      .number({ message: "Koszt jest wymagany." })
      .min(0, "Koszt nie może być ujemny."),
  ),
  status: MedicalRecordStatusEnum,
});

export type MedicalRecordFormData = z.infer<typeof medicalRecordSchema>;

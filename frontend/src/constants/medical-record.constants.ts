import {
  formatAnimalType,
  formatMedicalRecordStatus,
  formatMedicalRecordType,
} from "@/lib/utils";
import { toLabelValueOptions } from "@/constants/helpers";

export const medicalRecordTypeOptions = toLabelValueOptions(
  formatMedicalRecordType,
);
export const medicalRecordStatusOptions = toLabelValueOptions(
  formatMedicalRecordStatus,
);
export const medicalRecordAnimalTypeOptions =
  toLabelValueOptions(formatAnimalType);

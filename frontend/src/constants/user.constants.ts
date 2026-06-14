import { formatUserRole } from "@/lib/utils";
import { toLabelValueOptions, booleanFilterOptions } from "@/constants/helpers";

const formatUserGenderMap = {
  MEZCZYZNA: "Mężczyzna",
  KOBIETA: "Kobieta",
} as const;

export const userRoleValues = [
  "ADMINISTRATOR",
  "PRACOWNIK",
  "UZYTKOWNIK",
] as const;

export const userGenderValues = ["MEZCZYZNA", "KOBIETA"] as const;

export const addUserRoleValues = ["ADMINISTRATOR", "PRACOWNIK"] as const;

export const addUserGenderValues = ["KOBIETA", "MEZCZYZNA"] as const;

export const genderOptions = toLabelValueOptions(formatUserGenderMap);
export const userRoleOptions = toLabelValueOptions(formatUserRole);
export const workerRoleOptions = userRoleOptions.filter(
  (option) => option.value !== "UZYTKOWNIK",
);

export { booleanFilterOptions };

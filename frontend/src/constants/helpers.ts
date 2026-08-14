import type { LabelValueType } from "@/types";

export const toLabelValueOptions = (
  map: Record<string, string>,
): LabelValueType[] =>
  Object.entries(map).map(([value, label]) => ({ value, label }));

export const booleanFilterOptions: LabelValueType[] = [
  { label: "Tak", value: "true" },
  { label: "Nie", value: "false" },
];

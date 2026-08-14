// STAN DZIENNEJ OPIEKI NAD ZWIERZECIEM
export type DailyCareRecord = {
  fed: boolean;
  watered: boolean;
  cleaned: boolean;
};

// KLATKA W POSTACI ZWRACANEJ PRZEZ cageSelect
export type CageInfo = { id: number; zone: string; number: number } | null;

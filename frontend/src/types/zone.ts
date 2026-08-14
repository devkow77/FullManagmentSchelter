export type WeekInfo = {
  from: string;
  to: string;
  label: string;
};

export type ZoneWeekAssignment = {
  zone: string;
  dates: string[];
  label: string;
};

/** Wiersz pracownika w tabeli przypisań stref na kolejne tygodnie. */
export type WorkerZoneRow = {
  id: number;
  fullName: string;
  imageUrl: string | null;
  role: string;
  currentWeekZones: ZoneWeekAssignment[];
  nextWeekZones: ZoneWeekAssignment[];
  previousWeekZones: ZoneWeekAssignment[];
  twoWeeksAgoZones: ZoneWeekAssignment[];
};

export type ZoneCoverageWorker = {
  id: number;
  fullName: string;
  dates: string[];
  label: string;
};

export type ZoneWeekCoverage = {
  uncoveredDates: string[];
  uncoveredLabel: string;
  workers: ZoneCoverageWorker[];
};

/** Wiersz strefy w tabeli pokrycia dyżurów. */
export type ZoneCoverageRow = {
  zone: string;
  currentWeek: ZoneWeekCoverage;
  nextWeek: ZoneWeekCoverage;
  previousWeek: ZoneWeekCoverage;
  twoWeeksAgo: ZoneWeekCoverage;
};

export type WorkersZoneOverviewResponse = {
  weeks: {
    current: WeekInfo;
    next: WeekInfo;
    previous: WeekInfo;
    twoWeeksAgo: WeekInfo;
  };
  workers: WorkerZoneRow[];
  zones: ZoneCoverageRow[];
};

export type ZoneAssignmentConflict = {
  workerId: number;
  fullName: string;
  currentLabel: string;
  newLabel: string;
  summary: string;
};

/** Odpowiedź serwera, gdy przypisanie strefy wymaga potwierdzenia kolizji. */
export type AssignZoneConflictResponse = {
  requiresConfirmation: true;
  msg: string;
  conflicts: ZoneAssignmentConflict[];
};

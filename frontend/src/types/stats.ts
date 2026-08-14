export type NamedCount = { key: string; value: number };

export type MonthlyCount = { month: string; count: number };

export type WorkerTotals = {
  total: number;
  administrators: number;
  employees: number;
  twoFactorEnabled: number;
  twoFactorPercent: number;
  men: number;
  women: number;
};

/** Statystyki kadrowe (GET /api/stats/workers). */
export type WorkerStatsResponse = {
  totals: WorkerTotals;
  newWorkersByMonth: MonthlyCount[];
  roleDistribution: { role: string; value: number }[];
  genderDistribution: { gender: string; value: number }[];
  adoptionActivity: { name: string; adoptions: number }[];
};

/** Statystyki schroniska (GET /api/stats/shelter). */
export type ShelterStatsResponse = {
  overview: {
    animals: number;
    seekingHome: number;
    adoptions: number;
    pendingAdoptions: number;
    cages: number;
    cageOccupancyPercent: number;
    medicalRecords: number;
    medicalCostTotal: number;
    activeNeeds: number;
    users: number;
    newsletterSubscribers: number;
  };
  animals: {
    totals: {
      total: number;
      seekingHome: number;
      found: number;
      inAdoption: number;
      adopted: number;
    };
    byStatus: NamedCount[];
    byType: NamedCount[];
    byHealth: NamedCount[];
    newByMonth: MonthlyCount[];
  };
  adoptions: {
    totals: {
      total: number;
      pending: number;
      accepted: number;
      rejected: number;
      canceled: number;
      completed: number;
    };
    byStatus: NamedCount[];
    newByMonth: MonthlyCount[];
  };
  cages: {
    totals: {
      total: number;
      occupied: number;
      free: number;
      occupancyPercent: number;
    };
    byZone: { zone: string; total: number; occupied: number }[];
  };
  medical: {
    totals: {
      total: number;
      toDo: number;
      inProgress: number;
      done: number;
      costTotal: number;
    };
    byStatus: NamedCount[];
    byType: NamedCount[];
    costByMonth: { month: string; cost: number }[];
  };
  needs: {
    totals: {
      active: number;
      inactive: number;
      total: number;
    };
    byCategory: NamedCount[];
  };
  users: {
    totals: {
      total: number;
      banned: number;
      formFilled: number;
      newsletterSubscribers: number;
    };
  };
};

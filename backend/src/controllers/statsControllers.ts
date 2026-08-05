import { StatusCodes } from 'http-status-codes';
import type { Request, Response } from 'express';
import prisma from '../prisma';
import {
  AdoptionStatus,
  AnimalHealthStatus,
  AnimalNeedCategory,
  AnimalStatus,
  AnimalType,
  MedicalRecordStatus,
  MedicalRecordType,
  Role,
} from '../generated/prisma/enums';

const POLISH_MONTHS = [
  'Styczeń',
  'Luty',
  'Marzec',
  'Kwiecień',
  'Maj',
  'Czerwiec',
  'Lipiec',
  'Sierpień',
  'Wrzesień',
  'Październik',
  'Listopad',
  'Grudzień',
] as const;

const buildLastSixMonths = () => {
  const now = new Date();
  const months: { key: string; month: string; count: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${date.getFullYear()}-${date.getMonth()}`,
      month: `${POLISH_MONTHS[date.getMonth()]!} ${date.getFullYear()}`,
      count: 0,
    });
  }

  return {
    months,
    monthIndex: new Map(months.map((item, index) => [item.key, index])),
    windowStart: new Date(now.getFullYear(), now.getMonth() - 5, 1),
  };
};

const countByEnum = <T extends string>(
  rows: { key: T; _count: { _all: number } }[],
  values: readonly T[],
) =>
  values.map((value) => ({
    key: value,
    value: rows.find((row) => row.key === value)?._count._all ?? 0,
  }));

export const getShelterStats = async (_req: Request, res: Response) => {
  try {
    const [
      animalTotal,
      animalsByStatus,
      animalsByType,
      animalsByHealth,
      animalsFound,
      adoptionTotal,
      adoptionsByStatus,
      adoptionsCreated,
      cages,
      occupiedCages,
      medicalTotal,
      medicalByStatus,
      medicalByType,
      medicalCostAgg,
      medicalRecords,
      needsActive,
      needsInactive,
      needsByCategory,
      usersTotal,
      usersBanned,
      usersFormFilled,
      newsletterActive,
    ] = await Promise.all([
      prisma.animal.count(),
      prisma.animal.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.animal.groupBy({
        by: ['type'],
        _count: { _all: true },
      }),
      prisma.animal.groupBy({
        by: ['healthStatus'],
        _count: { _all: true },
      }),
      prisma.animal.findMany({
        where: {
          foundAt: {
            gte: new Date(
              new Date().getFullYear(),
              new Date().getMonth() - 5,
              1,
            ),
          },
        },
        select: { foundAt: true },
      }),
      prisma.adoption.count(),
      prisma.adoption.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.adoption.findMany({
        where: {
          createdAt: {
            gte: new Date(
              new Date().getFullYear(),
              new Date().getMonth() - 5,
              1,
            ),
          },
        },
        select: { createdAt: true },
      }),
      prisma.cage.findMany({
        select: {
          zone: true,
          animal: { select: { id: true } },
        },
      }),
      prisma.cage.count({ where: { animal: { isNot: null } } }),
      prisma.medicalRecord.count(),
      prisma.medicalRecord.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.medicalRecord.groupBy({
        by: ['type'],
        _count: { _all: true },
      }),
      prisma.medicalRecord.aggregate({ _sum: { cost: true } }),
      prisma.medicalRecord.findMany({
        where: {
          date: {
            gte: new Date(
              new Date().getFullYear(),
              new Date().getMonth() - 5,
              1,
            ),
          },
        },
        select: { date: true, cost: true },
      }),
      prisma.animalNeed.count({ where: { isActive: true } }),
      prisma.animalNeed.count({ where: { isActive: false } }),
      prisma.animalNeed.groupBy({
        by: ['category'],
        where: { isActive: true },
        _count: { _all: true },
      }),
      prisma.user.count({ where: { role: Role.UZYTKOWNIK } }),
      prisma.user.count({
        where: { role: Role.UZYTKOWNIK, isBanned: true },
      }),
      prisma.user.count({
        where: { role: Role.UZYTKOWNIK, isFormFilled: true },
      }),
      prisma.newsletterSubscriber.count({ where: { isActive: true } }),
    ]);

    const animalsMonthWindow = buildLastSixMonths();
    for (const animal of animalsFound) {
      const key = `${animal.foundAt.getFullYear()}-${animal.foundAt.getMonth()}`;
      const index = animalsMonthWindow.monthIndex.get(key);
      if (index !== undefined) {
        animalsMonthWindow.months[index]!.count += 1;
      }
    }

    const adoptionsMonthWindow = buildLastSixMonths();
    for (const adoption of adoptionsCreated) {
      const key = `${adoption.createdAt.getFullYear()}-${adoption.createdAt.getMonth()}`;
      const index = adoptionsMonthWindow.monthIndex.get(key);
      if (index !== undefined) {
        adoptionsMonthWindow.months[index]!.count += 1;
      }
    }

    const medicalWindow = buildLastSixMonths();
    const medicalCostRows = medicalWindow.months.map((item) => ({
      month: item.month,
      cost: 0,
    }));
    for (const record of medicalRecords) {
      const key = `${record.date.getFullYear()}-${record.date.getMonth()}`;
      const index = medicalWindow.monthIndex.get(key);
      if (index !== undefined) {
        medicalCostRows[index]!.cost += record.cost ?? 0;
      }
    }

    const cagesByZoneMap = new Map<
      string,
      { zone: string; total: number; occupied: number }
    >();
    for (const cage of cages) {
      const current = cagesByZoneMap.get(cage.zone) ?? {
        zone: cage.zone,
        total: 0,
        occupied: 0,
      };
      current.total += 1;
      if (cage.animal) current.occupied += 1;
      cagesByZoneMap.set(cage.zone, current);
    }

    const cageTotal = cages.length;
    const cageFree = cageTotal - occupiedCages;
    const occupancyPercent =
      cageTotal > 0 ? Math.round((occupiedCages / cageTotal) * 100) : 0;

    const seekingHome =
      animalsByStatus.find((row) => row.status === AnimalStatus.SZUKA_DOMU)
        ?._count._all ?? 0;
    const pendingAdoptions =
      adoptionsByStatus.find((row) => row.status === AdoptionStatus.OCZEKUJACA)
        ?._count._all ?? 0;

    return res.status(StatusCodes.OK).json({
      overview: {
        animals: animalTotal,
        seekingHome,
        adoptions: adoptionTotal,
        pendingAdoptions,
        cages: cageTotal,
        cageOccupancyPercent: occupancyPercent,
        medicalRecords: medicalTotal,
        medicalCostTotal: Number(
          (medicalCostAgg._sum.cost ?? 0).toFixed(2),
        ),
        activeNeeds: needsActive,
        users: usersTotal,
        newsletterSubscribers: newsletterActive,
      },
      animals: {
        totals: {
          total: animalTotal,
          seekingHome,
          found:
            animalsByStatus.find((row) => row.status === AnimalStatus.ZNALEZIONY)
              ?._count._all ?? 0,
          inAdoption:
            animalsByStatus.find(
              (row) => row.status === AnimalStatus.W_TRAKCIE_ADOPCJI,
            )?._count._all ?? 0,
          adopted:
            animalsByStatus.find(
              (row) => row.status === AnimalStatus.ADOPTOWANY,
            )?._count._all ?? 0,
        },
        byStatus: countByEnum(
          animalsByStatus.map((row) => ({
            key: row.status,
            _count: row._count,
          })),
          Object.values(AnimalStatus),
        ),
        byType: countByEnum(
          animalsByType.map((row) => ({
            key: row.type,
            _count: row._count,
          })),
          Object.values(AnimalType),
        ),
        byHealth: countByEnum(
          animalsByHealth.map((row) => ({
            key: row.healthStatus,
            _count: row._count,
          })),
          Object.values(AnimalHealthStatus),
        ),
        newByMonth: animalsMonthWindow.months.map(({ month, count }) => ({
          month,
          count,
        })),
      },
      adoptions: {
        totals: {
          total: adoptionTotal,
          pending: pendingAdoptions,
          accepted:
            adoptionsByStatus.find(
              (row) => row.status === AdoptionStatus.ZAAKCEPTOWANA,
            )?._count._all ?? 0,
          rejected:
            adoptionsByStatus.find(
              (row) => row.status === AdoptionStatus.ODRZUCONA,
            )?._count._all ?? 0,
          canceled:
            adoptionsByStatus.find(
              (row) => row.status === AdoptionStatus.ANULOWANA,
            )?._count._all ?? 0,
          completed:
            adoptionsByStatus.find(
              (row) => row.status === AdoptionStatus.ZAKONCZONA,
            )?._count._all ?? 0,
        },
        byStatus: countByEnum(
          adoptionsByStatus.map((row) => ({
            key: row.status,
            _count: row._count,
          })),
          Object.values(AdoptionStatus),
        ),
        newByMonth: adoptionsMonthWindow.months.map(({ month, count }) => ({
          month,
          count,
        })),
      },
      cages: {
        totals: {
          total: cageTotal,
          occupied: occupiedCages,
          free: cageFree,
          occupancyPercent,
        },
        byZone: [...cagesByZoneMap.values()].sort((a, b) =>
          a.zone.localeCompare(b.zone),
        ),
      },
      medical: {
        totals: {
          total: medicalTotal,
          toDo:
            medicalByStatus.find(
              (row) => row.status === MedicalRecordStatus.DO_REALIZACJI,
            )?._count._all ?? 0,
          inProgress:
            medicalByStatus.find(
              (row) => row.status === MedicalRecordStatus.W_TRAKCIE,
            )?._count._all ?? 0,
          done:
            medicalByStatus.find(
              (row) => row.status === MedicalRecordStatus.ZREALIZOWANA,
            )?._count._all ?? 0,
          costTotal: Number((medicalCostAgg._sum.cost ?? 0).toFixed(2)),
        },
        byStatus: countByEnum(
          medicalByStatus.map((row) => ({
            key: row.status,
            _count: row._count,
          })),
          Object.values(MedicalRecordStatus),
        ),
        byType: countByEnum(
          medicalByType.map((row) => ({
            key: row.type,
            _count: row._count,
          })),
          Object.values(MedicalRecordType),
        ),
        costByMonth: medicalCostRows.map((item) => ({
          month: item.month,
          cost: Number(item.cost.toFixed(2)),
        })),
      },
      needs: {
        totals: {
          active: needsActive,
          inactive: needsInactive,
          total: needsActive + needsInactive,
        },
        byCategory: countByEnum(
          needsByCategory.map((row) => ({
            key: row.category,
            _count: row._count,
          })),
          Object.values(AnimalNeedCategory),
        ),
      },
      users: {
        totals: {
          total: usersTotal,
          banned: usersBanned,
          formFilled: usersFormFilled,
          newsletterSubscribers: newsletterActive,
        },
      },
    });
  } catch (err) {
    console.error('[getShelterStats]', err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

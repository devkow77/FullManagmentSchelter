import { StatusCodes } from 'http-status-codes';
import { type Request, type Response } from 'express';
import prisma from '../prisma';
import { Role } from '../generated/prisma/enums';

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 31;

/** Store as UTC noon to avoid timezone day-shifts. */
const parseDateOnly = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year!, month! - 1, day!, 12, 0, 0));
};

const toDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const toUtcDateKey = (date: Date) => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDayMonthUtc = (date: Date) => {
  const day = date.getUTCDate();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${day}.${month}`;
};

const formatDaysRangesLabel = (dates: Date[]) => {
  const unique = [
    ...new Map(
      dates.map((date) => [toUtcDateKey(date), date] as const),
    ).values(),
  ].sort((a, b) => a.getTime() - b.getTime());

  if (unique.length === 0) return '';

  const parts: string[] = [];
  let rangeStart = unique[0]!;
  let rangeEnd = unique[0]!;

  const pushRange = () => {
    if (toUtcDateKey(rangeStart) === toUtcDateKey(rangeEnd)) {
      parts.push(formatDayMonthUtc(rangeStart));
      return;
    }
    parts.push(
      `${formatDayMonthUtc(rangeStart)}–${formatDayMonthUtc(rangeEnd)}`,
    );
  };

  for (let i = 1; i < unique.length; i++) {
    const current = unique[i]!;
    const expectedNext = new Date(rangeEnd);
    expectedNext.setUTCDate(expectedNext.getUTCDate() + 1);

    if (toUtcDateKey(current) === toUtcDateKey(expectedNext)) {
      rangeEnd = current;
      continue;
    }

    pushRange();
    rangeStart = current;
    rangeEnd = current;
  }

  pushRange();
  return parts.join(', ');
};

const startOfWeekMonday = (input: Date) => {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
};

const endOfWeekSunday = (weekStart: Date) => {
  const date = new Date(weekStart);
  date.setDate(date.getDate() + 6);
  date.setHours(23, 59, 59, 999);
  return date;
};

const eachDateInRange = (from: Date, to: Date) => {
  const dates: Date[] = [];
  const cursor = new Date(from);
  const endKey = toUtcDateKey(to);

  while (toUtcDateKey(cursor) <= endKey) {
    dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
};

const formatWeekLabel = (from: Date, to: Date) =>
  `${from.toLocaleDateString('pl-PL')} – ${to.toLocaleDateString('pl-PL')}`;

export const assignZoneRange = async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      workerIds?: unknown;
      workerId?: unknown;
      zone?: unknown;
      dateFrom?: unknown;
      dateTo?: unknown;
      confirm?: unknown;
    };

    const rawWorkerIds = Array.isArray(body.workerIds)
      ? body.workerIds
      : body.workerId != null
        ? [body.workerId]
        : [];

    const workerIds = [
      ...new Set(
        rawWorkerIds
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    ];

    const zone =
      typeof body.zone === 'string' ? body.zone.trim().toUpperCase() : '';
    const dateFromRaw =
      typeof body.dateFrom === 'string' ? body.dateFrom.trim() : '';
    const dateToRaw = typeof body.dateTo === 'string' ? body.dateTo.trim() : '';

    if (workerIds.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Wybierz co najmniej jednego pracownika.',
      });
    }

    if (!/^[A-Z]$/.test(zone)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Strefa musi być jedną literą (np. A, B, C).',
      });
    }

    if (!DATE_ONLY_RE.test(dateFromRaw) || !DATE_ONLY_RE.test(dateToRaw)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Podaj poprawny zakres dat (RRRR-MM-DD).',
      });
    }

    const dateFrom = parseDateOnly(dateFromRaw);
    const dateTo = parseDateOnly(dateToRaw);

    if (Number.isNaN(dateFrom.getTime()) || Number.isNaN(dateTo.getTime())) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Podaj poprawny zakres dat.',
      });
    }

    if (dateFrom > dateTo) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Data początkowa nie może być późniejsza niż końcowa.',
      });
    }

    const todayKey = toDateKey(new Date());
    if (dateFromRaw < todayKey) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Nie można przypisywać stref do dni z przeszłości.',
      });
    }

    const dayCount =
      Math.floor((dateTo.getTime() - dateFrom.getTime()) / 86_400_000) + 1;
    if (dayCount > MAX_RANGE_DAYS) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: `Zakres może obejmować maksymalnie ${MAX_RANGE_DAYS} dni.`,
      });
    }

    const workers = await prisma.user.findMany({
      where: {
        id: { in: workerIds },
        role: Role.PRACOWNIK,
      },
      select: { id: true, fullName: true },
    });

    if (workers.length !== workerIds.length) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: 'Nie znaleziono jednego lub więcej pracowników.',
      });
    }

    const dates = eachDateInRange(dateFrom, dateTo);
    const confirm = body.confirm === true;

    // Konflikt tylko gdy ci sami pracownicy mają już TĘ SAMĄ strefę (inne strefy mogą współistnieć)
    const existingSameZone = await prisma.dailyZoneAssignment.findMany({
      where: {
        workerId: { in: workerIds },
        zone,
      },
      select: {
        date: true,
        zone: true,
        workerId: true,
        worker: {
          select: { fullName: true },
        },
      },
      orderBy: [{ workerId: 'asc' }, { date: 'asc' }],
    });

    if (existingSameZone.length > 0 && !confirm) {
      const newDaysLabel = formatDaysRangesLabel(dates);
      const newZoneLabel = newDaysLabel ? `${zone} (${newDaysLabel})` : zone;

      const byWorker = new Map<
        number,
        { fullName: string; dates: Date[] }
      >();

      for (const assignment of existingSameZone) {
        const entry = byWorker.get(assignment.workerId) ?? {
          fullName: assignment.worker.fullName,
          dates: [],
        };
        entry.dates.push(assignment.date);
        byWorker.set(assignment.workerId, entry);
      }

      const conflicts = [...byWorker.entries()].map(([workerId, entry]) => {
        const daysLabel = formatDaysRangesLabel(entry.dates);
        const currentLabel = daysLabel ? `${zone} (${daysLabel})` : zone;

        return {
          workerId,
          fullName: entry.fullName,
          currentLabel,
          newLabel: newZoneLabel,
          summary: `${entry.fullName}: ${currentLabel} → ${newZoneLabel}`,
        };
      });

      return res.status(StatusCodes.CONFLICT).json({
        requiresConfirmation: true,
        msg: 'Wybrani pracownicy mają już przypisaną tę strefę.',
        conflicts,
      });
    }

    const payload = dates.flatMap((date) =>
      workerIds.map((workerId) => ({
        date,
        zone,
        workerId,
      })),
    );

    // Usuń tylko tę strefę u wybranych pracowników (inne ich strefy zostają), potem zapisz nowy zakres
    await prisma.$transaction([
      prisma.dailyZoneAssignment.deleteMany({
        where: {
          workerId: { in: workerIds },
          zone,
        },
      }),
      prisma.dailyZoneAssignment.createMany({ data: payload }),
    ]);

    const names = workers.map((worker) => worker.fullName).join(', ');

    return res.status(StatusCodes.OK).json({
      msg:
        workers.length === 1
          ? `Przypisano strefę ${zone} pracownikowi ${names} na ${dates.length} dni.`
          : `Przypisano strefę ${zone} pracownikom (${names}) na ${dates.length} dni.`,
      assignedDays: dates.length,
      zone,
      workerIds,
    });
  } catch (err) {
    console.error('[assignZoneRange]', err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

export const getWorkersZoneOverview = async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentWeekStart = startOfWeekMonday(today);
    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    const twoWeeksAgoStart = new Date(currentWeekStart);
    twoWeeksAgoStart.setDate(twoWeeksAgoStart.getDate() - 14);

    const weeks = {
      current: {
        from: toDateKey(currentWeekStart),
        to: toDateKey(endOfWeekSunday(currentWeekStart)),
        label: formatWeekLabel(
          currentWeekStart,
          endOfWeekSunday(currentWeekStart),
        ),
      },
      next: {
        from: toDateKey(nextWeekStart),
        to: toDateKey(endOfWeekSunday(nextWeekStart)),
        label: formatWeekLabel(nextWeekStart, endOfWeekSunday(nextWeekStart)),
      },
      previous: {
        from: toDateKey(previousWeekStart),
        to: toDateKey(endOfWeekSunday(previousWeekStart)),
        label: formatWeekLabel(
          previousWeekStart,
          endOfWeekSunday(previousWeekStart),
        ),
      },
      twoWeeksAgo: {
        from: toDateKey(twoWeeksAgoStart),
        to: toDateKey(endOfWeekSunday(twoWeeksAgoStart)),
        label: formatWeekLabel(
          twoWeeksAgoStart,
          endOfWeekSunday(twoWeeksAgoStart),
        ),
      },
    };

    const rangeStart = twoWeeksAgoStart;
    const rangeEnd = endOfWeekSunday(nextWeekStart);

    const [workers, assignments, cages] = await Promise.all([
      prisma.user.findMany({
        where: { role: Role.PRACOWNIK },
        select: {
          id: true,
          fullName: true,
          imageUrl: true,
          role: true,
        },
        orderBy: { fullName: 'asc' },
      }),
      prisma.dailyZoneAssignment.findMany({
        where: {
          date: {
            gte: rangeStart,
            lte: rangeEnd,
          },
        },
        select: {
          date: true,
          zone: true,
          workerId: true,
          worker: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      }),
      prisma.cage.findMany({
        select: { zone: true },
        orderBy: { zone: 'asc' },
      }),
    ]);

    const workerNameById = new Map(
      workers.map((worker) => [worker.id, worker.fullName] as const),
    );

    const zonesForWeek = (
      workerId: number,
      weekStart: Date,
      weekEnd: Date,
    ) => {
      const datesByZone = new Map<string, Date[]>();

      for (const assignment of assignments) {
        if (assignment.workerId !== workerId) continue;
        const date = new Date(assignment.date);
        if (date < weekStart || date > weekEnd) continue;

        const existing = datesByZone.get(assignment.zone) ?? [];
        existing.push(date);
        datesByZone.set(assignment.zone, existing);
      }

      return [...datesByZone.entries()]
        .sort(([zoneA], [zoneB]) => zoneA.localeCompare(zoneB))
        .map(([zone, zoneDates]) => {
          const daysLabel = formatDaysRangesLabel(zoneDates);
          return {
            zone,
            dates: [
              ...new Set(zoneDates.map((date) => toUtcDateKey(date))),
            ].sort(),
            label: daysLabel ? `${zone} (${daysLabel})` : zone,
          };
        });
    };

    const weekDayKeys = (weekStart: Date) => {
      const keys: string[] = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        keys.push(toDateKey(day));
      }
      return keys;
    };

    const coverageForZoneWeek = (
      zone: string,
      weekStart: Date,
      weekEnd: Date,
    ) => {
      const allDays = weekDayKeys(weekStart);
      const coveredDays = new Set<string>();
      const datesByWorker = new Map<number, Date[]>();

      for (const assignment of assignments) {
        if (assignment.zone !== zone) continue;
        const date = new Date(assignment.date);
        if (date < weekStart || date > weekEnd) continue;

        const dayKey = toUtcDateKey(date);
        coveredDays.add(dayKey);

        const existing = datesByWorker.get(assignment.workerId) ?? [];
        existing.push(date);
        datesByWorker.set(assignment.workerId, existing);
      }

      const uncoveredDates = allDays.filter((day) => !coveredDays.has(day));
      const uncoveredLabel = formatDaysRangesLabel(
        uncoveredDates.map((day) => parseDateOnly(day)),
      );

      const assignedWorkers = [...datesByWorker.entries()]
        .sort(([, datesA], [, datesB]) => {
          const minA = Math.min(...datesA.map((d) => d.getTime()));
          const minB = Math.min(...datesB.map((d) => d.getTime()));
          return minA - minB;
        })
        .map(([workerId, workerDates]) => {
          const fullName =
            workerNameById.get(workerId) ??
            assignments.find((a) => a.workerId === workerId)?.worker.fullName ??
            `Pracownik #${workerId}`;
          const daysLabel = formatDaysRangesLabel(workerDates);
          return {
            id: workerId,
            fullName,
            dates: [
              ...new Set(workerDates.map((date) => toUtcDateKey(date))),
            ].sort(),
            label: daysLabel ? `${fullName} (${daysLabel})` : fullName,
          };
        });

      return {
        uncoveredDates,
        uncoveredLabel,
        workers: assignedWorkers,
      };
    };

    const currentEnd = endOfWeekSunday(currentWeekStart);
    const nextEnd = endOfWeekSunday(nextWeekStart);
    const previousEnd = endOfWeekSunday(previousWeekStart);
    const twoWeeksAgoEnd = endOfWeekSunday(twoWeeksAgoStart);

    const assignmentZones = [
      ...new Set(assignments.map((assignment) => assignment.zone)),
    ];
    const allZones = [
      ...new Set([...cages.map((cage) => cage.zone), ...assignmentZones]),
    ].sort((a, b) => a.localeCompare(b));

    return res.status(StatusCodes.OK).json({
      weeks,
      workers: workers.map((worker) => ({
        id: worker.id,
        fullName: worker.fullName,
        imageUrl: worker.imageUrl,
        role: worker.role,
        currentWeekZones: zonesForWeek(
          worker.id,
          currentWeekStart,
          currentEnd,
        ),
        nextWeekZones: zonesForWeek(worker.id, nextWeekStart, nextEnd),
        previousWeekZones: zonesForWeek(
          worker.id,
          previousWeekStart,
          previousEnd,
        ),
        twoWeeksAgoZones: zonesForWeek(
          worker.id,
          twoWeeksAgoStart,
          twoWeeksAgoEnd,
        ),
      })),
      zones: allZones.map((zone) => ({
        zone,
        currentWeek: coverageForZoneWeek(zone, currentWeekStart, currentEnd),
        nextWeek: coverageForZoneWeek(zone, nextWeekStart, nextEnd),
        previousWeek: coverageForZoneWeek(
          zone,
          previousWeekStart,
          previousEnd,
        ),
        twoWeeksAgo: coverageForZoneWeek(
          zone,
          twoWeeksAgoStart,
          twoWeeksAgoEnd,
        ),
      })),
    });
  } catch (err) {
    console.error('[getWorkersZoneOverview]', err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

/** Czy w aktualnym tygodniu (pn–nd) każda strefa ma pokrycie na każdy dzień. */
export const getCurrentWeekCoverageStatus = async (
  _req: Request,
  res: Response,
) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = startOfWeekMonday(today);
    const weekEnd = endOfWeekSunday(weekStart);

    const [cages, assignments] = await Promise.all([
      prisma.cage.findMany({
        select: { zone: true },
      }),
      prisma.dailyZoneAssignment.findMany({
        where: {
          date: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
        select: {
          date: true,
          zone: true,
        },
      }),
    ]);

    const zones = [...new Set(cages.map((cage) => cage.zone))].sort((a, b) =>
      a.localeCompare(b),
    );

    if (zones.length === 0) {
      return res.status(StatusCodes.OK).json({ allZonesCovered: true });
    }

    const weekDays: string[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      weekDays.push(toDateKey(day));
    }

    const covered = new Set(
      assignments.map(
        (assignment) =>
          `${assignment.zone}|${toUtcDateKey(new Date(assignment.date))}`,
      ),
    );

    const allZonesCovered = zones.every((zone) =>
      weekDays.every((day) => covered.has(`${zone}|${day}`)),
    );

    return res.status(StatusCodes.OK).json({ allZonesCovered });
  } catch (err) {
    console.error('[getCurrentWeekCoverageStatus]', err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wewnętrzny błąd serwera!',
    });
  }
};

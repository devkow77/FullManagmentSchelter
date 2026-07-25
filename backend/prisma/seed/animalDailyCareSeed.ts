import prisma from '../../src/prisma';
import { AnimalStatus } from '../../src/generated/prisma/enums';

const startOfDay = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const hoursAgo = (hours: number): Date => {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date;
};

const animalDailyCareSeed = async () => {
  console.log('Seedowanie dziennej opieki zwierząt...');

  await prisma.animalDailyCare.deleteMany();

  const workers = await prisma.user.findMany({
    where: { role: 'PRACOWNIK' },
    orderBy: { id: 'asc' },
  });

  const animals = await prisma.animal.findMany({
    where: { status: { not: AnimalStatus.ADOPTOWANY } },
    orderBy: { id: 'asc' },
  });

  if (workers.length < 1 || animals.length < 5) {
    throw new Error(
      'Brak pracowników lub zwierząt do seedowania dziennej opieki.',
    );
  }

  const [workerA, workerB] = workers;
  const today = startOfDay(new Date());
  const yesterday = startOfDay(new Date());
  yesterday.setDate(yesterday.getDate() - 1);

  const todayMorning = hoursAgo(4);
  const todayNoon = hoursAgo(2);
  const todayAfternoon = hoursAgo(1);

  const dailyCare = [
    // Wczoraj — wszystkie zwierzęta w schronisku odznaczone
    ...animals.map((animal, index) => ({
      animalId: animal.id,
      date: yesterday,
      fed: true,
      watered: true,
      cleaned: true,
      fedById: index % 2 === 0 ? workerA!.id : workerB!.id,
      wateredById: index % 2 === 0 ? workerB!.id : workerA!.id,
      cleanedById: index % 2 === 0 ? workerA!.id : workerB!.id,
      fedAt: new Date(yesterday.getTime() + 8 * 60 * 60 * 1000),
      wateredAt: new Date(yesterday.getTime() + 14 * 60 * 60 * 1000),
      cleanedAt: new Date(yesterday.getTime() + 16 * 60 * 60 * 1000),
    })),
    // Dziś — różne stany postępu
    {
      animalId: animals[0]!.id,
      date: today,
      fed: true,
      watered: true,
      cleaned: true,
      fedById: workerA!.id,
      wateredById: workerA!.id,
      cleanedById: workerB!.id,
      fedAt: todayMorning,
      wateredAt: todayNoon,
      cleanedAt: todayAfternoon,
    },
    {
      animalId: animals[1]!.id,
      date: today,
      fed: true,
      watered: false,
      cleaned: true,
      fedById: workerB!.id,
      cleanedById: workerA!.id,
      fedAt: todayMorning,
      cleanedAt: todayAfternoon,
    },
    {
      animalId: animals[2]!.id,
      date: today,
      fed: false,
      watered: true,
      cleaned: false,
      wateredById: workerA!.id,
      wateredAt: todayNoon,
    },
    ...animals.slice(3).map((animal) => ({
      animalId: animal.id,
      date: today,
      fed: false,
      watered: false,
      cleaned: false,
    })),
  ];

  await prisma.animalDailyCare.createMany({ data: dailyCare });

  console.log(
    `✓ Seedowanie zakończone. Dodano ${dailyCare.length} wpisów dziennej opieki.`,
  );
};

export default animalDailyCareSeed;

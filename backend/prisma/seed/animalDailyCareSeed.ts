import prisma from '../../src/prisma';
import { AnimalStatus } from '../../src/generated/prisma/enums';

const startOfDay = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const animalDailyCareSeed = async () => {
  console.log('Seedowanie dziennej opieki zwierząt...');

  await prisma.animalDailyCare.deleteMany();

  const animals = await prisma.animal.findMany({
    where: { status: { not: AnimalStatus.ADOPTOWANY } },
    orderBy: { id: 'asc' },
  });

  if (animals.length < 5) {
    throw new Error('Brak zwierząt do seedowania dziennej opieki.');
  }

  const today = startOfDay(new Date());
  const yesterday = startOfDay(new Date());
  yesterday.setDate(yesterday.getDate() - 1);

  const dailyCare = [
    // Wczoraj — wszystkie zwierzęta w schronisku odznaczone
    ...animals.map((animal) => ({
      animalId: animal.id,
      date: yesterday,
      fed: true,
      watered: true,
      cleaned: true,
      fedAt: new Date(yesterday.getTime() + 8 * 60 * 60 * 1000),
      wateredAt: new Date(yesterday.getTime() + 14 * 60 * 60 * 1000),
      cleanedAt: new Date(yesterday.getTime() + 16 * 60 * 60 * 1000),
    })),
    // Dziś — nic jeszcze nie wykonane
    ...animals.map((animal) => ({
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

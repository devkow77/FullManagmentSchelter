import prisma from '../../src/prisma';
import seedUsers from './usersSeed';
import cagesSeed from './cagesSeed';
import seedAnimals from './animalsSeed';
import animalNeedsSeed from './animalNeedsSeed';
import vetsSeed from './vetsSeed';
import medicalRecordsSeed from './medicalRecordsSeed';
import adoptionsSeed from './adoptionsSeed';
import animalDailyCareSeed from './animalDailyCareSeed';
import dailyZoneAssignmentsSeed from './dailyZoneAssignmentsSeed';

async function main() {
  console.log('Start seedowania bazy...');

  await seedUsers();
  await cagesSeed();
  await seedAnimals();
  await animalNeedsSeed();
  await vetsSeed();
  await medicalRecordsSeed();
  await adoptionsSeed();
  await animalDailyCareSeed();
  await dailyZoneAssignmentsSeed();

  console.log('✓ Seedowanie zakończone');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

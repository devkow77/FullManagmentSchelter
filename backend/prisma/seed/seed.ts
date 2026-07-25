import prisma from '../../src/prisma';
import seedUsers from './usersSeed';
import seedAnimals from './animalsSeed';
import animalNeedsSeed from './animalNeedsSeed';
import vetsSeed from './vetsSeed';
import medicalRecordsSeed from './medicalRecordsSeed';
import adoptionsSeed from './adoptionsSeed';
import animalDailyCareSeed from './animalDailyCareSeed';

async function main() {
  console.log('Start seedowania bazy...');

  await seedUsers();
  await seedAnimals();
  await animalNeedsSeed();
  await vetsSeed();
  await medicalRecordsSeed();
  await adoptionsSeed();
  await animalDailyCareSeed();

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

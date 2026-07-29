import prisma from '../../src/prisma';

const dailyZoneAssignmentsSeed = async () => {
  console.log('Czyszczenie przypisań stref (bez seedowania historii)...');

  await prisma.dailyZoneAssignment.deleteMany();

  console.log(
    '✓ Seedowanie zakończone. Tabela przypisań stref jest pusta — grafiki ustawiasz w panelu.',
  );
};

export default dailyZoneAssignmentsSeed;

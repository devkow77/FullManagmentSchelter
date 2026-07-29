import prisma from '../../src/prisma';

const ZONES = ['A', 'B', 'C', 'D'] as const;
const CAGES_PER_ZONE = 20;

const cagesSeed = async () => {
  console.log('Seedowanie klatek...');

  await prisma.dailyZoneAssignment.deleteMany();
  await prisma.animal.updateMany({ data: { cageId: null } });
  await prisma.cage.deleteMany();

  const cages = ZONES.flatMap((zone) =>
    Array.from({ length: CAGES_PER_ZONE }, (_, index) => ({
      zone,
      number: index + 1,
    })),
  );

  await prisma.cage.createMany({ data: cages });

  console.log(
    `✓ Seedowanie zakończone. Dodano ${cages.length} klatek (${ZONES.join(', ')} × ${CAGES_PER_ZONE}).`,
  );
};

export default cagesSeed;
export { ZONES, CAGES_PER_ZONE };

import prisma from '../../src/prisma';

const vetsSeed = async () => {
  console.log('Seedowanie weterynarzy...');

  await prisma.vet.deleteMany();

  await prisma.vet.createMany({
    data: [
      {
        name: 'dr Anna Kowalczyk',
        phone: '123456789',
        clinic: 'Przychodnia Weterynaryjna „Azyl” Rzeszów',
      },
      {
        name: 'dr Piotr Nowak',
        phone: '627183910',
        clinic: 'Centrum Medycyny Weterynaryjnej Kraków',
      },
      {
        name: 'dr Maria Wiśniewska',
        phone: '482710129',
        clinic: 'Mobilna opieka weterynaryjna',
      },
    ],
  });

  console.log('✓ Seed weterynarzy zakończony');
};

export default vetsSeed;

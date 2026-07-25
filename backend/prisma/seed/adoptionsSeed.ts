import prisma from '../../src/prisma';
import { AdoptionStatus } from '../../src/generated/prisma/enums';

const adoptionsSeed = async () => {
  console.log('Seedowanie adopcji...');

  await prisma.adoption.deleteMany();

  const users = await prisma.user.findMany({
    where: { role: 'UZYTKOWNIK', isBanned: false },
    orderBy: { id: 'asc' },
  });

  const workers = await prisma.user.findMany({
    where: { role: 'PRACOWNIK' },
    orderBy: { id: 'asc' },
  });

  const animals = await prisma.animal.findMany({ orderBy: { id: 'asc' } });

  if (users.length < 1 || animals.length < 5 || workers.length < 1) {
    throw new Error('Brak użytkowników, pracowników lub zwierząt do seedowania adopcji.');
  }

  const worker = workers[0]!;
  const primaryUser = users[0]!;
  const secondaryUser = users[1] ?? primaryUser;

  const adoptions = [
    {
      userId: primaryUser.id,
      animalId: animals[0]!.id,
      status: AdoptionStatus.OCZEKUJACA,
      message: 'Mam duży ogród i doświadczenie z psami.',
    },
    {
      userId: secondaryUser.id,
      animalId: animals[1]!.id,
      status: AdoptionStatus.ZAAKCEPTOWANA,
      message: 'Szukam spokojnego kota do mieszkania.',
      employeeNote: 'Spotkanie wstępne pozytywne — czeka na odbiór.',
      processedById: worker.id,
    },
    {
      userId: primaryUser.id,
      animalId: animals[2]!.id,
      status: AdoptionStatus.ODRZUCONA,
      message: 'Chciałbym adoptować królika dla dzieci.',
      employeeNote: 'Brak odpowiednich warunków hodowlanych.',
      processedById: worker.id,
    },
    {
      userId: secondaryUser.id,
      animalId: animals[3]!.id,
      status: AdoptionStatus.ANULOWANA,
      message: 'Niestety zmieniła mi się sytuacja życiowa.',
      employeeNote: 'Anulowane na prośbę adoptującego.',
      processedById: worker.id,
    },
    {
      userId: primaryUser.id,
      animalId: animals[7]!.id,
      status: AdoptionStatus.ZAKONCZONA,
      message: 'Kot został odebrany — wszystko w porządku.',
      employeeNote: 'Odbiór potwierdzony, dokumentacja podpisana.',
      processedById: worker.id,
    },
    {
      userId: secondaryUser.id,
      animalId: animals[4]!.id,
      status: AdoptionStatus.OCZEKUJACA,
      message: 'Mam doświadczenie z egzotycznymi zwierzętami.',
    },
  ];

  await prisma.adoption.createMany({ data: adoptions });

  console.log(`✓ Seedowanie zakończone. Dodano ${adoptions.length} adopcji.`);
};

export default adoptionsSeed;

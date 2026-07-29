import prisma from '../../src/prisma';
import { AnimalNeedCategory, Role } from '../../src/generated/prisma/enums';

const animalNeedsSeed = async () => {
  console.log('Seedowanie potrzeb zwierząt...');

  await prisma.animalNeed.deleteMany();

  const animals = await prisma.animal.findMany({ orderBy: { id: 'asc' } });
  const workers = await prisma.user.findMany({
    where: { role: Role.PRACOWNIK },
    orderBy: { id: 'asc' },
    select: { id: true },
  });

  if (animals.length < 10) {
    throw new Error('Brak zwierząt do seedowania potrzeb.');
  }

  if (workers.length === 0) {
    throw new Error('Brak pracowników do seedowania potrzeb.');
  }

  const reporterId = (index: number) => workers[index % workers.length]!.id;

  const [burek, luna, puszek, chomiczek, zolwik, fretka, azor, mruczek, reksio, kicia] =
    animals;

  const needs = [
    {
      animalId: burek!.id,
      category: AnimalNeedCategory.JEDZENIE,
      name: 'Karma dla dużych psów',
      description: '2x dziennie, ok. 350 g porcja.',
      reportedById: reporterId(0),
    },
    {
      animalId: burek!.id,
      category: AnimalNeedCategory.WYPOSAZENIE,
      name: 'Duża miska na wodę',
      description: 'Uzupełniać minimum 2 razy dziennie.',
      reportedById: reporterId(1),
    },
    {
      animalId: luna!.id,
      category: AnimalNeedCategory.JEDZENIE,
      name: 'Karma dla kotów dorosłych',
      description: 'Sucha karma, 2x dziennie po 50 g.',
      reportedById: reporterId(2),
    },
    {
      animalId: luna!.id,
      category: AnimalNeedCategory.WYPOSAZENIE,
      name: 'Żwirek',
      description: 'Wymiana co 2–3 dni, żwirek bentonitowy.',
      reportedById: reporterId(0),
    },
    {
      animalId: puszek!.id,
      category: AnimalNeedCategory.JEDZENIE,
      name: 'Siano i karma dla królików',
      description: 'Świeże siano bez ograniczeń, granulat 80 g dziennie.',
      reportedById: reporterId(1),
    },
    {
      animalId: chomiczek!.id,
      category: AnimalNeedCategory.JEDZENIE,
      name: 'Mieszanka dla chomików',
      description: '1 łyżka stołowa rano i wieczorem.',
      reportedById: reporterId(2),
    },
    {
      animalId: chomiczek!.id,
      category: AnimalNeedCategory.WYPOSAZENIE,
      name: 'Kołowrotek',
      description: 'Sprawdzać codziennie — musi być sprawny.',
      reportedById: reporterId(3),
    },
    {
      animalId: zolwik!.id,
      category: AnimalNeedCategory.OPIEKA,
      name: 'Lampa UVB',
      description: 'Włączać 10–12 h dziennie, wymienić żarówkę co 6 miesięcy.',
      reportedById: reporterId(0),
    },
    {
      animalId: zolwik!.id,
      category: AnimalNeedCategory.JEDZENIE,
      name: 'Warzywa i zioła',
      description: 'Sałata rzymska, jarmuż — codziennie mała porcja.',
      reportedById: reporterId(1),
    },
    {
      animalId: fretka!.id,
      category: AnimalNeedCategory.OPIEKA,
      name: 'Codzienny spacer poza klatką',
      description: 'Minimum 1 h pod nadzorem pracownika.',
      reportedById: reporterId(2),
    },
    {
      animalId: azor!.id,
      category: AnimalNeedCategory.LEKI,
      name: 'Antybiotyk',
      description: '1 tabletka rano i wieczorem z jedzeniem.',
      reportedById: reporterId(0),
    },
    {
      animalId: azor!.id,
      category: AnimalNeedCategory.JEDZENIE,
      name: 'Karma weterynaryjna',
      description: 'Łatwo strawna, małe porcje 3x dziennie.',
      reportedById: reporterId(1),
    },
    {
      animalId: mruczek!.id,
      category: AnimalNeedCategory.JEDZENIE,
      name: 'Karma dla kotów',
      description: 'Nieaktywne — zwierzę adoptowane.',
      isActive: false,
      reportedById: reporterId(2),
    },
    {
      animalId: reksio!.id,
      category: AnimalNeedCategory.OPIEKA,
      name: 'Izolacja',
      description: 'Osobna klatka/boks — brak kontaktu z innymi psami.',
      reportedById: reporterId(3),
    },
    {
      animalId: reksio!.id,
      category: AnimalNeedCategory.LEKI,
      name: 'Leczenie przeciwwirusowe',
      description: 'Podawać zgodnie z kartą leczenia weterynarza.',
      reportedById: reporterId(0),
    },
    {
      animalId: kicia!.id,
      category: AnimalNeedCategory.LEKI,
      name: 'Środek uspokajający przedoperacyjny',
      description: 'Podawać wieczorem przed planowaną operacją.',
      reportedById: reporterId(1),
    },
    {
      animalId: kicia!.id,
      category: AnimalNeedCategory.OPIEKA,
      name: 'Spokojne miejsce odpoczynku',
      description: 'Ograniczyć hałas i kontakt z innymi zwierzętami.',
      reportedById: reporterId(2),
    },
    {
      animalId: kicia!.id,
      category: AnimalNeedCategory.JEDZENIE,
      name: 'Karma mokra dla kotów',
      description: 'Małe porcje, łatwo strawne.',
      reportedById: reporterId(3),
    },
  ];

  await prisma.animalNeed.createMany({ data: needs });

  console.log(`✓ Seedowanie zakończone. Dodano ${needs.length} potrzeb zwierząt.`);
};

export default animalNeedsSeed;

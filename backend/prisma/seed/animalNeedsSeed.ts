import prisma from '../../src/prisma';
import { AnimalNeedCategory } from '../../src/generated/prisma/enums';

const animalNeedsSeed = async () => {
  console.log('Seedowanie potrzeb zwierząt...');

  await prisma.animalNeed.deleteMany();

  const animals = await prisma.animal.findMany({ orderBy: { id: 'asc' } });

  if (animals.length < 10) {
    throw new Error('Brak zwierząt do seedowania potrzeb.');
  }

  const [burek, luna, puszek, chomiczek, zolwik, fretka, azor, mruczek, reksio, kicia] =
    animals;

  const needs = [
    {
      animalId: burek!.id,
      category: AnimalNeedCategory.JEDZENIE,
      name: 'Karma dla dużych psów',
      description: '2x dziennie, ok. 350 g porcja.',
    },
    {
      animalId: burek!.id,
      category: AnimalNeedCategory.WYPOSAZENIE,
      name: 'Duża miska na wodę',
      description: 'Uzupełniać minimum 2 razy dziennie.',
    },
    {
      animalId: luna!.id,
      category: AnimalNeedCategory.JEDZENIE,
      name: 'Karma dla kotów dorosłych',
      description: 'Sucha karma, 2x dziennie po 50 g.',
    },
    {
      animalId: luna!.id,
      category: AnimalNeedCategory.WYPOSAZENIE,
      name: 'Żwirek',
      description: 'Wymiana co 2–3 dni, żwirek bentonitowy.',
    },
    {
      animalId: puszek!.id,
      category: AnimalNeedCategory.JEDZENIE,
      name: 'Siano i karma dla królików',
      description: 'Świeże siano bez ograniczeń, granulat 80 g dziennie.',
    },
    {
      animalId: chomiczek!.id,
      category: AnimalNeedCategory.JEDZENIE,
      name: 'Mieszanka dla chomików',
      description: '1 łyżka stołowa rano i wieczorem.',
    },
    {
      animalId: chomiczek!.id,
      category: AnimalNeedCategory.WYPOSAZENIE,
      name: 'Kołowrotek',
      description: 'Sprawdzać codziennie — musi być sprawny.',
    },
    {
      animalId: zolwik!.id,
      category: AnimalNeedCategory.OPIEKA,
      name: 'Lampa UVB',
      description: 'Włączać 10–12 h dziennie, wymienić żarówkę co 6 miesięcy.',
    },
    {
      animalId: zolwik!.id,
      category: AnimalNeedCategory.JEDZENIE,
      name: 'Warzywa i zioła',
      description: 'Sałata rzymska, jarmuż — codziennie mała porcja.',
    },
    {
      animalId: fretka!.id,
      category: AnimalNeedCategory.OPIEKA,
      name: 'Codzienny spacer poza klatką',
      description: 'Minimum 1 h pod nadzorem pracownika.',
    },
    {
      animalId: azor!.id,
      category: AnimalNeedCategory.LEKI,
      name: 'Antybiotyk',
      description: '1 tabletka rano i wieczorem z jedzeniem.',
    },
    {
      animalId: azor!.id,
      category: AnimalNeedCategory.JEDZENIE,
      name: 'Karma weterynaryjna',
      description: 'Łatwo strawna, małe porcje 3x dziennie.',
    },
    {
      animalId: mruczek!.id,
      category: AnimalNeedCategory.JEDZENIE,
      name: 'Karma dla kotów',
      description: 'Nieaktywne — zwierzę adoptowane.',
      isActive: false,
    },
    {
      animalId: reksio!.id,
      category: AnimalNeedCategory.OPIEKA,
      name: 'Izolacja',
      description: 'Osobna klatka/boks — brak kontaktu z innymi psami.',
    },
    {
      animalId: reksio!.id,
      category: AnimalNeedCategory.LEKI,
      name: 'Leczenie przeciwwirusowe',
      description: 'Podawać zgodnie z kartą leczenia weterynarza.',
    },
    {
      animalId: kicia!.id,
      category: AnimalNeedCategory.LEKI,
      name: 'Środek uspokajający przedoperacyjny',
      description: 'Podawać wieczorem przed planowaną operacją.',
    },
    {
      animalId: kicia!.id,
      category: AnimalNeedCategory.OPIEKA,
      name: 'Spokojne miejsce odpoczynku',
      description: 'Ograniczyć hałas i kontakt z innymi zwierzętami.',
    },
    {
      animalId: kicia!.id,
      category: AnimalNeedCategory.JEDZENIE,
      name: 'Karma mokra dla kotów',
      description: 'Małe porcje, łatwo strawne.',
    },
  ];

  await prisma.animalNeed.createMany({ data: needs });

  console.log(`✓ Seedowanie zakończone. Dodano ${needs.length} potrzeb zwierząt.`);
};

export default animalNeedsSeed;

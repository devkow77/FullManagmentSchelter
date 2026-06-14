import prisma from '../../src/prisma';
import {
  MedicalRecordType,
  MedicalRecordStatus,
} from '../../src/generated/prisma/enums';

const medicalRecordsSeed = async () => {
  console.log('Seedowanie rekordów medycznych...');

  await prisma.medicalRecord.deleteMany();

  const animals = await prisma.animal.findMany({ orderBy: { id: 'asc' } });
  const vets = await prisma.vet.findMany({ orderBy: { id: 'asc' } });

  if (animals.length < 6 || vets.length < 2) {
    throw new Error(
      'Brak zwierząt lub weterynarzy do seedowania rekordów medycznych.',
    );
  }

  const records = [
    {
      animalId: animals[0]!.id,
      vetId: vets[0]!.id,
      type: MedicalRecordType.WIZYTA,
      description: 'Kontrola ogólna — stan dobry.',
      date: new Date('2025-12-01'),
      status: MedicalRecordStatus.DO_REALIZACJI,
      cost: 80,
    },
    {
      animalId: animals[6]!.id,
      vetId: vets[0]!.id,
      type: MedicalRecordType.BADANIE,
      description: 'Badanie krwi — lekkie anemia.',
      date: new Date('2026-01-10'),
      status: MedicalRecordStatus.W_TRAKCIE,
      cost: 150,
    },
    {
      animalId: animals[9]!.id,
      vetId: vets[1]!.id,
      type: MedicalRecordType.OPERACJA,
      description: 'Zaplanowana kastracja/sterylizacja.',
      date: new Date('2026-06-25'),
      status: MedicalRecordStatus.ZREALIZOWANA,
      cost: 450,
    },
    {
      animalId: animals[0]!.id,
      vetId: vets[0]!.id,
      type: MedicalRecordType.SZCZEPIENIE,
      description: 'Szczepienie przeciw wściekliźnie.',
      date: new Date('2025-11-15'),
      status: MedicalRecordStatus.DO_REALIZACJI,
      cost: 60,
    },
    {
      animalId: animals[8]!.id,
      vetId: vets[1]!.id,
      type: MedicalRecordType.URAZ,
      description: 'Skaleczenie łapy — opatrunek i antybiotyk.',
      date: new Date('2026-02-05'),
      status: MedicalRecordStatus.DO_REALIZACJI,
      cost: 120,
    },
    {
      animalId: animals[2]!.id,
      vetId: vets[2]!.id,
      type: MedicalRecordType.INNE,
      description: 'Konsultacja dietetyczna — karma specjalistyczna.',
      date: new Date('2026-03-01'),
      status: MedicalRecordStatus.DO_REALIZACJI,
      cost: 0,
    },
  ];

  await prisma.medicalRecord.createMany({ data: records });

  console.log(
    `Seedowanie zakończone. Dodano ${records.length} rekordów medycznych.`,
  );
};

export default medicalRecordsSeed;

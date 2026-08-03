import prisma from '../../src/prisma';
import bcrypt from 'bcrypt';
import { Gender, Role } from '../../src/generated/prisma/enums';

const usersSeed = async () => {
  const hashedPassword = await bcrypt.hash('Haslo12345.', 10);
  console.log('Seed użytkowników...');

  await prisma.animalNeed.deleteMany({});
  await prisma.animalDailyCare.deleteMany({});
  await prisma.medicalRecord.deleteMany({});
  await prisma.adoption.deleteMany({});
  await prisma.dailyZoneAssignment.deleteMany({});
  await prisma.user.deleteMany({});

  await prisma.user.createMany({
    data: [
      {
        fullName: 'Admin',
        email: 'admin@gmail.com',
        password: hashedPassword,
        role: Role.ADMINISTRATOR,
        isEmailVerified: true,
      },
      {
        fullName: 'Pracownik Ola',
        email: 'pracownik@gmail.com',
        password: hashedPassword,
        role: Role.PRACOWNIK,
        isEmailVerified: true,
      },
      {
        fullName: 'Pracownik Jan',
        email: 'pracownik2@gmail.com',
        password: hashedPassword,
        role: Role.PRACOWNIK,
        isEmailVerified: true,
      },
      {
        fullName: 'Pracownik Anna',
        email: 'pracownik3@gmail.com',
        password: hashedPassword,
        role: Role.PRACOWNIK,
        isEmailVerified: true,
      },
      {
        fullName: 'Pracownik Piotr',
        email: 'pracownik4@gmail.com',
        password: hashedPassword,
        role: Role.PRACOWNIK,
        isEmailVerified: true,
      },
      {
        fullName: 'Michał Kowalski',
        email: 'michal@gmail.com',
        password: hashedPassword,
        role: Role.UZYTKOWNIK,
        isEmailVerified: true,
      },
    ],
  });

  console.log('✓ Seed użytkowników zakończony');
};

export default usersSeed;

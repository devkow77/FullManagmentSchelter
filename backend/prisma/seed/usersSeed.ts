import prisma from '../../src/prisma';
import bcrypt from 'bcrypt';
import { Role } from '../../src/generated/prisma/enums';

// Domena example.com jest zarezerwowana przez RFC 2606 i nigdy nie dostarcza
// poczty, więc powiadomienia z aplikacji nie trafią do przypadkowych osób.
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
        fullName: 'Admin Anna Nowak',
        email: 'admin@example.com',
        password: hashedPassword,
        role: Role.ADMINISTRATOR,
        isEmailVerified: true,
      },
      {
        fullName: 'Admin Marek Zieliński',
        email: 'admin2@example.com',
        password: hashedPassword,
        role: Role.ADMINISTRATOR,
        isEmailVerified: true,
      },
      {
        fullName: 'Pracownik Ola',
        email: 'pracownik@example.com',
        password: hashedPassword,
        role: Role.PRACOWNIK,
        isEmailVerified: true,
      },
      {
        fullName: 'Pracownik Jan',
        email: 'pracownik2@example.com',
        password: hashedPassword,
        role: Role.PRACOWNIK,
        isEmailVerified: true,
      },
      {
        fullName: 'Michał Kowalski',
        email: 'michal@example.com',
        password: hashedPassword,
        role: Role.UZYTKOWNIK,
        isEmailVerified: true,
      },
      {
        fullName: 'Katarzyna Wiśniewska',
        email: 'katarzyna@example.com',
        password: hashedPassword,
        role: Role.UZYTKOWNIK,
        isEmailVerified: true,
      },
    ],
  });

  console.log('✓ Seed użytkowników zakończony');
};

export default usersSeed;

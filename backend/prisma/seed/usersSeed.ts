import prisma from '../../src/prisma';
import bcrypt from 'bcrypt';
import { Gender, Role } from '../../src/generated/prisma/enums';

const usersSeed = async () => {
  const hashedPassword = await bcrypt.hash('Haslo12345.', 10);
  console.log('Seed użytkowników...');

  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: [
      {
        fullName: 'Admin',
        email: 'admin@gmail.com',
        password: hashedPassword,
        role: Role.ADMINISTRATOR,
      },
      {
        fullName: 'Pracownik Ola',
        email: 'pracownik@gmail.com',
        password: hashedPassword,
        role: Role.PRACOWNIK,
      },
      {
        fullName: 'Pracownik Jan',
        email: 'pracownik2@gmail.com',
        password: hashedPassword,
        role: Role.PRACOWNIK,
      },
      {
        fullName: 'Michał Kowalski',
        email: 'michal@gmail.com',
        password: hashedPassword,
        role: Role.UZYTKOWNIK,
      },
    ],
  });

  console.log('✓ Seed użytkowników zakończony');
};

export default usersSeed;

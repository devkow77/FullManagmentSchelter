import cron from 'node-cron';
import prisma from '../prisma';
import { AdoptionStatus, AnimalStatus } from '../generated/prisma/enums';
import { triggerAdoptionStatusChangeEmail } from '../services/emailService';

/** Liczba dni od akceptacji wniosku na przyjście do schroniska */
export const ADOPTION_SHELTER_VISIT_DAYS = 7;

const EXPIRED_NOTE =
  'Wniosek anulowany automatycznie — upłynął 7-dniowy termin przyjścia do schroniska od decyzji schroniska.';

export const expireAcceptedAdoptions = async () => {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - ADOPTION_SHELTER_VISIT_DAYS);

  const expiredAdoptions = await prisma.adoption.findMany({
    where: {
      status: AdoptionStatus.ZAAKCEPTOWANA,
      acceptedAt: { lt: cutoff },
    },
    select: {
      id: true,
      animalId: true,
      user: {
        select: {
          email: true,
          fullName: true,
        },
      },
      animal: {
        select: {
          name: true,
        },
      },
    },
  });

  for (const adoption of expiredAdoptions) {
    await prisma.$transaction(async (tx) => {
      await tx.adoption.update({
        where: { id: adoption.id },
        data: {
          status: AdoptionStatus.ANULOWANA,
          employeeNote: EXPIRED_NOTE,
        },
      });

      await tx.animal.update({
        where: { id: adoption.animalId },
        data: { status: AnimalStatus.SZUKA_DOMU },
      });
    });

    triggerAdoptionStatusChangeEmail({
      email: adoption.user.email,
      userName: adoption.user.fullName,
      animalName: adoption.animal.name,
      kind: 'expired_no_visit',
      employeeNote: EXPIRED_NOTE,
    });
  }

  return expiredAdoptions.length;
};

export const startAdoptionExpiryJob = () => {
  cron.schedule(
    '0 0 * * *',
    async () => {
      console.log('Sprawdzanie terminów wizyt adopcyjnych...');

      try {
        const expiredCount = await expireAcceptedAdoptions();
        console.log(
          `Anulowano ${expiredCount} wniosków po upływie terminu wizyty`,
        );
      } catch (error) {
        console.error('Błąd anulowania wygasłych wniosków adopcyjnych:', error);
      }
    },
    { timezone: 'Europe/Warsaw' },
  );
};

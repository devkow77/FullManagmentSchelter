import { randomUUID } from 'crypto';
import { type Request, type Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import prisma from '../prisma';
import { subscribeSchema } from '../validators/newsletter.validator';
import { sendSubscriptionConfirmation, sendUnsubscribeConfirmation } from '../services/emailService';

export const subscribe = async (req: Request, res: Response) => {
  const parsedBody = subscribeSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowy format danych!',
    });
  }

  const { email } = parsedBody.data;

  try {
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing?.isActive) {
      return res.status(StatusCodes.OK).json({
        msg: 'Ten adres email jest już zapisany do newslettera!',
      });
    }

    const unsubscribeToken = randomUUID();

    if (existing) {
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: {
          isActive: true,
          consentAt: new Date(),
          unsubscribeToken,
        },
      });
    } else {
      await prisma.newsletterSubscriber.create({
        data: {
          email,
          unsubscribeToken,
        },
      });
    }

    try {
      await sendSubscriptionConfirmation(email, unsubscribeToken);
    } catch {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        msg: 'Zapisano, ale nie udało się wysłać maila potwierdzającego.',
      });
    }

    return res.status(StatusCodes.OK).json({
      msg: 'Pomyślnie zapisano do newslettera!',
    });
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wystąpił błąd podczas zapisywania do newslettera!',
    });
  }
};

export const unsubscribe = async (req: Request, res: Response) => {
  const token = req.params.token;

  if (!token || Array.isArray(token)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: 'Nieprawidłowy token!',
    });
  }

  try {
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!subscriber) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: 'Nie znaleziono subskrypcji newslettera!',
      });
    }

    if (!subscriber.isActive) {
      return res.status(StatusCodes.OK).json({
        msg: 'Ten adres email jest już wypisany z newslettera!',
      });
    }

    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: { isActive: false },
    });

    try {
      await sendUnsubscribeConfirmation(subscriber.email);
    } catch {
      return res.status(StatusCodes.OK).json({
        msg: 'Wypisano z newslettera, ale nie udało się wysłać maila potwierdzającego.',
      });
    }

    return res.status(StatusCodes.OK).json({
      msg: 'Pomyślnie wypisano z newslettera!',
    });
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Wystąpił błąd podczas wypisywania z newslettera!',
    });
  }
};
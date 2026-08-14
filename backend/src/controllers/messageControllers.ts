import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { contactSchema } from '../validators/message.validator';
import type { AuthRequest } from '../types';
import { sendContactFormEmail } from '../services/emailService';

export const sendContactMessage = async (req: AuthRequest, res: Response) => {
  const parsedBody = contactSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: 'Nieprawidłowy format danych!' });
  }

  const userRole = req.userRole;

  if (userRole == 'PRACOWNIK' || userRole == 'ADMINISTRATOR') {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: 'Tylko użytkownicy mogą wysyłać wiadomości!' });
  }

  const { fullName, email, message } = parsedBody.data;

  try {
    await sendContactFormEmail({ fullName, email, message });

    return res
      .status(StatusCodes.OK)
      .json({ msg: 'Wiadomość została wysłana pomyślnie!' });
  } catch (err) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: 'Wystąpił błąd podczas wysyłania wiadomości!' });
  }
};

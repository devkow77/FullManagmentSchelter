import nodemailer from 'nodemailer';
import type { Attachment } from 'nodemailer/lib/mailer';
import prisma from '../prisma';
import type { Animal, NewsletterSubscriber } from '../generated/prisma/client';
import { AnimalStatus } from '../generated/prisma/enums';
import {
  EMAIL_ANIMAL_IMAGE_CID,
  EMAIL_LOGO_CID,
  newAnimalTemplate,
  newAnimalText,
  subscriptionConfirmationTemplate,
  subscriptionConfirmationText,
  unsubscribeConfirmationTemplate,
  unsubscribeConfirmationText,
  emailVerificationTemplate,
  emailVerificationText,
  passwordResetTemplate,
  passwordResetText,
  adoptionApplicationConfirmationTemplate,
  adoptionApplicationConfirmationText,
  adoptionStatusChangeTemplate,
  adoptionStatusChangeText,
  getAdoptionStatusEmailSubject,
  contactFormTemplate,
  contactFormText,
  contactFormConfirmationTemplate,
  contactFormConfirmationText,
} from '../templates/emailTemplates';
import type { AdoptionStatusEmailKind } from '../types';

const ANIMAL_TYPE_LABELS: Record<string, string> = {
  PIES: 'Pies',
  KOT: 'Kot',
  KROLIK: 'Królik',
  CHOMIK: 'Chomik',
  ZOLW: 'Żółw',
  INNE: 'Inne',
};

const ANIMAL_SIZE_LABELS: Record<string, string> = {
  MALY: 'Mały',
  SREDNI: 'Średni',
  DUZY: 'Duży',
};

export const createEmailTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

const getFromAddress = () =>
  `"Fundacja Schronisko" <${process.env.EMAIL_USER}>`;

const getFrontendUrl = () =>
  process.env.FRONTEND_URL ??
  (process.env.NODE_ENV === 'production'
    ? 'https://schelter.vercel.app'
    : 'http://localhost:5174');

const getLogoAttachment = (): Attachment => ({
  filename: 'logo.png',
  path: `${getFrontendUrl()}/logo/logo.png`,
  cid: EMAIL_LOGO_CID,
});

const fetchAnimalImageAttachment = async (
  imageUrl: string,
): Promise<Attachment | null> => {
  try {
    const response = await fetch(imageUrl);

    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') ?? 'image/jpeg';
    const buffer = Buffer.from(await response.arrayBuffer());
    const extension = contentType.includes('png') ? 'png' : 'jpg';

    return {
      filename: `zwierze.${extension}`,
      content: buffer,
      cid: EMAIL_ANIMAL_IMAGE_CID,
    };
  } catch {
    return null;
  }
};

export const sendSubscriptionConfirmation = async (
  email: string,
  unsubscribeToken: string,
) => {
  const transporter = createEmailTransporter();
  const frontendUrl = getFrontendUrl();
  const unsubscribeUrl = `${frontendUrl}/newsletter/wypisz/${unsubscribeToken}`;

  await transporter.sendMail({
    from: getFromAddress(),
    to: email,
    subject: 'Witaj w newsletterze Schroniska! 🐾',
    text: subscriptionConfirmationText(unsubscribeUrl),
    html: subscriptionConfirmationTemplate(unsubscribeUrl, frontendUrl),
    attachments: [getLogoAttachment()],
  });
};

export const sendUnsubscribeConfirmation = async (email: string) => {
  const transporter = createEmailTransporter();
  const frontendUrl = getFrontendUrl();

  await transporter.sendMail({
    from: getFromAddress(),
    to: email,
    subject: 'Przykro nam, że wypisałeś się z newslettera 💚',
    text: unsubscribeConfirmationText(frontendUrl),
    html: unsubscribeConfirmationTemplate(frontendUrl),
    attachments: [getLogoAttachment()],
  });
};

export const notifySubscribersAboutNewAnimal = async (animal: Animal) => {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { isActive: true },
  });

  if (subscribers.length === 0) return;

  const transporter = createEmailTransporter();
  const frontendUrl = getFrontendUrl();
  const animalsUrl = `${frontendUrl}/zwierzeta`;
  const typeLabel = ANIMAL_TYPE_LABELS[animal.type] ?? animal.type;
  const genderLabel = animal.gender === 'SAMIEC' ? 'Samiec' : 'Samica';
  const sizeLabel = ANIMAL_SIZE_LABELS[animal.size] ?? animal.size;

  const animalImageAttachment = animal.imageUrl[0]
    ? await fetchAnimalImageAttachment(animal.imageUrl[0])
    : null;

  await Promise.allSettled(
    subscribers.map((subscriber: NewsletterSubscriber) => {
      const unsubscribeUrl = `${frontendUrl}/newsletter/wypisz/${subscriber.unsubscribeToken}`;

      const textParams = {
        animalName: animal.name,
        typeLabel,
        genderLabel,
        description: animal.description,
        animalsUrl,
        unsubscribeUrl,
      };

      const attachments: Attachment[] = [getLogoAttachment()];
      if (animalImageAttachment) attachments.push(animalImageAttachment);

      return transporter.sendMail({
        from: getFromAddress(),
        to: subscriber.email,
        subject: `🐾 ${animal.name} szuka domu!`,
        text: newAnimalText(textParams),
        html: newAnimalTemplate({
          animalName: animal.name,
          typeLabel,
          genderLabel,
          sizeLabel,
          description: animal.description,
          animalImageCid: animalImageAttachment
            ? EMAIL_ANIMAL_IMAGE_CID
            : undefined,
          animalsUrl,
          unsubscribeUrl,
          frontendUrl,
        }),
        attachments,
      });
    }),
  );
};

export const triggerNewAnimalNotification = (
  animal: Pick<
    Animal,
    'status' | 'name' | 'type' | 'gender' | 'size' | 'description' | 'imageUrl'
  >,
) => {
  if (animal.status !== AnimalStatus.SZUKA_DOMU) return;

  void notifySubscribersAboutNewAnimal(animal as Animal).catch((err) => {
    console.error('Błąd wysyłki newslettera o nowym zwierzęciu:', err);
  });
};

export const sendEmailVerification = async (email: string, code: string) => {
  const frontendUrl = getFrontendUrl();
  const verifyUrl = `${frontendUrl}/weryfikacja-email?email=${encodeURIComponent(email)}`;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(
      `[email] Pominięto wysyłkę weryfikacji (brak EMAIL_USER/EMAIL_PASS). Kod dla ${email}: ${code}`,
    );
    return;
  }

  const transporter = createEmailTransporter();

  await transporter.sendMail({
    from: getFromAddress(),
    to: email,
    subject: 'Potwierdź swój adres email — Schronisko',
    text: emailVerificationText(code, verifyUrl),
    html: emailVerificationTemplate(code, verifyUrl, frontendUrl),
    attachments: [getLogoAttachment()],
  });
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const frontendUrl = getFrontendUrl();
  const resetUrl = `${frontendUrl}/reset-hasla/${token}`;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(
      `[email] Pominięto wysyłkę resetu hasła (brak EMAIL_USER/EMAIL_PASS). Link dla ${email}: ${resetUrl}`,
    );
    return;
  }

  const transporter = createEmailTransporter();

  await transporter.sendMail({
    from: getFromAddress(),
    to: email,
    subject: 'Reset hasła — Schronisko',
    text: passwordResetText(resetUrl),
    html: passwordResetTemplate(resetUrl, frontendUrl),
    attachments: [getLogoAttachment()],
  });
};

export const sendAdoptionApplicationConfirmation = async (params: {
  email: string;
  userName: string;
  animalName: string;
}) => {
  const { email, userName, animalName } = params;
  const frontendUrl = getFrontendUrl();
  const accountUrl = `${frontendUrl}/konto`;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(
      `[email] Pominięto potwierdzenie wniosku (brak EMAIL_USER/EMAIL_PASS). Do ${email}, zwierzę: ${animalName}`,
    );
    return;
  }

  const transporter = createEmailTransporter();

  await transporter.sendMail({
    from: getFromAddress(),
    to: email,
    subject: `Dziękujemy za wniosek o adopcję — ${animalName}`,
    text: adoptionApplicationConfirmationText({
      userName,
      animalName,
      accountUrl,
    }),
    html: adoptionApplicationConfirmationTemplate({
      userName,
      animalName,
      accountUrl,
      frontendUrl,
    }),
    attachments: [getLogoAttachment()],
  });
};

export const triggerAdoptionApplicationConfirmation = (params: {
  email: string;
  userName: string;
  animalName: string;
}) => {
  void sendAdoptionApplicationConfirmation(params).catch((err) => {
    console.error('Błąd wysyłki potwierdzenia wniosku adopcyjnego:', err);
  });
};

export const sendAdoptionStatusChangeEmail = async (params: {
  email: string;
  userName: string;
  animalName: string;
  kind: AdoptionStatusEmailKind;
  employeeNote?: string | null;
}) => {
  const { email, userName, animalName, kind, employeeNote } = params;
  const frontendUrl = getFrontendUrl();
  const accountUrl = `${frontendUrl}/konto`;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(
      `[email] Pominięto powiadomienie o statusie adopcji (brak EMAIL_USER/EMAIL_PASS). Do ${email}, status: ${kind}, zwierzę: ${animalName}`,
    );
    return;
  }

  const transporter = createEmailTransporter();

  await transporter.sendMail({
    from: getFromAddress(),
    to: email,
    subject: getAdoptionStatusEmailSubject(kind, animalName),
    text: adoptionStatusChangeText({
      kind,
      userName,
      animalName,
      employeeNote,
      accountUrl,
    }),
    html: adoptionStatusChangeTemplate({
      kind,
      userName,
      animalName,
      employeeNote,
      accountUrl,
      frontendUrl,
    }),
    attachments: [getLogoAttachment()],
  });
};

export const triggerAdoptionStatusChangeEmail = (params: {
  email: string;
  userName: string;
  animalName: string;
  kind: AdoptionStatusEmailKind;
  employeeNote?: string | null;
}) => {
  void sendAdoptionStatusChangeEmail(params).catch((err) => {
    console.error('Błąd wysyłki powiadomienia o statusie adopcji:', err);
  });
};

export const sendContactFormEmail = async (params: {
  fullName: string;
  email: string;
  message: string;
}) => {
  const { fullName, email, message } = params;
  const frontendUrl = getFrontendUrl();
  const transporter = createEmailTransporter();

  await Promise.all([
    transporter.sendMail({
      from: getFromAddress(),
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: `Nowa wiadomość z formularza — ${fullName}`,
      text: contactFormText({ fullName, email, message }),
      html: contactFormTemplate({ fullName, email, message, frontendUrl }),
      attachments: [getLogoAttachment()],
    }),
    ,
    transporter.sendMail({
      from: getFromAddress(),
      to: email,
      subject: `Potwierdzenie otrzymania wiadomości — Schronisko`,
      text: contactFormConfirmationText({ fullName, message }),
      html: contactFormConfirmationTemplate({ fullName, message, frontendUrl }),
      attachments: [getLogoAttachment()],
    }),
  ]);
};

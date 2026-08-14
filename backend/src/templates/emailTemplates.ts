import type { AdoptionStatusEmailKind } from '../types';

const COLORS = {
  green950: '#052e16',
  green900: '#14532d',
  green800: '#166534',
  green700: '#15803d',
  green600: '#16a34a',
  green500: '#22c55e',
  green100: '#dcfce7',
  green50: '#f0fdf4',
  white: '#ffffff',
  gray600: '#4b5563',
  gray500: '#6b7280',
  gray400: '#9ca3af',
  gray200: '#e5e7eb',
};

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const EMAIL_LOGO_CID = 'logo@schronisko';
export const EMAIL_ANIMAL_IMAGE_CID = 'animal@schronisko';

const emailLayout = (
  content: string,
  preheader: string,
  frontendUrl: string,
) => `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Schronisko</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${COLORS.green50};font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.green50};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:${COLORS.white};border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(20,83,45,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:${COLORS.green50};padding:28px 40px 24px;text-align:center;border-bottom:3px solid ${COLORS.green600};">
              <a href="${frontendUrl}" target="_blank" style="text-decoration:none;display:inline-block;">
                <img src="cid:${EMAIL_LOGO_CID}" alt="Schronisko" width="160" style="display:block;margin:0 auto;max-width:160px;width:100%;height:auto;border:0;" />
              </a>
            </td>
          </tr>
          <!-- Content -->
          ${content}
          <!-- Footer -->
          <tr>
            <td style="background-color:${COLORS.green50};padding:24px 40px;border-top:1px solid ${COLORS.green100};">
              <p style="margin:0 0 8px;font-size:13px;color:${COLORS.gray600};text-align:center;line-height:1.6;">
                <strong style="color:${COLORS.green900};">Fundacja Schronisko</strong><br />
                al. Tadeusza Rejtana 53, 35-326 Rzeszów
              </p>
              <p style="margin:0;font-size:12px;color:${COLORS.gray400};text-align:center;">
                schronisko@example.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const ctaButton = (href: string, label: string) => `
<tr>
  <td align="center" style="padding:0 40px 32px;">
    <a href="${href}" target="_blank" style="display:inline-block;background-color:${COLORS.green600};color:${COLORS.white};font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;box-shadow:0 2px 8px rgba(22,163,74,0.35);">
      ${escapeHtml(label)}
    </a>
  </td>
</tr>`;

const badge = (label: string) =>
  `<span style="display:inline-block;background-color:${COLORS.green100};color:${COLORS.green800};font-size:12px;font-weight:600;padding:6px 12px;border-radius:20px;margin:0 6px 6px 0;">${escapeHtml(label)}</span>`;

const unsubscribeFooter = (unsubscribeUrl: string) => `
<tr>
  <td style="padding:0 40px 28px;text-align:center;">
    <p style="margin:0;font-size:12px;color:${COLORS.gray400};line-height:1.6;">
      Otrzymujesz tę wiadomość, ponieważ zapisałeś się do newslettera Schroniska.<br />
      <a href="${unsubscribeUrl}" style="color:${COLORS.green700};text-decoration:underline;">Wypisz się z newslettera</a>
    </p>
  </td>
</tr>`;

export const subscriptionConfirmationTemplate = (
  unsubscribeUrl: string,
  frontendUrl: string,
) =>
  emailLayout(
    `
<tr>
  <td style="padding:40px 40px 24px;text-align:center;">
    <div style="width:64px;height:64px;margin:0 auto 20px;background-color:${COLORS.green100};border-radius:50%;line-height:64px;font-size:28px;">✉️</div>
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${COLORS.green900};">Dziękujemy za zapis!</h2>
    <p style="margin:0;font-size:15px;color:${COLORS.gray600};line-height:1.7;max-width:420px;margin-left:auto;margin-right:auto;">
      Od teraz będziesz na bieżąco informowany o zwierzętach szukających domu w naszym schronisku.
    </p>
  </td>
</tr>
<tr>
  <td style="padding:0 40px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.green50};border-radius:12px;border:1px solid ${COLORS.green100};">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:${COLORS.green800};text-transform:uppercase;letter-spacing:0.05em;">Co będziesz otrzymywać?</p>
          <p style="margin:0;font-size:14px;color:${COLORS.gray600};line-height:1.8;">
            🐕 Informacje o nowych podopiecznych gotowych do adopcji<br />
            🏠 Aktualności ze schroniska<br />
            ❤️ Historie zwierząt szukających domu
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>
${ctaButton(`${frontendUrl}/zwierzeta`, 'Zobacz zwierzęta do adopcji')}
${unsubscribeFooter(unsubscribeUrl)}
`,
    'Potwierdzenie zapisu do newslettera Schroniska',
    frontendUrl,
  );

const SIZE_LABELS: Record<string, string> = {
  MALY: 'Mały',
  SREDNI: 'Średni',
  DUZY: 'Duży',
};

export const newAnimalTemplate = (params: {
  animalName: string;
  typeLabel: string;
  genderLabel: string;
  sizeLabel: string;
  description: string;
  animalImageCid?: string;
  animalsUrl: string;
  unsubscribeUrl: string;
  frontendUrl: string;
}) => {
  const {
    animalName,
    typeLabel,
    genderLabel,
    sizeLabel,
    description,
    animalImageCid,
    animalsUrl,
    unsubscribeUrl,
    frontendUrl,
  } = params;

  const imageBlock = animalImageCid
    ? `
<tr>
  <td style="padding:16px 32px 0;">
    <img src="cid:${animalImageCid}" alt="${escapeHtml(animalName)}" width="536" style="display:block;width:100%;max-width:536px;height:auto;max-height:320px;object-fit:cover;border-radius:12px;margin:0 auto;border:2px solid ${COLORS.green100};" />
  </td>
</tr>`
    : `
<tr>
  <td style="padding:32px 40px 0;text-align:center;">
    <div style="background:linear-gradient(180deg,${COLORS.green100} 0%,${COLORS.green50} 100%);border-radius:12px;padding:48px 24px;">
      <span style="font-size:64px;line-height:1;">🐾</span>
    </div>
  </td>
</tr>`;

  return emailLayout(
    `
<tr>
  <td style="padding:28px 40px 8px;text-align:center;">
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${COLORS.green600};text-transform:uppercase;letter-spacing:0.08em;">Nowe zwierzę szuka domu</p>
    <h2 style="margin:0;font-size:28px;font-weight:700;color:${COLORS.green900};letter-spacing:-0.02em;">${escapeHtml(animalName)}</h2>
  </td>
</tr>
${imageBlock}
<tr>
  <td style="padding:24px 40px 8px;">
    <div style="text-align:center;line-height:1;">
      ${badge(typeLabel)}
      ${badge(genderLabel)}
      ${badge(sizeLabel)}
    </div>
  </td>
</tr>
<tr>
  <td style="padding:16px 40px 8px;">
    <p style="margin:0;font-size:15px;color:${COLORS.gray600};line-height:1.75;text-align:center;">
      ${escapeHtml(description)}
    </p>
  </td>
</tr>
<tr>
  <td style="padding:8px 40px 8px;text-align:center;">
    <p style="margin:0;font-size:14px;color:${COLORS.green800};font-weight:500;">
      Może to właśnie Twoje przyszłe zwierzę? 💚
    </p>
  </td>
</tr>
${ctaButton(animalsUrl, 'Poznaj bliżej i adoptuj')}
${unsubscribeFooter(unsubscribeUrl)}
`,
    `${animalName} szuka domu — zobacz profil w Schronisku`,
    frontendUrl,
  );
};

export const subscriptionConfirmationText = (unsubscribeUrl: string) =>
  `Dziękujemy za zapis do newslettera Schroniska!\n\nBędziesz otrzymywać informacje o zwierzętach szukających domu.\n\nWypisz się: ${unsubscribeUrl}`;

export const unsubscribeConfirmationTemplate = (frontendUrl: string) =>
  emailLayout(
    `
<tr>
  <td style="padding:40px 40px 24px;text-align:center;">
    <div style="width:64px;height:64px;margin:0 auto 20px;background-color:${COLORS.green100};border-radius:50%;line-height:64px;font-size:28px;">💚</div>
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${COLORS.green900};">Przykro nam, że odchodzisz</h2>
    <p style="margin:0;font-size:15px;color:${COLORS.gray600};line-height:1.7;max-width:420px;margin-left:auto;margin-right:auto;">
      Potwierdzamy wypisanie z newslettera Schroniska. Nie będziesz już otrzymywać informacji o zwierzętach szukających domu.
    </p>
  </td>
</tr>
<tr>
  <td style="padding:0 40px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.green50};border-radius:12px;border:1px solid ${COLORS.green100};">
      <tr>
        <td style="padding:20px 24px;text-align:center;">
          <p style="margin:0;font-size:14px;color:${COLORS.gray600};line-height:1.8;">
            Dziękujemy za dotychczasowe wsparcie i zainteresowanie naszymi podopiecznymi.<br />
            Mamy nadzieję, że jeszcze do nas wrócisz!
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>
${ctaButton(`${frontendUrl}/zwierzeta`, 'Zobacz zwierzęta do adopcji')}
<tr>
  <td style="padding:0 40px 32px;text-align:center;">
    <p style="margin:0;font-size:13px;color:${COLORS.gray500};line-height:1.6;">
      Chcesz ponownie otrzymywać aktualności?<br />
      <a href="${frontendUrl}" style="color:${COLORS.green700};text-decoration:underline;font-weight:500;">Zapisz się do newslettera na stronie głównej</a>
    </p>
  </td>
</tr>
`,
    'Potwierdzenie wypisania z newslettera Schroniska',
    frontendUrl,
  );

export const unsubscribeConfirmationText = (frontendUrl: string) =>
  `Przykro nam, że wypisałeś się z newslettera Schroniska.\n\nPotwierdzamy, że nie będziesz już otrzymywać informacji o zwierzętach szukających domu.\n\nDziękujemy za dotychczasowe wsparcie!\n\nZapisz się ponownie: ${frontendUrl}`;

export const newAnimalText = (params: {
  animalName: string;
  typeLabel: string;
  genderLabel: string;
  description: string;
  animalsUrl: string;
  unsubscribeUrl: string;
}) =>
  `${params.animalName} szuka domu!\n\nTyp: ${params.typeLabel}\nPłeć: ${params.genderLabel}\n\n${params.description}\n\nZobacz więcej: ${params.animalsUrl}\n\nWypisz się: ${params.unsubscribeUrl}`;

export const emailVerificationTemplate = (
  code: string,
  verifyUrl: string,
  frontendUrl: string,
) =>
  emailLayout(
    `
<tr>
  <td style="padding:40px 40px 24px;text-align:center;">
    <div style="width:64px;height:64px;margin:0 auto 20px;background-color:${COLORS.green100};border-radius:50%;line-height:64px;font-size:28px;">🔐</div>
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${COLORS.green900};">Potwierdź swój adres email</h2>
    <p style="margin:0;font-size:15px;color:${COLORS.gray600};line-height:1.7;max-width:420px;margin-left:auto;margin-right:auto;">
      Aby dokończyć rejestrację, wpisz poniższy kod na stronie weryfikacji albo skorzystaj z przycisku poniżej.
    </p>
  </td>
</tr>
<tr>
  <td style="padding:0 40px 28px;text-align:center;">
    <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:${COLORS.green800};text-transform:uppercase;letter-spacing:0.08em;">Twój kod weryfikacyjny</p>
    <div style="display:inline-block;background-color:${COLORS.green50};border:2px dashed ${COLORS.green600};border-radius:12px;padding:16px 28px;">
      <span style="font-size:32px;font-weight:700;letter-spacing:0.35em;color:${COLORS.green900};font-family:'Courier New',Courier,monospace;">${escapeHtml(code)}</span>
    </div>
    <p style="margin:16px 0 0;font-size:13px;color:${COLORS.gray500};">Kod jest ważny przez 15 minut.</p>
  </td>
</tr>
${ctaButton(verifyUrl, 'Przejdź do weryfikacji')}
<tr>
  <td style="padding:0 40px 32px;text-align:center;">
    <p style="margin:0;font-size:12px;color:${COLORS.gray400};line-height:1.6;">
      Jeśli to nie Ty zakładałeś konto, zignoruj tę wiadomość.
    </p>
  </td>
</tr>
`,
    `Twój kod weryfikacyjny: ${code}`,
    frontendUrl,
  );

export const emailVerificationText = (code: string, verifyUrl: string) =>
  `Potwierdź swój adres email\n\nTwój kod weryfikacyjny: ${code}\n\nKod jest ważny przez 15 minut.\n\nMożesz też otworzyć stronę weryfikacji: ${verifyUrl}\n\nJeśli to nie Ty zakładałeś konto, zignoruj tę wiadomość.`;

export const passwordResetTemplate = (
  resetUrl: string,
  frontendUrl: string,
) =>
  emailLayout(
    `
<tr>
  <td style="padding:40px 40px 24px;text-align:center;">
    <div style="width:64px;height:64px;margin:0 auto 20px;background-color:${COLORS.green100};border-radius:50%;line-height:64px;font-size:28px;">🔑</div>
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${COLORS.green900};">Reset hasła</h2>
    <p style="margin:0;font-size:15px;color:${COLORS.gray600};line-height:1.7;max-width:420px;margin-left:auto;margin-right:auto;">
      Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta. Kliknij przycisk poniżej, aby ustawić nowe hasło.
    </p>
  </td>
</tr>
${ctaButton(resetUrl, 'Ustaw nowe hasło')}
<tr>
  <td style="padding:0 40px 32px;text-align:center;">
    <p style="margin:0 0 8px;font-size:13px;color:${COLORS.gray500};line-height:1.6;">
      Link jest ważny przez 15 minut.
    </p>
    <p style="margin:0;font-size:12px;color:${COLORS.gray400};line-height:1.6;">
      Jeśli to nie Ty prosiłeś o reset hasła, zignoruj tę wiadomość — Twoje hasło pozostanie bez zmian.
    </p>
  </td>
</tr>
`,
    'Link do zresetowania hasła w Schronisku',
    frontendUrl,
  );

export const passwordResetText = (resetUrl: string) =>
  `Reset hasła\n\nOtrzymaliśmy prośbę o zresetowanie hasła do Twojego konta.\n\nUstaw nowe hasło tutaj: ${resetUrl}\n\nLink jest ważny przez 15 minut.\n\nJeśli to nie Ty prosiłeś o reset hasła, zignoruj tę wiadomość.`;

export const adoptionApplicationConfirmationTemplate = (params: {
  userName: string;
  animalName: string;
  accountUrl: string;
  frontendUrl: string;
}) =>
  emailLayout(
    `
<tr>
  <td style="padding:40px 40px 24px;text-align:center;">
    <div style="width:64px;height:64px;margin:0 auto 20px;background-color:${COLORS.green100};border-radius:50%;line-height:64px;font-size:28px;">📝</div>
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${COLORS.green900};">Dziękujemy za wniosek!</h2>
    <p style="margin:0;font-size:15px;color:${COLORS.gray600};line-height:1.7;max-width:440px;margin-left:auto;margin-right:auto;">
      Cześć ${escapeHtml(params.userName)}! Potwierdzamy przyjęcie Twojego wniosku o adopcję zwierzęcia
      <strong style="color:${COLORS.green900};">${escapeHtml(params.animalName)}</strong>.
    </p>
  </td>
</tr>
<tr>
  <td style="padding:0 40px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.green50};border-radius:12px;border:1px solid ${COLORS.green100};">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:${COLORS.green800};text-transform:uppercase;letter-spacing:0.05em;">Co dalej?</p>
          <p style="margin:0;font-size:14px;color:${COLORS.gray600};line-height:1.8;">
            ✅ Twój wniosek trafił do kolejki i zostanie rozpatrzony w ciągu kilku dni roboczych<br />
            📞 Skontaktujemy się z Tobą mailowo lub telefonicznie po podjęciu decyzji<br />
            🏠 Po wstępnej akceptacji zaprosimy Cię na spotkanie w schronisku
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>
${ctaButton(params.accountUrl, 'Zobacz status wniosku')}
<tr>
  <td style="padding:0 40px 32px;text-align:center;">
    <p style="margin:0;font-size:12px;color:${COLORS.gray400};line-height:1.6;">
      Do czasu decyzji możesz anulować wniosek z poziomu konta lub karty zwierzęcia.
    </p>
  </td>
</tr>
`,
    `Potwierdzenie wniosku o adopcję — ${params.animalName}`,
    params.frontendUrl,
  );

export const adoptionApplicationConfirmationText = (params: {
  userName: string;
  animalName: string;
  accountUrl: string;
}) =>
  `Dziękujemy za wniosek o adopcję!\n\nCześć ${params.userName}!\n\nPotwierdzamy przyjęcie Twojego wniosku o adopcję zwierzęcia ${params.animalName}.\n\nWniosek zostanie rozpatrzony w ciągu kilku dni roboczych. Skontaktujemy się z Tobą po podjęciu decyzji.\n\nStatus wniosku: ${params.accountUrl}\n\nDo czasu decyzji możesz anulować wniosek z poziomu konta.`;

const adoptionStatusEmailCopy: Record<
  AdoptionStatusEmailKind,
  {
    emoji: string;
    title: string;
    subject: (animalName: string) => string;
    intro: (userName: string, animalName: string) => string;
    nextSteps: string;
  }
> = {
  accepted: {
    emoji: '✅',
    title: 'Wniosek wstępnie zaakceptowany',
    subject: (animalName) =>
      `Wniosek zaakceptowany — zaproszenie na spotkanie (${animalName})`,
    intro: (userName, animalName) =>
      `Cześć ${userName}! Twój wniosek o adopcję zwierzęcia ${animalName} został wstępnie zaakceptowany.`,
    nextSteps:
      '🏠 To jeszcze nie finalna adopcja — prosimy o przyjście do schroniska w celu finalizacji adopcji<br />📋 Ostateczna decyzja zapada po spotkaniu na żywo<br />⏳ Masz 7 dni od decyzji schroniska na przyjście do schroniska',
  },
  rejected: {
    emoji: '❌',
    title: 'Wniosek odrzucony',
    subject: (animalName) => `Decyzja w sprawie wniosku o adopcję — ${animalName}`,
    intro: (userName, animalName) =>
      `Cześć ${userName}! Po rozpatrzeniu Twojego wniosku o adopcję zwierzęcia ${animalName} niestety nie możemy go zaakceptować.`,
    nextSteps:
      '💚 Dziękujemy za zainteresowanie naszymi podopiecznymi<br />🐕 Możesz przeglądać inne zwierzęta szukające domu<br />📩 W razie pytań skontaktuj się ze schroniskiem',
  },
  cancelled: {
    emoji: 'ℹ️',
    title: 'Wniosek anulowany',
    subject: (animalName) => `Wniosek o adopcję został anulowany — ${animalName}`,
    intro: (userName, animalName) =>
      `Cześć ${userName}! Informujemy, że Twój wniosek o adopcję zwierzęcia ${animalName} został anulowany.`,
    nextSteps:
      '🐕 Możesz złożyć wniosek o inne zwierzę, jeśli nadal szuka domu<br />📩 W razie pytań skontaktuj się ze schroniskiem',
  },
  completed: {
    emoji: '🎉',
    title: 'Adopcja sfinalizowana!',
    subject: (animalName) => `Adopcja sfinalizowana — witaj w domu, ${animalName}!`,
    intro: (userName, animalName) =>
      `Cześć ${userName}! Z radością informujemy, że adopcja zwierzęcia ${animalName} została sfinalizowana.`,
    nextSteps:
      '❤️ Dziękujemy za zapewnienie nowego domu<br />🏡 Życzymy wielu wspólnych, szczęśliwych chwil<br />🐾 Jesteście już oficjalnie rodziną!',
  },
  cancelled_after_meeting: {
    emoji: 'ℹ️',
    title: 'Proces adopcji zakończony bez finalizacji',
    subject: (animalName) =>
      `Aktualizacja procesu adopcji — ${animalName}`,
    intro: (userName, animalName) =>
      `Cześć ${userName}! Po spotkaniu w schronisku proces adopcji zwierzęcia ${animalName} nie został sfinalizowany, a wniosek został anulowany.`,
    nextSteps:
      '🐕 Zwierzę ponownie szuka domu — możesz przeglądać inne podopieczne<br />📩 W razie pytań skontaktuj się ze schroniskiem',
  },
  cancelled_other_accepted: {
    emoji: 'ℹ️',
    title: 'Wniosek anulowany',
    subject: (animalName) =>
      `Aktualizacja wniosku o adopcję — ${animalName}`,
    intro: (userName, animalName) =>
      `Cześć ${userName}! Twój wniosek o adopcję zwierzęcia ${animalName} został anulowany, ponieważ dla tego zwierzęcia zaakceptowano inny wniosek.`,
    nextSteps:
      '💚 Dziękujemy za zainteresowanie<br />🐕 Zapraszamy do przeglądania innych zwierząt szukających domu',
  },
  expired_no_visit: {
    emoji: '⏰',
    title: 'Termin wizyty minął — wniosek anulowany',
    subject: (animalName) =>
      `Wniosek anulowany — upłynął termin wizyty (${animalName})`,
    intro: (userName, animalName) =>
      `Cześć ${userName}! Twój wniosek o adopcję zwierzęcia ${animalName} został anulowany automatycznie, ponieważ minął 7-dniowy termin przyjścia do schroniska od decyzji schroniska.`,
    nextSteps:
      '🐕 Zwierzę ponownie szuka domu<br />💚 Możesz przeglądać inne zwierzęta i złożyć nowy wniosek<br />📩 W razie pytań skontaktuj się ze schroniskiem',
  },
};

export const adoptionStatusChangeTemplate = (params: {
  kind: AdoptionStatusEmailKind;
  userName: string;
  animalName: string;
  employeeNote?: string | null;
  accountUrl: string;
  frontendUrl: string;
}) => {
  const copy = adoptionStatusEmailCopy[params.kind];
  const noteBlock = params.employeeNote?.trim()
    ? `
<tr>
  <td style="padding:0 40px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.green50};border-radius:12px;border:1px solid ${COLORS.green100};">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:${COLORS.green800};text-transform:uppercase;letter-spacing:0.05em;">Wiadomość od schroniska</p>
          <p style="margin:0;font-size:14px;color:${COLORS.gray600};line-height:1.8;white-space:pre-wrap;">${escapeHtml(params.employeeNote.trim())}</p>
        </td>
      </tr>
    </table>
  </td>
</tr>`
    : '';

  return emailLayout(
    `
<tr>
  <td style="padding:40px 40px 24px;text-align:center;">
    <div style="width:64px;height:64px;margin:0 auto 20px;background-color:${COLORS.green100};border-radius:50%;line-height:64px;font-size:28px;">${copy.emoji}</div>
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${COLORS.green900};">${escapeHtml(copy.title)}</h2>
    <p style="margin:0;font-size:15px;color:${COLORS.gray600};line-height:1.7;max-width:440px;margin-left:auto;margin-right:auto;">
      ${escapeHtml(copy.intro(params.userName, params.animalName))}
    </p>
  </td>
</tr>
${noteBlock}
<tr>
  <td style="padding:0 40px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.green50};border-radius:12px;border:1px solid ${COLORS.green100};">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:${COLORS.green800};text-transform:uppercase;letter-spacing:0.05em;">Co dalej?</p>
          <p style="margin:0;font-size:14px;color:${COLORS.gray600};line-height:1.8;">
            ${copy.nextSteps}
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>
${ctaButton(params.accountUrl, 'Zobacz status na koncie')}
`,
    copy.subject(params.animalName),
    params.frontendUrl,
  );
};

export const adoptionStatusChangeText = (params: {
  kind: AdoptionStatusEmailKind;
  userName: string;
  animalName: string;
  employeeNote?: string | null;
  accountUrl: string;
}) => {
  const copy = adoptionStatusEmailCopy[params.kind];
  const note = params.employeeNote?.trim()
    ? `\n\nWiadomość od schroniska:\n${params.employeeNote.trim()}`
    : '';

  return `${copy.title}\n\n${copy.intro(params.userName, params.animalName)}${note}\n\nStatus wniosku: ${params.accountUrl}\n\nZespół Schroniska`;
};

export const getAdoptionStatusEmailSubject = (
  kind: AdoptionStatusEmailKind,
  animalName: string,
) => adoptionStatusEmailCopy[kind].subject(animalName);


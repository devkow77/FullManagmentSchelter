const getAcceptanceTemplate = (userName: string, animalName: string) =>
  `Szanowny/a ${userName},
  
  z przyjemnością informujemy, że Twój wniosek o adopcję zwierzęcia ${animalName} został wstępnie zaakceptowany.
  
  Prosimy o kontakt w celu umówienia spotkania w schronisku. Ostateczna decyzja o adopcji zapada po spotkaniu na żywo.
  
  Z poważaniem,
  Zespół Schroniska`;

const getRejectionTemplate = (userName: string, animalName: string) =>
  `Szanowny/a ${userName},
  
  dziękujemy za zainteresowanie adopcją zwierzęcia ${animalName}. Po rozpatrzeniu wniosku niestety nie możemy go zaakceptować.
  
  [Uzupełnij powód odrzucenia]
  
  Z poważaniem,
  Zespół Schroniska`;

const getCancellationTemplate = (userName: string, animalName: string) =>
  `Szanowny/a ${userName},
  
  informujemy, że wniosek o adopcję zwierzęcia ${animalName} został anulowany.
  
  [Uzupełnij powód anulacji, jeśli dotyczy]
  
  Z poważaniem,
  Zespół Schroniska`;

const getCompletionTemplate = (userName: string, animalName: string) =>
  `Szanowny/a ${userName},
  
  z radością informujemy, że adopcja zwierzęcia ${animalName} została sfinalizowana.
  
  Dziękujemy za zapewnienie nowego domu i życzymy wielu wspólnych, szczęśliwych chwil!
  
  Z poważaniem,
  Zespół Schroniska`;

const getPostMeetingCancellationTemplate = (
  userName: string,
  animalName: string,
) =>
  `Szanowny/a ${userName},
  
  informujemy, że po spotkaniu w schronisku proces adopcji zwierzęcia ${animalName} nie został sfinalizowany, a wniosek został anulowany.
  
  [Uzupełnij powód, jeśli dotyczy]
  
  Z poważaniem,
  Zespół Schroniska`;

export {
  getAcceptanceTemplate,
  getRejectionTemplate,
  getCancellationTemplate,
  getCompletionTemplate,
  getPostMeetingCancellationTemplate,
};

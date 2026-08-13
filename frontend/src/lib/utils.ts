import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ANIMALS
export const styleAnimalStatus = (status: string) => {
  let styles: string = "";

  switch (status) {
    case "SZUKA_DOMU":
      styles = "bg-red-100 border border-red-300 text-red-800";
      break;
    case "ZNALEZIONY":
      styles = "bg-blue-100 border border-blue-300 text-blue-800";
      break;
    case "W_TRAKCIE_ADOPCJI":
      styles = "bg-yellow-100 border border-yellow-300 text-yellow-800";
      break;
    case "ADOPTOWANY":
      styles = "bg-green-100 border border-green-300 text-green-800";
      break;
    default:
      styles = "bg-slate-100 border border-slate-300 text-slate-800";
  }

  return styles;
};

export const styleAnimalHealthStatus = (status: string) => {
  let styles: string = "";

  switch (status) {
    case "ZDROWY":
      styles = "bg-green-100 border border-green-300 text-green-800";
      break;
    case "CHORY":
      styles = "bg-red-100 border border-red-300 text-red-800";
      break;
    case "ZARAŻONY":
      styles = "bg-yellow-100 border border-yellow-300 text-yellow-800";
      break;
    case "POTRZEBUJE_OPERACJI":
      styles = "bg-purple-100 border border-purple-300 text-purple-800";
      break;
    default:
      styles = "bg-slate-100 border border-slate-300 text-slate-800";
  }

  return styles;
};

export const styleAnimalNeed = (count: number) => {
  if (count === 0) return "text-black";
  return "text-red-800";
};

export const styleEmptyField = (field: unknown) => {
  if (field === null) return "text-red-800";
  return "text-black";
};

export const formatAnimalGender = (gender: string) =>
  gender === "SAMIEC" ? "Samiec" : gender === "SAMICA" ? "Samica" : gender;

export const formatAnimalType: Record<string, string> = {
  PIES: "Pies",
  KOT: "Kot",
  KROLIK: "Królik",
  CHOMIK: "Chomik",
  ZOLW: "Żółw",
  INNE: "Inne",
};

export const formatAnimalHealthStatus: Record<string, string> = {
  ZDROWY: "Zdrowy",
  CHORY: "Chory",
  ZARAŻONY: "Zarażony",
  POTRZEBUJE_OPERACJI: "Potrzebuje operacji",
};

export const formatAnimalStatus: Record<string, string> = {
  SZUKA_DOMU: "Szuka domu",
  ZNALEZIONY: "Znaleziony",
  W_TRAKCIE_ADOPCJI: "W trakcie adopcji",
  ADOPTOWANY: "Adoptowany",
};

export const formatAnimalSize: Record<string, string> = {
  MALY: "Mały",
  SREDNI: "Średni",
  DUZY: "Duży",
  INNE: "Inne",
};

export const formatAnimalEnergyLevel: Record<string, string> = {
  NISKI: "Niski",
  SREDNI: "Średni",
  WYSOKI: "Wysoki",
};

export const formatCageLabel = (cage: {
  zone: string;
  number: number;
}): string => `${cage.zone}-${String(cage.number).padStart(2, "0")}`;

// USERS
export const styleUserRole = (role: string) => {
  let styles: string = "";

  switch (role) {
    case "UZYTKOWNIK":
      styles = "bg-slate-100 border border-slate-300 text-slate-800";
      break;
    case "PRACOWNIK":
      styles = "bg-blue-100 border border-blue-300 text-blue-800";
      break;
    case "ADMINISTRATOR":
      styles = "bg-red-100 border border-red-300 text-red-800";
      break;
    default:
      styles = "bg-slate-100 border border-slate-300 text-slate-800";
  }

  return styles;
};

export const formatUserGender = (gender: string) =>
  gender === "MEZCZYZNA"
    ? "Mężczyzna"
    : gender === "KOBIETA"
      ? "Kobieta"
      : gender;

export const formatUserRole: Record<string, string> = {
  ADMINISTRATOR: "Administrator",
  PRACOWNIK: "Pracownik",
  UZYTKOWNIK: "Użytkownik",
};

export const formatHousingType: Record<string, string> = {
  DOM: "Dom",
  MIESZKANIE: "Mieszkanie",
  INNE: "Inne",
};
// ADOPTION
export const styleAdoptionStatus = (status: string) => {
  let styles: string = "";

  switch (status) {
    case "OCZEKUJACA":
      styles = "bg-yellow-100 border border-yellow-300 text-yellow-800";
      break;
    case "ZAAKCEPTOWANA":
      styles = "bg-green-100 border border-green-300 text-green-800";
      break;
    case "ODRZUCONA":
      styles = "bg-red-100 border border-red-300 text-red-800";
      break;
    case "ANULOWANA":
      styles = "bg-slate-100 border border-slate-300 text-slate-800";
      break;
    case "ZAKONCZONA":
      styles = "bg-violet-100 border border-violet-300 text-violet-800";
      break;
    default:
      styles = "bg-slate-100 border border-slate-300 text-slate-800";
  }

  return styles;
};

export const formatAdoptionStatus: Record<string, string> = {
  OCZEKUJACA: "Oczekująca",
  ZAAKCEPTOWANA: "Zaakceptowana",
  ODRZUCONA: "Odrzucona",
  ANULOWANA: "Anulowana",
  ZAKONCZONA: "Adoptowano",
};

/** Liczba dni od akceptacji wniosku (acceptedAt) na przyjście do schroniska */
export const ADOPTION_SHELTER_VISIT_DAYS = 7;

export const getDaysUntilShelterVisit = (fromDate: string | Date) => {
  const start = new Date(fromDate);
  start.setHours(0, 0, 0, 0);

  const deadline = new Date(start);
  deadline.setDate(deadline.getDate() + ADOPTION_SHELTER_VISIT_DAYS);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.ceil(
    (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
};

export const formatShelterVisitCountdown = (daysLeft: number) => {
  if (daysLeft < 0) {
    return "Termin przyjścia do schroniska już minął — skontaktuj się ze schroniskiem.";
  }
  if (daysLeft === 0) {
    return "Dzisiaj jest ostatni dzień na przyjście do schroniska.";
  }
  if (daysLeft === 1) {
    return "Pozostał 1 dzień na przyjście do schroniska.";
  }
  return `Pozostało ${daysLeft} dni na przyjście do schroniska.`;
};

// MEDICAL RECORDS
export const styleMedicalRecordType = (status: string) => {
  let styles: string = "";

  switch (status) {
    case "WIZYTA":
      styles = "bg-yellow-100 border border-yellow-300 text-yellow-800";
      break;
    case "BADANIE":
      styles = "bg-blue-100 border border-blue-300 text-blue-800";
      break;
    case "OPERACJA":
      styles = "bg-red-100 border border-red-300 text-red-800";
      break;
    case "SZCZEPIENIE":
      styles = "bg-purple-100 border border-purple-300 text-purple-800";
      break;
    case "URAZ":
      styles = "bg-orange-100 border border-orange-300 text-orange-800";
      break;
    case "INNE":
      styles = "bg-slate-100 border border-slate-300 text-slate-800";
      break;
    default:
      styles = "bg-slate-100 border border-slate-300 text-slate-800";
  }

  return styles;
};

export const styleMedicalRecordStatus = (status: string) => {
  let styles: string = "";

  switch (status) {
    case "DO_REALIZACJI":
      styles = "bg-red-100 border border-red-300 text-red-800";
      break;
    case "W_TRAKCIE":
      styles = "bg-yellow-100 border border-yellow-300 text-yellow-800";
      break;
    case "ZREALIZOWANA":
      styles = "bg-green-100 border border-green-300 text-green-800";
      break;
    default:
      styles = "bg-red-100 border border-red-300 text-red-800";
  }

  return styles;
};

export const formatMedicalRecordStatus: Record<string, string> = {
  DO_REALIZACJI: "Do realizacji",
  W_TRAKCIE: "W trakcie",
  ZREALIZOWANA: "Zrealizowana",
};

export const formatMedicalRecordType: Record<string, string> = {
  WIZYTA: "Wizyta",
  BADANIE: "Badanie",
  OPERACJA: "Operacja",
  SZCZEPIENIE: "Szczepienie",
  URAZ: "Uraz",
  INNE: "Inne",
};

// CMS (BLOG)

// Buduje adres obrazka z CMS-a. Provider "local" zwraca ścieżkę względną,
// a zewnętrzny storage (Cloudinary) pełny adres, który trzeba zostawić bez zmian.
export const buildCmsImageUrl = (path?: string): string | undefined => {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;

  const cmsUrl = (import.meta.env.VITE_STRIPE_CMS_ADMIN_URL ?? "") as string;
  return `${cmsUrl.replace(/\/+$/, "")}${path}`;
};

// GLOBAL

// Funckja do obliczania wieku zwierzaka
export const calculateAge = (dateOfBirth: string | Date) => {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();

  if (age <= 0) return "Mniej niż rok";
  if (age === 1) return "1 rok";
  if (age >= 2 && age <= 4) return `${age} lata`;
  return `${age} lat`;
};

// Funkcja do kolorowania aktywnychlinków w navbarie
export const styleActiveLink = (pathname: string, href: string) =>
  pathname === href ? "font-semibold text-green-900" : "font-normal text-black";

import type { IconType } from "react-icons";

/** Kafelek informacyjny z ikoną, używany w sekcjach marketingowych. */
export type IconCard = {
  icon: string;
  bgColor: string;
  title: string;
  description: string;
};

/** Pozycja rozwijanego menu w nawigacji. */
export type NavMenuItem = {
  title: string;
  href: string;
  description: string;
};

/** Pozycja nawigacji panelu (admin, pracownik, klient). */
export type DashboardNavOption = {
  icon?: IconType;
  href: string;
  name: string;
};

/** Pozycja kolumny linków w stopce. */
export type FooterLink = {
  name: string;
  href?: string;
  icon?: IconType;
};

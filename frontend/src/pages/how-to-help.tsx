import { useEffect, type ReactNode } from "react";
import { Container } from "@/components/ui";
import type { IconCard } from "@/types";

const helpOptions: IconCard[] = [
  {
    icon: "🐾",
    title: "Adoptuj zwierzę",
    bgColor: "bg-slate-100",
    description:
      "Daj zwierzęciu drugi dom i szansę na nowe, lepsze życie u boku kochającego opiekuna.",
  },
  {
    icon: "🤝",
    bgColor: "bg-red-100",
    title: "Zostań wolontariuszem",
    description:
      "Pomagaj w schronisku – wyprowadzaj psy, opiekuj się zwierzętami i wspieraj ich codzienne potrzeby.",
  },
  {
    icon: "💸",
    bgColor: "bg-yellow-100",
    title: "Wesprzyj finansowo",
    description:
      "Twoja darowizna pomaga pokryć koszty leczenia, karmy i utrzymania zwierząt.",
  },
  {
    icon: "🛍️",
    bgColor: "bg-green-100",
    title: "Przekaż dary",
    description:
      "Karma, koce, zabawki czy smycze – każda pomoc rzeczowa jest dla nas bardzo cenna.",
  },
  {
    icon: "🏠",
    bgColor: "bg-blue-100",
    title: "Dom tymczasowy",
    description:
      "Zapewnij zwierzęciu opiekę tymczasową i pomóż mu przygotować się do adopcji.",
  },
  {
    icon: "📣",
    bgColor: "bg-purple-100",
    title: "Udostępniaj",
    description:
      "Udostępniaj ogłoszenia i pomagaj nam dotrzeć do osób, które mogą dać zwierzętom dom.",
  },
];

const PAGE_TITLE = "Jak nam pomóc? | Schronisko";
const DONATION_IBAN = "PL00 0000 0000 0000 0000 0000 0000";

const volunteerSteps = [
  "Przejdź do strony „Kontakt” i napisz do nas w sprawie wolontariatu.",
  "Wypełnij formularz zgłoszeniowy, podając swoje dane i doświadczenie.",
  "Wybierz dostępne dni i godziny, w których możesz pomagać w schronisku.",
  "Poczekaj na potwierdzenie od koordynatora wolontariatu.",
  "Po akceptacji, rozpocznij swoją przygodę z pomocą zwierzętom!",
];

const donationSteps = [
  `Wpłać darowiznę na konto bankowe schroniska: ${DONATION_IBAN}.`,
  "W tytule przelewu wpisz „Darowizna na zwierzęta” i opcjonalnie swoje imię.",
  "Po dokonaniu wpłaty możesz wysłać potwierdzenie na e-mail schroniska, aby otrzymać podziękowanie.",
];

const needsSteps = [
  "Karma dla psów i kotów – zarówno mokra, jak i sucha.",
  "Koce, ręczniki i posłania dla zwierząt.",
  "Zabawki, gryzaki i smycze dla zwierząt.",
  "Środki czystości – płyny dezynfekujące, rękawice, worki na śmieci.",
  "Akcesoria weterynaryjne – szczepionki, witaminy, środki przeciw pasożytom.",
];

const howToHelpJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ItemList",
      name: "Jak nam pomóc?",
      itemListElement: helpOptions.map((option, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: option.title,
        description: option.description,
      })),
    },
    {
      "@type": "HowTo",
      name: "Jak zostać wolontariuszem?",
      step: volunteerSteps.map((text, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        text,
      })),
    },
    {
      "@type": "HowTo",
      name: "Na jakie konto wpłacać darowizny?",
      step: donationSteps.map((text, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        text,
      })),
    },
    {
      "@type": "ItemList",
      name: "Co najbardziej potrzebujemy?",
      itemListElement: needsSteps.map((text, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: text,
      })),
    },
  ],
};

const highlightIban = (text: string): ReactNode => {
  if (!text.includes(DONATION_IBAN)) return text;

  const [before, after] = text.split(DONATION_IBAN);
  return (
    <>
      {before}
      <strong>{DONATION_IBAN}</strong>
      {after}
    </>
  );
};

const HowToHelp = () => {
  useEffect(() => {
    document.title = PAGE_TITLE;
  }, []);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToHelpJsonLd) }}
      />
      <Container className="space-y-12 md:space-y-16">
        <section
          aria-labelledby="how-to-help-heading"
          className="space-y-6 lg:space-y-8"
        >
          <div className="space-y-2">
            <h1
              id="how-to-help-heading"
              className="text-3xl font-bold text-green-900 md:text-5xl"
            >
              Jak nam pomóc?
            </h1>
            <p className="text-sm leading-6 md:text-base md:leading-7">
              Cieszymy się, że chcesz pomóc! Oto kilka sposobów, w jakie możesz
              wesprzeć nasze schronisko.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
            {helpOptions.map((option) => (
              <li className="space-y-2" key={option.title}>
                <div
                  className={`${option.bgColor} grid aspect-square place-items-center rounded-full text-5xl`}
                  aria-hidden="true"
                >
                  {option.icon}
                </div>
                <div className="space-y-1 text-center">
                  <h3 className="font-semibold md:text-lg">{option.title}</h3>
                  <p className="text-xs md:text-sm">{option.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section
          aria-labelledby="volunteer-heading"
          className="space-y-6 lg:space-y-8"
        >
          <h2
            id="volunteer-heading"
            className="text-2xl font-bold text-green-900 md:text-4xl"
          >
            Jak zostać wolontariuszem?
          </h2>
          <ol className="w-fit list-inside list-decimal space-y-2 bg-red-100 p-4 text-sm leading-6 md:text-base md:leading-7">
            {volunteerSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
        <section
          aria-labelledby="donation-heading"
          className="space-y-6 lg:space-y-8"
        >
          <h2
            id="donation-heading"
            className="text-2xl font-bold text-green-900 md:text-4xl"
          >
            Na jakie konto wpłacać darowizny?
          </h2>
          <ol className="w-fit list-inside list-decimal space-y-2 bg-yellow-100 p-4 text-sm leading-6 md:text-base md:leading-7">
            {donationSteps.map((step) => (
              <li key={step}>{highlightIban(step)}</li>
            ))}
          </ol>
        </section>
        <section
          aria-labelledby="needs-heading"
          className="space-y-6 lg:space-y-8"
        >
          <h2
            id="needs-heading"
            className="text-2xl font-bold text-green-900 md:text-4xl"
          >
            Co najbardziej potrzebujemy?
          </h2>
          <ol className="w-fit list-inside list-decimal space-y-2 bg-green-100 p-4 text-sm leading-6 md:text-base md:leading-7">
            {needsSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
        <section
          aria-labelledby="video-heading"
          className="space-y-6 md:space-y-8"
        >
          <div className="space-y-2 text-center">
            <h2
              id="video-heading"
              className="text-2xl font-bold text-green-900 md:text-4xl"
            >
              Zobacz nas w akcji!
            </h2>
          </div>
          <div className="relative mx-auto grid aspect-video max-h-100 w-full max-w-5xl place-items-center rounded-2xl bg-black/20">
            <iframe
              src="https://www.youtube.com/embed/cD83zreoW_g?si=pS-_y0bB2zQ6Xe6C"
              title="Film użyty na potrzeby projektu, nie jest to nasze schronisko."
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute top-0 left-0 h-full w-full rounded-2xl border-0"
            />
          </div>
        </section>
      </Container>
    </main>
  );
};

export default HowToHelp;

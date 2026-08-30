import { useEffect } from "react";
import { Button, Container, Skeleton } from "@/components/ui";
import {
  ShortFaqList,
  AnimalCard,
  BlogCard,
  shortFaqData,
  ErrorState,
  EmptyState,
} from "@/components/shared";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { BlogPost, IconCard, LongestWaitingAnimal } from "@/types";

interface AnimalTypeTile {
  name: string;
  image: string;
  href: string;
  label: string;
}

const animalTypes: AnimalTypeTile[] = [
  {
    name: "Psy",
    image: "/images/dog.webp",
    href: "/zwierzeta/psy",
    label: "Zobacz psy do adopcji",
  },
  {
    name: "Koty",
    image: "/images/cat.webp",
    href: "/zwierzeta/koty",
    label: "Zobacz koty do adopcji",
  },
  {
    name: "Króliki",
    image: "/images/rabbit.webp",
    href: "/zwierzeta/kroliki",
    label: "Zobacz króliki do adopcji",
  },
];

const adoptionsReasons: IconCard[] = [
  {
    icon: "🐾",
    title: "Ratujesz życie",
    bgColor: "bg-slate-100",
    description:
      "Każda adopcja to szansa dla zwierzaka na opuszczenie schroniska i znalezienie kochającego domu.",
  },
  {
    icon: "❤️",
    bgColor: "bg-red-100",
    title: "Zyskujesz przyjaciela",
    description:
      "Zwierzęta ze schroniska są często bardzo oddane i wdzięczne za opiekę.",
  },
  {
    icon: "💰",
    bgColor: "bg-yellow-100",
    title: "Oszczędzasz pieniądze",
    description:
      "Wiele zwierząt jest już zaszczepionych, odrobaczonych i wykastrowanych.",
  },
  {
    icon: "🏡",
    bgColor: "bg-green-100",
    title: "Pomagasz zwierzętom",
    description:
      "Adoptując pupila, robisz miejsce dla kolejnego potrzebującego.",
  },
];

const adoptionProcess: IconCard[] = [
  {
    icon: "🔍",
    bgColor: "bg-blue-100",
    title: "Wybierz zwierzę",
    description:
      "Przejrzyj nasze zwierzaki i znajdź pupila dopasowanego do Twoich warunków życia, stylu dnia oraz ewentualnych alergii.",
  },
  {
    icon: "👤",
    bgColor: "bg-slate-100",
    title: "Uzupełnij profil",
    description:
      "Zaloguj się na swoje konto i wypełnij wymagane dane osobowe potrzebne do rozpoczęcia procesu adopcji.",
  },
  {
    icon: "📝",
    bgColor: "bg-yellow-100",
    title: "Zgłoś adopcję",
    description:
      "Wyślij wniosek adopcyjny dla wybranego zwierzęcia — to szybki i prosty formalny krok.",
  },
  {
    icon: "⏳",
    bgColor: "bg-orange-100",
    title: "Czekaj na odpowiedź",
    description:
      "Nasz zespół rozpatrzy Twój wniosek i skontaktuje się z Tobą w sprawie dalszych kroków.",
  },
  {
    icon: "🏠",
    bgColor: "bg-green-100",
    title: "Odwiedź schronisko",
    description:
      "Po wstępnej akceptacji przyjdź osobiście na rozmowę i odbiór pupila.",
  },
  {
    icon: "❤️",
    bgColor: "bg-red-100",
    title: "Ciesz się rodziną",
    description:
      "Powitaj nowego członka rodziny i ciesz się wspólnymi chwilami.",
  },
];

const faqFeatures: IconCard[] = [
  {
    icon: "📢",
    title: "Uświadamiaj innych",
    bgColor: "bg-blue-100",
    description:
      "Zachęcaj innych do adopcji – wiele osób nawet nie wie, że może znaleźć swojego pupila w schronisku.",
  },
  {
    icon: "🎁",
    title: "Organizuj zbiórki",
    bgColor: "bg-yellow-100",
    description:
      "Możesz zorganizować zbiórkę karmy lub akcesoriów. Daj nam znać – pomożemy ją nagłośnić.",
  },
  {
    icon: "🐕",
    title: "Pomagaj na miejscu",
    bgColor: "bg-green-100",
    description:
      "Wyprowadzanie psów, pielęgnacja i socjalizacja to ogromna pomoc dla zwierząt w schronisku.",
  },
  {
    icon: "❤️",
    title: "Wesprzyj darowizną",
    bgColor: "bg-red-100",
    description:
      "Każda wpłata pomaga zapewnić zwierzętom jedzenie, leczenie i lepsze warunki życia.",
  },
];

const PAGE_TITLE = "Schronisko dla zwierząt – adoptuj pupila";

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: shortFaqData.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

const HomePage = () => {
  // Ustawienie tytułu strony
  useEffect(() => {
    document.title = PAGE_TITLE;
  }, []);

  const cmsUrl = import.meta.env.VITE_STRIPE_CMS_ADMIN_URL!;
  const hasRemoteCms = Boolean(cmsUrl) && /^https?:\/\//i.test(cmsUrl!);

  const {
    data: longestWaitingAnimals = [],
    isLoading: isAnimalsLoading,
    error: animalsError,
  } = useQuery({
    queryKey: ["longestWaitingAnimals"],
    queryFn: async () => {
      const res = await axios.get<LongestWaitingAnimal[]>(
        "/api/animals?limit=8&sort=foundAt:asc&status=SZUKA_DOMU",
      );
      return res.data;
    },
  });

  const {
    data: blogPosts = [],
    isLoading: isBlogLoading,
    error: blogError,
  } = useQuery({
    queryKey: ["blogPosts", cmsUrl],
    enabled: hasRemoteCms,
    queryFn: async () => {
      const res = await axios.get<{ data: BlogPost[] }>(
        `${cmsUrl}/api/posts?populate=*&pagination[limit]=6&sort=createdAt:desc`,
      );
      return res.data.data ?? [];
    },
  });

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Container className="space-y-12 md:space-y-16">
        {/* Gatunki zwierząt */}
        <section
          id="animalTypes"
          aria-labelledby="animal-types-heading"
          className="space-y-6 lg:space-y-8"
        >
          <div className="space-y-2">
            <h1
              id="animal-types-heading"
              className="text-3xl font-bold text-green-900 md:text-5xl"
            >
              Schronisko
            </h1>
            <p className="text-sm leading-6 md:text-base md:leading-7">
              Każdego dnia nasze zwierzaki czekają na kogoś, kto da im nowy dom.{" "}
              <br /> Nie bądź obojętny i stań się rodzicem jednego z naszych
              czworonożnych przyjacieli.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6">
            {animalTypes.map((animal) => (
              <li key={animal.href}>
                <AnimalTypeCard animal={animal} />
              </li>
            ))}
            <li>
              <Link
                to="/zwierzeta"
                aria-label="Zobacz wszystkie zwierzęta do adopcji"
                className="grid aspect-square place-items-center rounded-full bg-green-900"
              >
                <span className="z-2 text-xl font-semibold text-white lg:text-3xl">
                  Wszystkie
                </span>
              </Link>
            </li>
          </ul>
        </section>
        {/* Dlaczego warto adoptować? */}
        <section
          id="adoptionsReasons"
          aria-labelledby="adoption-reasons-heading"
          className="space-y-6 lg:space-y-8"
        >
          <div className="space-y-2">
            <h2
              id="adoption-reasons-heading"
              className="text-2xl font-bold text-green-900 md:text-4xl"
            >
              Dlaczego warto adoptować?
            </h2>
            <p className="text-sm leading-6 md:text-base md:leading-7">
              Adoptując zwierzę ze schroniska, nie tylko zyskujesz wiernego
              przyjaciela, ale także dajesz drugą szansę na lepsze życie.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-6">
            {adoptionsReasons.map((reason) => (
              <li key={reason.title}>
                <IconFeatureCard item={reason} />
              </li>
            ))}
          </ul>
        </section>
        {/* Najdłużej czekające zwierzęta */}
        <section
          id="longestWaiting"
          aria-labelledby="longest-waiting-heading"
          className="space-y-6 lg:space-y-8"
        >
          <div className="space-y-2">
            <h2
              id="longest-waiting-heading"
              className="text-2xl font-bold text-green-900 md:text-4xl"
            >
              Najdłużej czekające
            </h2>
            <p className="text-sm leading-6 md:text-base md:leading-7">
              Poznaj naszych podopiecznych, którzy czekają na nowy dom już od
              dłuższego czasu. Każdy z nich zasługuje na miłość i opiekę, a Ty
              możesz być tym, który odmieni ich życie.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {isAnimalsLoading ? (
              <LoadingLongestWaitingAnimals />
            ) : animalsError ? (
              <ErrorState
                title="Wystąpił błąd"
                description="Wystąpił błąd podczas ładowania zwierząt. Odśwież stronę lub spróbuj później."
              />
            ) : longestWaitingAnimals.length === 0 ? (
              <EmptyState
                title="Brak zwierząt"
                description="Aktualnie brak zwierząt w naszym schronisku. Wróć wkrótce, aby poznać nasze zwierzaki."
              />
            ) : (
              longestWaitingAnimals.map((animal) => (
                <AnimalCard key={animal.id} animal={animal} />
              ))
            )}
          </div>
          <Button variant="success" asChild>
            <Link to="/zwierzeta">Zobacz wszystkie</Link>
          </Button>
        </section>
        {/* Jak adoptować? */}
        <section
          id="adoptionProcess"
          aria-labelledby="adoption-process-heading"
          className="space-y-6 lg:space-y-8"
        >
          <div className="space-y-2">
            <h2
              id="adoption-process-heading"
              className="text-2xl font-bold text-green-900 md:text-4xl"
            >
              Jak wygląda proces adopcji?
            </h2>
            <p className="text-sm leading-6 md:text-base md:leading-7">
              Proces adopcji jest prosty i przejrzysty. Od wyboru pupila po
              odbiór w schronisku — przeprowadzimy Cię przez każdy krok.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 lg:gap-6">
            {adoptionProcess.map((step) => (
              <li key={step.title}>
                <IconFeatureCard item={step} />
              </li>
            ))}
          </ul>
        </section>
        {/* Często zadawane pytania */}
        <section
          id="faq"
          aria-labelledby="faq-heading"
          className="space-y-6 lg:space-y-8"
        >
          <div className="space-y-2">
            <h2
              id="faq-heading"
              className="text-2xl font-bold text-green-900 md:text-4xl"
            >
              Często zadawane pytania
            </h2>
          </div>
          <div className="space-y-4 md:flex md:gap-6">
            <ShortFaqList />
            <ul className="flex-1 space-y-4 md:pl-6">
              {faqFeatures.map((feature) => (
                <li key={feature.title}>
                  <FaqCard feature={feature} />
                </li>
              ))}
            </ul>
          </div>
          <Button variant="success" asChild>
            <Link to="/kontakt">Skontaktuj się z nami</Link>
          </Button>
        </section>
        {/* Nasze ostatnie akcje */}
        <section
          id="blog"
          aria-labelledby="blog-heading"
          className="space-y-6 lg:space-y-8"
        >
          <div className="space-y-2">
            <h2
              id="blog-heading"
              className="text-2xl font-bold text-green-900 md:text-4xl"
            >
              Nasze ostatnie akcje
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {isBlogLoading ? (
              <LoadingBlogPosts />
            ) : blogError ? (
              <ErrorState
                title="Wystąpił błąd"
                description="Wystąpił błąd podczas ładowania postów z bloga. Odśwież stronę lub spróbuj później."
              />
            ) : blogPosts.length === 0 ? (
              <EmptyState
                title="Brak postów"
                description="Aktualnie brak postów w naszym blogu. Wróć wkrótce, aby poznać nasze ostatnie akcje."
              />
            ) : (
              blogPosts.map((post) => <BlogCard key={post.slug} post={post} />)
            )}
          </div>
          <Button variant="success" asChild>
            <Link to="/blog">Zobacz nasze akcje</Link>
          </Button>
        </section>
      </Container>
    </main>
  );
};

// Karta gatunku zwierzęcia
const AnimalTypeCard = ({ animal }: { animal: AnimalTypeTile }) => {
  return (
    <Link
      to={animal.href}
      aria-label={animal.label}
      className="relative grid aspect-square place-items-center overflow-hidden rounded-2xl"
    >
      <img
        src={animal.image}
        alt=""
        width={400}
        height={400}
        aria-hidden="true"
        className="absolute size-full object-cover"
        loading="eager"
      />
      <div className="absolute size-full bg-black/50" aria-hidden="true" />
      <span className="z-2 text-xl font-semibold text-white lg:text-3xl">
        {animal.name}
      </span>
    </Link>
  );
};

const IconFeatureCard = ({ item }: { item: IconCard }) => {
  return (
    <div className="space-y-2">
      <div
        className={`${item.bgColor} grid aspect-square place-items-center rounded-full text-3xl`}
        aria-hidden="true"
      >
        {item.icon}
      </div>
      <div className="space-y-1 text-center">
        <h3 className="font-semibold md:text-lg">{item.title}</h3>
        <p className="text-xs md:text-sm">{item.description}</p>
      </div>
    </div>
  );
};

const LoadingLongestWaitingAnimals = () => {
  return Array.from({ length: 8 }).map((_, index) => (
    <div key={index} className="space-y-2" aria-hidden="true">
      <Skeleton className="aspect-video" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  ));
};

const LoadingBlogPosts = () => {
  return Array.from({ length: 6 }).map((_, index) => (
    <div key={index} className="space-y-2" aria-hidden="true">
      <Skeleton className="aspect-video" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-50" />
        <Skeleton className="h-5 w-30" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  ));
};

const FaqCard = ({ feature }: { feature: IconCard }) => {
  return (
    <div className="flex items-center gap-x-4">
      <div
        className={`${feature.bgColor} grid h-30 min-w-30 place-items-center rounded-full text-3xl`}
        aria-hidden="true"
      >
        {feature.icon}
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold lg:text-lg">{feature.title}</h3>
        <p className="text-xs lg:text-sm">{feature.description}</p>
      </div>
    </div>
  );
};

export default HomePage;

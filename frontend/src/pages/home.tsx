import { Button, Container, Skeleton } from "@/components/ui";
import { ShortFaqList, AnimalCard, BlogCard } from "@/components/shared";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { CircleAlert, Info } from "lucide-react";

interface AnimalType {
  name: string;
  image: string;
  href: string;
}

const animalTypes: AnimalType[] = [
  {
    name: "Psy",
    image: "./dog.webp",
    href: "/zwierzeta/psy",
  },
  {
    name: "Koty",
    image: "./cat.webp",
    href: "/zwierzeta/koty",
  },
  {
    name: "Króliki",
    image: "./rabbit.webp",
    href: "/zwierzeta/kroliki",
  },
];

interface AdoptionReason {
  icon: string;
  bgColor: string;
  title: string;
  description: string;
}

const adoptionsReasons: AdoptionReason[] = [
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

type FaqFeature = {
  icon: string;
  title: string;
  description: string;
  bgColor: string;
};

const faqFeatures: FaqFeature[] = [
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

interface LongestWaintingAnimal {
  id: number;
  name: string;
  imageUrl: string[];
  dateOfBirth: string;
  description: string;
}

interface BlogPost {
  slug: string;
  title: string;
  content: { children: { text: string }[] }[];
  image: { url: string; formats?: { small?: { url: string } } }[];
  createdAt: string;
}

const HomePage = () => {
  // Funkcja do pobierania najdłużej czekających zwierząt
  const getLongestWaintingAnimals = async () => {
    const res = await axios.get<LongestWaintingAnimal[]>(
      "/api/animals?limit=8&sort=foundAt:asc&status=SZUKA_DOMU",
    );
    return res.data;
  };

  // Funkcja do pobierania postów z bloga
  const getBlogPosts = async () => {
    const res = await axios.get<{ data: BlogPost[] }>(
      `${import.meta.env.VITE_STRIPE_CMS_ADMIN_URL}/api/posts?populate=*&pagination[limit]=6&sort=createdAt:desc`,
    );
    return res.data.data ?? [];
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["longestWaintingAnimals", "blogPosts"],
    queryFn: () => Promise.all([getLongestWaintingAnimals(), getBlogPosts()]),
  });

  const longestWaintingAnimals = data?.[0] ?? [];
  const blogPosts = data?.[1] ?? [];

  return (
    <main>
      <Container className="space-y-12 md:space-y-16">
        {/* Gatunki zwierząt */}
        <section id="animalTypes" className="space-y-6 lg:space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-green-900 md:text-5xl">
              Schronisko
            </h1>
            <p className="text-sm leading-6 md:text-base md:leading-7">
              Aktualnie posiadamy ponad 100 zwierząt, które czekają na nowy dom!{" "}
              <br /> Nie bądź obojętny i stań się rodzicem jednego z naszych
              czworonogich przyjacieli.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6">
            {animalTypes.map((animal: AnimalType, index: number) => (
              <AnimalTypeCard key={index} animal={animal} />
            ))}
            <Link to="/zwierzeta">
              <div className="grid aspect-square place-items-center rounded-full bg-green-900">
                <h2 className="z-2 text-xl font-semibold text-white lg:text-3xl">
                  Wszystkie
                </h2>
              </div>
            </Link>
          </div>
        </section>
        {/* Dlaczego warto adoptować? */}
        <section id="adoptionsReasons" className="space-y-6 lg:space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-green-900 md:text-4xl">
              Dlaczego warto adoptować?
            </h2>
            <p className="text-sm leading-6 md:text-base md:leading-7">
              Adoptując zwierzę ze schroniska, nie tylko zyskujesz wiernego
              przyjaciela, ale także dajesz drugą szansę na lepsze życie.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-6">
            {adoptionsReasons.map((reason: AdoptionReason, index: number) => (
              <AdoptionReasonCard key={index} reason={reason} />
            ))}
          </div>
        </section>
        {/* Najdłużej czekające zwierzęta */}
        <section id="longestWaiting" className="space-y-6 lg:space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-green-900 md:text-4xl">
              Najdłużej czekające
            </h2>
            <p className="text-sm leading-6 md:text-base md:leading-7">
              Poznaj naszych podopiecznych, którzy czekają na nowy dom już od
              dłuższego czasu. Każdy z nich zasługuje na miłość i opiekę, a Ty
              możesz być tym, który odmieni ich życie.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {isLoading && <LoadingLongestWaitingAnimals />}
            {error && <ErrorLongestWaitingAnimals />}
            {!isLoading && !error && longestWaintingAnimals.length === 0 && (
              <EmptyLongestWaitingAnimals />
            )}
            {!isLoading &&
              !error &&
              longestWaintingAnimals.map((animal) => (
                <AnimalCard key={animal.id} animal={animal} />
              ))}
          </div>
          <Button variant={"success"} asChild>
            <Link to="/zwierzeta">Zobacz wszystkie</Link>
          </Button>
        </section>
        {/* Często zadawane pytania */}
        <section id="faq" className="space-y-6 lg:space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-green-900 md:text-4xl">
              Często zadawane pytania
            </h2>
          </div>
          <div className="space-y-4 md:flex md:gap-6">
            <ShortFaqList />
            <div className="flex-1 space-y-4 md:pl-6">
              {faqFeatures.map((feature: FaqFeature, index: number) => (
                <FaqCard key={index} feature={feature} />
              ))}
            </div>
          </div>
          <Button variant={"success"} asChild>
            <Link to="/kontakt">Skontaktuj się z nami</Link>
          </Button>
        </section>
        {/* Nasze ostatnie akcje */}
        <section id="blog" className="space-y-6 lg:space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-green-900 md:text-4xl">
              Nasze ostatnie akcje
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {isLoading && <LoadingBlogPosts />}
            {error && <ErrorBlogPosts />}
            {!isLoading && !error && blogPosts.length === 0 && (
              <EmptyBlogPosts />
            )}
            {blogPosts.map((post: BlogPost, index: number) => (
              <BlogCard key={index} post={post} />
            ))}
          </div>
          <Button variant={"success"} asChild>
            <Link to="/blog">Zobacz nasze akcje</Link>
          </Button>
        </section>
      </Container>
    </main>
  );
};

// Karta gatunku zwierzęcia
const AnimalTypeCard = ({ animal }: { animal: AnimalType }) => {
  return (
    <Link to={animal.href}>
      <div className="relative grid aspect-square place-items-center overflow-hidden rounded-2xl">
        <img
          src={animal.image}
          alt=""
          role="presentation"
          className="absolute size-full object-cover"
        />
        <div className="absolute size-full bg-black/50 object-cover" />
        <h2 className="z-2 text-xl font-semibold text-white lg:text-3xl">
          {animal.name}
        </h2>
      </div>
    </Link>
  );
};

// Karta powodu adoptowania zwierzęcia
const AdoptionReasonCard = ({ reason }: { reason: AdoptionReason }) => {
  return (
    <div className="space-y-2">
      <div
        className={`${reason.bgColor} grid aspect-square place-items-center rounded-full text-3xl`}
      >
        {reason.icon}
      </div>
      <div className="space-y-1 text-center">
        <h3 className="font-semibold md:text-lg">{reason.title}</h3>
        <p className="text-xs md:text-sm">{reason.description}</p>
      </div>
    </div>
  );
};

// UI podczas ładowania najdłużej czekających zwierząt
const LoadingLongestWaitingAnimals = () => {
  return Array.from({ length: 8 }).map((_, index: number) => (
    <div key={index} className="space-y-2">
      <Skeleton className="aspect-video" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  ));
};

// UI podczas wystąpienia błędu podczas ładowania najdłużej czekających zwierząt
const ErrorLongestWaitingAnimals = () => {
  return (
    <section
      id="error"
      className="col-span-full flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center"
    >
      <CircleAlert className="size-12 text-red-600" />
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-red-900 md:text-xl">
          Wystapił błąd
        </h2>
        <p className="max-w-md text-sm text-red-800 md:text-base">
          Wystąpił błąd podczas ładowania zwierząt. Odśwież stronę lub spróbuj
          później.
        </p>
      </div>
    </section>
  );
};

// UI podczas braku najdłużej czekających zwierząt
const EmptyLongestWaitingAnimals = () => {
  return (
    <section
      id="empty-longest-waiting-animals"
      className="col-span-full flex flex-col items-center justify-center gap-4 rounded-2xl border border-blue-900 bg-blue-50 px-6 py-12 text-center"
    >
      <Info className="size-12 text-blue-600" />
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-blue-900 md:text-xl">
          Brak zwierząt
        </h2>
        <p className="max-w-md text-sm text-blue-900 md:text-base">
          Aktualnie brak zwierząt w naszym schronisku. Wróć wkrótce, aby poznać
          nasze zwierzaki.
        </p>
      </div>
    </section>
  );
};

// UI podczas ładowania postów z bloga
const LoadingBlogPosts = () => {
  return Array.from({ length: 6 }).map((_, index: number) => (
    <div key={index} className="space-y-2">
      <Skeleton className="aspect-video" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-50" />
        <Skeleton className="h-5 w-30" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  ));
};

// UI podczas wystąpienia błędu podczas ładowania najdłużej czekających zwierząt
const ErrorBlogPosts = () => {
  return (
    <section
      id="error-blog-posts"
      className="col-span-full flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center"
    >
      <CircleAlert className="size-12 text-red-600" />
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-red-900 md:text-xl">
          Wystapił błąd
        </h2>
        <p className="max-w-md text-sm text-red-800 md:text-base">
          Wystąpił błąd podczas ładowania postów z bloga. Odśwież stronę lub
          spróbuj później.
        </p>
      </div>
    </section>
  );
};

// UI podczas braku najdłużej czekających zwierząt
const EmptyBlogPosts = () => {
  return (
    <section
      id="empty-blog-posts"
      className="col-span-full flex flex-col items-center justify-center gap-4 rounded-2xl border border-blue-900 bg-blue-50 px-6 py-12 text-center"
    >
      <Info className="size-12 text-blue-600" />
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-blue-900 md:text-xl">
          Brak postów
        </h2>
        <p className="max-w-md text-sm text-blue-900 md:text-base">
          Aktualnie brak postów w naszym blogu. Wróć wkrótce, aby poznać nasze
          ostatnie akcje.
        </p>
      </div>
    </section>
  );
};

// Karta pytania i odpowiedzi
const FaqCard = ({ feature }: { feature: FaqFeature }) => {
  return (
    <div className="flex items-center gap-x-4">
      <div
        className={`${feature.bgColor} grid h-30 min-w-30 place-items-center rounded-full text-3xl`}
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

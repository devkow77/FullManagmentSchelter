import { Button, Container } from "@/components/ui";
import axios from "axios";
import { useParams } from "react-router";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import { useQuery } from "@tanstack/react-query";
import "swiper/css/pagination";
import { Check, ImageOff, X } from "lucide-react";
import {
  calculateAge,
  formatAnimalHealthStatus,
  formatAnimalSize,
  formatAnimalType,
} from "@/lib/utils";
import type { AnimalHealthStatus, AnimalStatus } from "@/types/animal";
import { Link } from "react-router";
import { AnimalCard } from "@/components/shared";

interface Animal {
  id: number;
  name: string;
  description: string;
  imageUrl: string[];
  createdAt: string;
  dateOfBirth: string | Date;
  type: string;
  size: string;
  traits: string;
  healthStatus: string;
  status: AnimalStatus;
  foundAt: string | Date;
  isSterilized: boolean;
  isVaccinated: boolean;
  isChildFriendly: boolean;
  isTrained: boolean;
  lovesPlay: boolean;
  lovesWalks: boolean;
  acceptsDogs: boolean;
  acceptsCats: boolean;
  lovesAffection: boolean;
  poorlyToleratesShelter: boolean;
}

const ANIMAL_TRAIT_ITEMS = [
  { key: "isSterilized", label: "Sterylizacja/Kastracja" },
  { key: "isVaccinated", label: "Szczepienia" },
  { key: "isChildFriendly", label: "Przyjazny dzieciom" },
  { key: "isTrained", label: "Szkolony" },
  { key: "lovesPlay", label: "Uwielbia zabawę" },
  { key: "lovesWalks", label: "Uwielbia spacery" },
  { key: "acceptsDogs", label: "Akceptuje psy" },
  { key: "acceptsCats", label: "Akceptuje koty" },
  { key: "lovesAffection", label: "Uwielbia pieszczoty" },
  { key: "poorlyToleratesShelter", label: "Źle nosi pobyt w schronisku" },
] as const;

const DAYS_UNTIL_AVAILABLE = 7;

const getDaysUntilAvailable = (foundAt: string | Date) => {
  const foundDate = new Date(foundAt);
  foundDate.setHours(0, 0, 0, 0);

  const availableDate = new Date(foundDate);
  availableDate.setDate(availableDate.getDate() + DAYS_UNTIL_AVAILABLE);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = availableDate.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
};

const formatDaysLeft = (days: number) => {
  if (days === 1) return "1 dzień";
  return `${days} dni`;
};

const getAnimal = async (id: string) => {
  const res = await axios.get<Animal>(`/api/animals/${id}`);
  return res.data;
};

const getOtherAnimals = async (excludeId: string) => {
  const res = await axios.get<Animal[]>(
    `/api/animals?limit=6&status=SZUKA_DOMU`,
  );

  return res.data.filter((animal) => animal.id !== Number(excludeId));
};

const TraitIcon = ({ active }: { active: boolean }) =>
  active ? (
    <Check className="text-green-600" />
  ) : (
    <X className="text-red-600" />
  );

const AnimalPage = () => {
  const { id } = useParams();

  const { data } = useQuery({
    queryKey: ["animal", id],
    queryFn: () =>
      Promise.all([getAnimal(id as string), getOtherAnimals(id as string)]),
    enabled: Boolean(id),
  });

  const animal = data?.[0];
  const otherAnimals = data?.[1] ?? [];

  const canAdopt = animal?.status === "SZUKA_DOMU";
  const isFound = animal?.status === "ZNALEZIONY";
  const daysUntilAvailable =
    isFound && animal?.foundAt
      ? getDaysUntilAvailable(animal.foundAt)
      : null;

  return (
    <main>
      <Container className="space-y-12 md:space-y-16">
        <section id="post" className="space-y-6 gap-x-8 lg:flex lg:space-y-8">
          <div className="relative mx-auto grid aspect-square max-h-100 flex-1 place-items-center overflow-hidden rounded-full bg-black/10">
            {animal?.imageUrl[0] ? (
              <img
                src={animal.imageUrl[0]}
                alt={animal.name}
                className="absolute size-full object-cover object-center"
              />
            ) : (
              <ImageOff className="absolute size-10 object-cover text-black opacity-20 md:size-20" />
            )}
          </div>
          <div className="flex-2 space-y-4">
            <h1 className="text-3xl font-bold text-green-900 md:text-5xl">
              {animal?.name}
            </h1>
            <div className="flex flex-wrap gap-x-20">
              <ul className="text-sm leading-6 font-medium md:text-base md:leading-7">
                <li>Gatunek: {formatAnimalType[animal?.type as string]}</li>
                <li>
                  W schronisku od{" "}
                  {animal?.createdAt
                    ? `${new Date(animal.createdAt).toLocaleDateString("pl-PL")} r.`
                    : "—"}
                </li>
                <li>
                  Wiek:{" "}
                  {animal?.dateOfBirth ? calculateAge(animal.dateOfBirth) : "—"}
                </li>
                <li>Rozmiar: {formatAnimalSize[animal?.size as string]}</li>
                <li>Cechy: {animal?.traits}</li>
                <li>
                  Stan zdrowia:{" "}
                  {
                    formatAnimalHealthStatus[
                      animal?.healthStatus as AnimalHealthStatus
                    ]
                  }
                </li>
              </ul>
              <ul className="text-sm leading-6 font-medium md:text-base md:leading-7">
                {ANIMAL_TRAIT_ITEMS.map(({ key, label }) => (
                  <li key={key} className="flex items-center gap-x-2">
                    <TraitIcon active={Boolean(animal?.[key])} /> {label}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-sm leading-6 md:text-base md:leading-7">
              {animal?.description}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                {canAdopt ? (
                  <Button variant="success" asChild>
                    <Link to={`/`}>Zgłoś wniosek o adopcję</Link>
                  </Button>
                ) : (
                  <Button variant="success" disabled>
                    Zgłoś wniosek o adopcję
                  </Button>
                )}
                {isFound && daysUntilAvailable !== null && (
                  <p className="text-xs leading-5 text-muted-foreground md:text-sm md:leading-6">
                    {daysUntilAvailable > 0
                      ? `Adopcja będzie możliwa za ${formatDaysLeft(daysUntilAvailable)} (tydzień od znalezienia).`
                      : "Adopcja będzie możliwa wkrótce — trwa aktualizacja statusu."}
                  </p>
                )}
              </div>
              <a
                href="tel:+48111222333"
                className="text-sm leading-6 font-semibold md:text-base md:leading-7"
              >
                Numer telefonu: +48 111 222 333
              </a>
            </div>
          </div>
        </section>
        <section id="similiar-animals" className="space-y-6 lg:space-y-8">
          <h2 className="text-2xl font-bold text-green-900 md:text-4xl">
            Inne zwierzęta
          </h2>
          {otherAnimals.length > 0 && (
            <Swiper
              spaceBetween={24}
              slidesPerView={1.1}
              grabCursor
              modules={[Pagination]}
              pagination={{ clickable: true }}
              breakpoints={{
                640: {
                  slidesPerView: 2,
                },
                1024: {
                  slidesPerView: 3,
                },
              }}
            >
              {otherAnimals.map((otherAnimal) => (
                <SwiperSlide key={otherAnimal.id}>
                  <AnimalCard animal={otherAnimal} />
                </SwiperSlide>
              ))}
              <SwiperSlide>
                <Link
                  to="/zwierzeta"
                  className="space-y-2 transition-colors duration-200 hover:text-green-900"
                >
                  <div className="relative grid aspect-video place-items-center overflow-hidden rounded-xl bg-green-900">
                    <h3 className="text-xl font-semibold text-white lg:text-3xl">
                      Wszystkie
                    </h3>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold lg:text-lg">
                      Zobacz wszystkie zwierzęta
                    </h3>
                    <p className="line-clamp-3 text-xs leading-5 md:text-sm md:leading-6">
                      Przejrzyj pełną listę naszych podopiecznych czekających na
                      nowy dom.
                    </p>
                  </div>
                </Link>
              </SwiperSlide>
            </Swiper>
          )}
        </section>
      </Container>
    </main>
  );
};

export default AnimalPage;

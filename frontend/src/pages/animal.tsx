import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Container,
  Label,
  Textarea,
} from "@/components/ui";
import axios, { AxiosError } from "axios";
import { Link, Navigate, useParams } from "react-router";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import "swiper/css/pagination";
import { Check, ImageOff, X } from "lucide-react";
import {
  calculateAge,
  formatAnimalEnergyLevel,
  formatAnimalHealthStatus,
  formatAnimalSize,
  formatAnimalType,
  formatShelterVisitCountdown,
  getDaysUntilShelterVisit,
} from "@/lib/utils";
import type {
  Adoption,
  Animal,
  AnimalHealthStatus,
  OwnProfile,
} from "@/types";
import { AnimalCard } from "@/components/shared";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  createAdoptionSchema,
  type CreateAdoptionFormData,
} from "@/schemas/adoption.schema";

// Cechy zwierzęcia
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

// Ilosc dni do upływu aby zwierzę mogło być adoptowane
const DAYS_UNTIL_AVAILABLE = 7;

// Funkcja obliczająca dni do adoptacji zwierzęcia
const getDaysUntilAvailable = (foundAt: string | Date) => {
  // Data znalezienia zwierzęcia
  const foundDate = new Date(foundAt);
  foundDate.setHours(0, 0, 0, 0);

  // Data, od której zwierzę może być adoptowane
  const availableDate = new Date(foundDate);
  availableDate.setDate(availableDate.getDate() + DAYS_UNTIL_AVAILABLE);

  // Dzisiaj
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Różnica między datą, od której zwierzę może być adoptowane a dzisiejszą datą
  const diffMs = availableDate.getTime() - today.getTime();

  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
};

// Funkcja formatująca dni do adoptacji zwierzęcia
const formatDaysLeft = (days: number) => {
  if (days === 1) return "1 dzień";
  return `${days} dni`;
};

// Funkcja pobierająca dane zwierzęcia
const getAnimal = async (id: string) => {
  const res = await axios.get<Animal>(`/api/animals/${id}`);
  return res.data;
};

// Funkcja pobierająca innych zwierzat
const getOtherAnimals = async (excludeId: string) => {
  const res = await axios.get<Animal[]>(
    `/api/animals?limit=6&status=SZUKA_DOMU`,
  );

  return res.data.filter((animal) => animal.id !== Number(excludeId));
};

const getMyAdoptions = async () => {
  const res = await axios.get<Adoption[]>("/api/adoptions", {
    withCredentials: true,
  });
  return res.data;
};

const getOwnProfile = async () => {
  const res = await axios.get<OwnProfile>("/api/users/me", {
    withCredentials: true,
  });
  return res.data;
};

const isAdoptionProfileComplete = (profile: OwnProfile | undefined) =>
  Boolean(
    profile?.fullName?.trim() &&
    profile?.gender &&
    profile?.phoneNumber?.trim() &&
    profile?.city?.trim() &&
    profile?.postalCode?.trim() &&
    profile?.street?.trim() &&
    profile?.dateOfBirth &&
    profile?.housingType &&
    profile?.livingConditions?.trim(),
  );

// Funkcja renderująca ikonę cechy zwierzęcia
const TraitIcon = ({ active }: { active: boolean }) =>
  active ? (
    <Check className="text-green-600" aria-hidden="true" />
  ) : (
    <X className="text-red-600" aria-hidden="true" />
  );

const isNumericAnimalId = (value: string | undefined): value is string =>
  Boolean(value && /^\d+$/.test(value));

const AnimalPage = () => {
  const { id } = useParams();
  const hasValidId = isNumericAnimalId(id);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAdoptionForm, setShowAdoptionForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAdoptionFormData>({
    resolver: zodResolver(createAdoptionSchema),
    defaultValues: { message: "" },
  });

  const { data, isError, error } = useQuery({
    queryKey: ["animal", id],
    queryFn: () => Promise.all([getAnimal(id!), getOtherAnimals(id!)]),
    enabled: hasValidId,
    retry: (failureCount, err) => {
      if (
        err instanceof AxiosError &&
        (err.response?.status === 400 || err.response?.status === 404)
      ) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const { data: myAdoptions = [] } = useQuery({
    queryKey: ["my-adoptions", user?.id],
    queryFn: getMyAdoptions,
    enabled: Boolean(user?.id) && user?.role === "UZYTKOWNIK",
  });

  const { data: ownProfile, isPending: isProfilePending } = useQuery({
    queryKey: ["own-profile", user?.id],
    queryFn: getOwnProfile,
    enabled: Boolean(user?.id) && user?.role === "UZYTKOWNIK",
  });

  const animal = data?.[0];
  const otherAnimals = data?.[1] ?? [];
  const existingAdoptionForAnimal = myAdoptions.find(
    (adoption) => adoption.animalId === animal?.id,
  );
  const hasCompleteProfile = isAdoptionProfileComplete(ownProfile);

  useEffect(() => {
    if (animal?.name) {
      document.title = `${animal.name} | Schronisko`;
    } else {
      document.title = "Zwierzę | Schronisko";
    }
  }, [animal?.name]);

  const animalJsonLd = useMemo(() => {
    if (!animal) return null;

    return {
      "@context": "https://schema.org",
      "@type": "Pet",
      name: animal.name,
      description: animal.description,
      image: animal.imageUrl?.length ? animal.imageUrl : undefined,
      url: `/zwierzeta/${animal.id}`,
      additionalProperty: [
        {
          "@type": "PropertyValue",
          name: "Gatunek",
          value: formatAnimalType[animal.type] ?? animal.type,
        },
        {
          "@type": "PropertyValue",
          name: "Rozmiar",
          value: formatAnimalSize[animal.size] ?? animal.size,
        },
        {
          "@type": "PropertyValue",
          name: "Stan zdrowia",
          value:
            formatAnimalHealthStatus[
              animal.healthStatus as AnimalHealthStatus
            ] ?? animal.healthStatus,
        },
      ],
    };
  }, [animal]);

  const canAdopt = animal?.status === "SZUKA_DOMU";
  const isFound = animal?.status === "ZNALEZIONY";
  const daysUntilAvailable =
    isFound && animal?.foundAt ? getDaysUntilAvailable(animal.foundAt) : null;

  const canSubmitAdoption = user?.role === "UZYTKOWNIK";
  const hasPendingAdoption = existingAdoptionForAnimal?.status === "OCZEKUJACA";
  const hasAcceptedAdoption =
    existingAdoptionForAnimal?.status === "ZAAKCEPTOWANA";
  const hasRejectedAdoption = existingAdoptionForAnimal?.status === "ODRZUCONA";
  const hasCancelledAdoption =
    existingAdoptionForAnimal?.status === "ANULOWANA";
  const hasCompletedAdoption =
    existingAdoptionForAnimal?.status === "ZAKONCZONA";
  const isAlreadyAdopted = animal?.status === "ADOPTOWANY";
  const acceptedShelterVisitDays =
    hasAcceptedAdoption &&
    (existingAdoptionForAnimal?.acceptedAt ||
      existingAdoptionForAnimal?.updatedAt)
      ? getDaysUntilShelterVisit(
          existingAdoptionForAnimal.acceptedAt ??
            existingAdoptionForAnimal.updatedAt,
        )
      : null;
  const canOpenAdoptionForm =
    Boolean(canAdopt) &&
    canSubmitAdoption &&
    hasCompleteProfile &&
    !hasPendingAdoption &&
    !hasAcceptedAdoption &&
    !hasRejectedAdoption &&
    !hasCompletedAdoption;

  const adoptionBlockMessage =
    hasCompletedAdoption || isAlreadyAdopted
      ? "To zwierzę zostało już adoptowane."
      : !user
        ? "Tylko zalogowani użytkownicy mogą adoptować."
        : user.role === "ADMINISTRATOR"
          ? "Administrator nie może adoptować zwierząt."
          : user.role === "PRACOWNIK"
            ? "Pracownik nie może adoptować."
            : hasAcceptedAdoption
              ? `Twój wniosek został wstępnie zaakceptowany. Wiadomość o umówieniu spotkania została wysłana na podany email. Ostateczna decyzja zapada po spotkaniu na żywo.${
                  acceptedShelterVisitDays !== null
                    ? ` ${formatShelterVisitCountdown(acceptedShelterVisitDays)}`
                    : ""
                }`
              : hasRejectedAdoption
                ? "Twój poprzedni wniosek o adopcję tego zwierzęcia został odrzucony. Nie możesz złożyć ponownego wniosku."
                : hasCancelledAdoption
                  ? "Twój wniosek o adopcję tego zwierzęcia został anulowany. Możesz złożyć nowy wniosek, jeśli zwierzę nadal szuka domu."
                  : hasPendingAdoption
                    ? "Masz już aktywny wniosek adopcyjny dla tego zwierzęcia. Poczekaj na odpowiedź schroniska."
                    : !isProfilePending && !hasCompleteProfile
                      ? "Aby złożyć wniosek o adopcję, uzupełnij najpierw wszystkie dane osobowe w formularzu."
                      : null;

  const [isCancellingAdoption, setIsCancellingAdoption] = useState(false);

  const onSubmitAdoption = async (formData: CreateAdoptionFormData) => {
    if (!animal?.id || !canOpenAdoptionForm) return;

    try {
      await axios.post(
        "/api/adoptions",
        {
          animalId: animal.id,
          message: formData.message?.trim() || undefined,
        },
        { withCredentials: true },
      );
      toast.success(
        "Wniosek o adopcję został wysłany. Potwierdzenie wyślemy na email.",
      );
      reset({ message: "" });
      setShowAdoptionForm(false);
      void queryClient.invalidateQueries({
        queryKey: ["my-adoptions", user?.id],
      });
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(
          err.response?.data?.msg ?? "Nie udało się wysłać wniosku o adopcję.",
        );
      } else {
        toast.error("Wystąpił nieoczekiwany błąd.");
      }
    }
  };

  const onCancelAdoption = async () => {
    if (!existingAdoptionForAnimal?.id || !hasPendingAdoption) return;

    setIsCancellingAdoption(true);
    try {
      await axios.patch(
        `/api/adoptions/${existingAdoptionForAnimal.id}/cancel`,
        {},
        { withCredentials: true },
      );
      toast.success("Wniosek o adopcję został anulowany.");
      void queryClient.invalidateQueries({
        queryKey: ["my-adoptions", user?.id],
      });
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(
          err.response?.data?.msg ?? "Nie udało się anulować wniosku.",
        );
      } else {
        toast.error("Wystąpił nieoczekiwany błąd.");
      }
    } finally {
      setIsCancellingAdoption(false);
    }
  };

  const isMissingAnimal =
    isError &&
    error instanceof AxiosError &&
    (error.response?.status === 400 || error.response?.status === 404);

  if (!hasValidId || isMissingAnimal) {
    return <Navigate to="/zwierzeta" replace />;
  }

  return (
    <main>
      {animalJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(animalJsonLd) }}
        />
      )}
      <Container className="space-y-12 md:space-y-16">
        <article
          id="animal"
          aria-labelledby="animal-heading"
          className="space-y-6 gap-x-8 lg:flex lg:space-y-8"
        >
          <div className="relative mx-auto grid aspect-square size-60 flex-1 place-items-center overflow-hidden rounded-full bg-gray-100 sm:size-80 md:size-100">
            {animal?.imageUrl[0] ? (
              <img
                src={animal.imageUrl[0]}
                alt={animal.name}
                width={400}
                height={400}
                className="absolute size-full object-cover object-center"
              />
            ) : (
              <ImageOff
                className="absolute size-10 object-cover text-gray-300 sm:size-20"
                aria-hidden="true"
              />
            )}
          </div>
          <div className="flex-2 space-y-4">
            <h1
              id="animal-heading"
              className="text-3xl font-bold text-green-900 md:text-5xl"
            >
              {animal?.name}
            </h1>
            <div className="flex flex-wrap gap-x-20">
              <ul
                aria-label="Podstawowe informacje"
                className="text-sm leading-6 font-medium md:text-base md:leading-7"
              >
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
                <li>Rasa: {animal?.breed || "—"}</li>
                <li>
                  Poziom energii:{" "}
                  {formatAnimalEnergyLevel[animal?.energyLevel as string] ??
                    animal?.energyLevel ??
                    "—"}
                </li>
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
              <ul
                aria-label="Cechy zwierzęcia"
                className="text-sm leading-6 font-medium md:text-base md:leading-7"
              >
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
              <div className="w-full max-w-xl space-y-3">
                {canOpenAdoptionForm ? (
                  showAdoptionForm ? (
                    <form
                      onSubmit={handleSubmit(onSubmitAdoption)}
                      className="space-y-3"
                      aria-label="Formularz wniosku o adopcję"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="adoptionMessage">
                          Wiadomość do schroniska (opcjonalnie)
                        </Label>
                        <Textarea
                          id="adoptionMessage"
                          maxLength={500}
                          placeholder="Napisz kilka słów o sobie i motywacji do adopcji..."
                          className={`h-28 resize-none ${errors.message ? "bg-red-600/20" : ""}`}
                          {...register("message")}
                        />
                        {errors.message && (
                          <p
                            role="alert"
                            className="text-xs font-medium text-red-600 md:text-sm"
                          >
                            {errors.message.message}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="submit"
                          variant="success"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Wysyłanie..." : "Wyślij wniosek"}
                        </Button>
                        <Button
                          type="button"
                          variant="canceled"
                          disabled={isSubmitting}
                          onClick={() => {
                            setShowAdoptionForm(false);
                            reset({ message: "" });
                          }}
                        >
                          Anuluj
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <Button
                      variant="success"
                      type="button"
                      onClick={() => setShowAdoptionForm(true)}
                    >
                      Zgłoś wniosek o adopcję
                    </Button>
                  )
                ) : hasPendingAdoption ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="success" disabled>
                        Zgłoś wniosek o adopcję
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="destructive"
                            disabled={isCancellingAdoption}
                          >
                            {isCancellingAdoption
                              ? "Anulowanie..."
                              : "Anuluj wniosek"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Czy na pewno chcesz anulować wniosek?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Twój oczekujący wniosek o adopcję zostanie
                              anulowany. W razie potrzeby będziesz mógł złożyć
                              go ponownie.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel variant="canceled">
                              Nie, wróć
                            </AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              disabled={isCancellingAdoption}
                              onClick={() => void onCancelAdoption()}
                            >
                              Tak, anuluj wniosek
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <p className="text-muted-foreground text-xs leading-5 md:text-sm md:leading-6">
                      Masz już aktywny wniosek adopcyjny dla tego zwierzęcia.
                      Poczekaj na odpowiedź schroniska lub anuluj wniosek.
                    </p>
                  </div>
                ) : (
                  <>
                    <Button variant="success" disabled>
                      Zgłoś wniosek o adopcję
                    </Button>
                    {adoptionBlockMessage && (
                      <p className="text-muted-foreground text-xs leading-5 md:text-sm md:leading-6">
                        {adoptionBlockMessage}{" "}
                        {canSubmitAdoption &&
                          !isProfilePending &&
                          !hasCompleteProfile &&
                          !hasPendingAdoption &&
                          !hasAcceptedAdoption &&
                          !hasRejectedAdoption &&
                          !hasCancelledAdoption &&
                          !hasCompletedAdoption &&
                          !isAlreadyAdopted && (
                            <Link
                              to="/konto/formularz"
                              className="font-semibold text-green-800 underline underline-offset-2 hover:text-green-900"
                            >
                              Przejdź do formularza
                            </Link>
                          )}
                      </p>
                    )}
                  </>
                )}
                {isFound &&
                  daysUntilAvailable !== null &&
                  !hasPendingAdoption &&
                  !hasAcceptedAdoption &&
                  !hasRejectedAdoption &&
                  !hasCancelledAdoption &&
                  !hasCompletedAdoption &&
                  !isAlreadyAdopted && (
                    <p className="text-muted-foreground text-xs leading-5 md:text-sm md:leading-6">
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
                Numer telefonu schroniska: +48 111 222 333
              </a>
            </div>
          </div>
        </article>
        <section
          id="similiar-animals"
          aria-labelledby="similar-animals-heading"
          className="space-y-6 lg:space-y-8"
        >
          <h2
            id="similar-animals-heading"
            className="text-2xl font-bold text-green-900 md:text-4xl"
          >
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
                  aria-label="Zobacz wszystkie zwierzęta"
                  className="space-y-2 transition-colors duration-200 hover:text-green-900"
                >
                  <div className="relative grid aspect-video place-items-center overflow-hidden rounded-xl bg-green-900">
                    <span className="text-xl font-semibold text-white lg:text-3xl">
                      Wszystkie
                    </span>
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

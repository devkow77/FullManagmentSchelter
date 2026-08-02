"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Container, Label, Textarea } from "@/components/ui";
import axios from "axios";
import { ImageOff, UserRound } from "lucide-react";
import { toast } from "sonner";
import { DashboardPage } from "@/components/shared";
import {
  styleAdoptionStatus,
  calculateAge,
  formatUserGender,
  formatAnimalGender,
  formatAdoptionStatus,
  formatAnimalType,
  formatAnimalHealthStatus,
} from "@/lib/utils";
import {
  getAcceptanceTemplate,
  getRejectionTemplate,
  getCancellationTemplate,
} from "@/lib/adoptionMessageTemplates";
import {
  editAdoptionSchema,
  type EditAdoptionFormData,
} from "@/schemas/adoption.schema";
import { useAuth } from "@/context/AuthContext";

type AdoptionUser = {
  id: number;
  fullName: string;
  gender: string;
  phoneNumber?: string | null;
  city?: string | null;
  postalCode?: string | null;
  street?: string | null;
  dateOfBirth?: string | null;
  imageUrl?: string | null;
  adminNote?: string | null;
};

type AdoptionAnimal = {
  id: number;
  name: string;
  type: string;
  gender: string;
  dateOfBirth: string;
  healthStatus: string;
  traits: string;
  imageUrl: string[];
};

type AdoptionDetails = {
  status: string;
  user: AdoptionUser;
  animal: AdoptionAnimal;
};

const formatAddress = (user: AdoptionUser) => {
  const parts = [
    user.city,
    user.postalCode,
    user.street ? `ul. ${user.street}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "Brak danych";
};

const EditAdoptionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: loggedUser } = useAuth();
  const isAdmin = loggedUser?.role === "ADMINISTRATOR";
  const [adoption, setAdoption] = useState<AdoptionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditAdoptionFormData>({
    resolver: zodResolver(editAdoptionSchema),
    defaultValues: {
      message: "",
      employeeNote: "",
    },
  });

  const employeeNote = watch("employeeNote");
  const hasEmployeeNote = Boolean(employeeNote?.trim());

  const applyTemplate = (template: string) => {
    if (employeeNote?.trim()) {
      const confirmed = window.confirm(
        "Pole odpowiedzi nie jest puste. Czy chcesz zastąpić obecną treść szablonem?",
      );
      if (!confirmed) return;
    }
    setValue("employeeNote", template, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  useEffect(() => {
    const fetchAdoption = async () => {
      try {
        const res = await axios.get(`/api/adoptions/${id}`);
        const data = res.data;

        setAdoption({
          status: data.status,
          user: data.user,
          animal: data.animal,
        });

        reset({
          message: data.message || "",
          employeeNote: data.employeeNote || "",
        });
      } catch (err) {
        console.error("Błąd podczas pobierania danych adopcji:", err);
        toast.error("Nie udało się pobrać danych adopcji.");
        navigate("/admin/adopcje");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchAdoption();
  }, [id, reset, navigate]);

  const onSubmit = async (data: EditAdoptionFormData, status: string) => {
    const confirmed = window.confirm(
      "Czy jesteś pewny, że chcesz zmienić status adopcji?",
    );
    if (!confirmed) return;

    try {
      await axios.patch(`/api/adoptions/${id}`, {
        status,
        ...data,
      });
      void queryClient.invalidateQueries({
        queryKey: ["adoptions", "pending-count"],
      });
      void queryClient.invalidateQueries({ queryKey: ["admin-adoptions"] });
      toast.success("Wniosek został zaktualizowany.");
      navigate("/admin/adopcje");
    } catch (err) {
      console.error(err);
      toast.error("Nie udało się zaktualizować wniosku.");
    }
  };

  if (isLoading) {
    return (
      <main>
        <Container className="mb-6 md:mb-10">
          <p className="text-sm font-medium">Ładowanie danych adopcji...</p>
        </Container>
      </main>
    );
  }

  if (!adoption) {
    return null;
  }

  const { user, animal, status } = adoption;

  return (
    <DashboardPage
      title="Informacje o adopcji"
      eyebrow={
        <span
          className={`inline-block h-fit rounded-2xl px-4 py-2 text-sm font-medium ${styleAdoptionStatus(status)}`}
        >
          {formatAdoptionStatus[status] ?? status}
        </span>
      }
      description={
        status === "OCZEKUJACA"
          ? "Wprowadź zmiany w adopcji zwierzęcia poniżej."
          : "Nie możesz edytować danych adopcji, ponieważ jest ona już zakończona."
      }
      showNavbar={false}
    >
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:gap-8">
          {/* OSOBA WNIOSKUJĄCA */}
          <section className="space-y-4 lg:space-y-6">
            {/* AVATAR */}
            <div className="space-y-4">
              <h2 className="font-semibold">Dane osoby wnioskującej</h2>
              <div className="relative grid aspect-square w-60 place-items-center rounded-full bg-black/10">
                {user.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={user.fullName}
                      className="absolute h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <UserRound className="size-15 text-black opacity-20 md:size-20" />
                  )}
                </div>
              </div>
              {/* DANE OSOBY WNIOSKUJĄCEJ */}
              <ul className="text-sm leading-6 font-medium md:text-base md:leading-7">
                <li>Imię i nazwisko: {user.fullName}</li>
                <li>
                  Wiek:{" "}
                  {user.dateOfBirth
                    ? calculateAge(user.dateOfBirth)
                    : "Brak danych"}
                </li>
                <li>Adres zamieszkania: {formatAddress(user)}</li>
                <li>Płeć: {formatUserGender(user.gender)}</li>
                <li>Numer telefonu: {user.phoneNumber || "Brak danych"}</li>
                <li>
                  Notatka administratora: {user.adminNote || "Brak notatki"}
                </li>
              </ul>
              {isAdmin && (
                <Button variant="success" asChild className="w-full sm:w-fit">
                  <Link to={`/admin/uzytkownicy/${user.id}/edycja`}>
                    Zobacz profil
                  </Link>
                </Button>
              )}
              {/* WIADOMOŚĆ WNIOSKUJĄCEGO */}
              <div className="flex-1 space-y-2">
                <Label htmlFor="message">Wiadomość wnioskującego</Label>
                <Textarea
                  id="message"
                  {...register("message")}
                  className="h-50 resize-none lg:h-75"
                  placeholder="Brak wiadomości od wnioskującego"
                  disabled
                />
                {errors.message && (
                  <p className="text-red-600">{errors.message.message}</p>
                )}
              </div>
              {/* DECYZJA O ADOPCJI */}
              <div className="space-y-2">
                <div>
                  <p className="text-sm leading-6 font-semibold md:text-base md:leading-7">
                    Ostateczna decyzja o adopcji
                  </p>
                  <p className="text-muted-foreground text-xs leading-5 md:text-sm md:leading-6">
                    Musisz najpierw dodać odpowiedź pracownika, aby móc podjąć
                    decyzję.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:gap-4">
                  <Button
                    type="button"
                    variant="success"
                    disabled={
                      isSubmitting ||
                      status !== "OCZEKUJACA" ||
                      !hasEmployeeNote
                    }
                    onClick={handleSubmit((data) =>
                      onSubmit(data, "ZAAKCEPTOWANA"),
                    )}
                  >
                    Akceptuj
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    disabled={
                      isSubmitting ||
                      status !== "OCZEKUJACA" ||
                      !hasEmployeeNote
                    }
                    onClick={handleSubmit((data) =>
                      onSubmit(data, "ODRZUCONA"),
                    )}
                  >
                    Odrzuć
                  </Button>

                  <Button
                    type="button"
                    variant="canceled"
                    disabled={
                      isSubmitting ||
                      status !== "OCZEKUJACA" ||
                      !hasEmployeeNote
                    }
                    onClick={handleSubmit((data) =>
                      onSubmit(data, "ANULOWANA"),
                    )}
                  >
                    Anuluj
                  </Button>
                </div>
              </div>
            </section>
            {/* ZWIERZE ADOPTOWANE */}
            <section className="space-y-4 lg:space-y-6">
              {/* AVATAR */}
              <div className="space-y-4">
                <h2 className="font-semibold">Dane zwierzęcia adoptowanego</h2>
                <div className="relative grid aspect-square w-60 place-items-center rounded-full bg-black/10">
                  {animal.imageUrl?.[0] ? (
                    <img
                      src={animal.imageUrl[0]}
                      alt={animal.name}
                      className="absolute h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <ImageOff className="absolute size-15 object-cover text-black opacity-20 md:size-20" />
                  )}
                </div>
              </div>
              {/* DANE ZWIERZĘCIA ADOPTOWANEGO */}
              <ul className="text-sm leading-6 font-medium md:text-base md:leading-7">
                <li>Imię: {animal.name}</li>
                <li>Wiek: {calculateAge(animal.dateOfBirth)}</li>
                <li>Typ: {formatAnimalType[animal.type] ?? animal.type}</li>
                <li>Płeć: {formatAnimalGender(animal.gender)}</li>
                <li>
                  Stan zdrowia:{" "}
                  {formatAnimalHealthStatus[animal.healthStatus] ??
                    animal.healthStatus}
                </li>
                <li>Cechy: {animal.traits}</li>
              </ul>
              <Button variant="success" asChild className="w-full sm:w-fit">
                <Link to={`/zwierzeta/${animal.id}`}>Zobacz profil</Link>
              </Button>
              {/* ODPOWIEDŹ PRACOWNIKA */}
              <div className="flex-1 space-y-2">
                <Label htmlFor="employeeNote">Odpowiedź pracownika</Label>
                <Textarea
                  id="employeeNote"
                  {...register("employeeNote")}
                  placeholder="Dodaj odpowiedź dla wnioskującego (np. powód odrzucenia wniosku)"
                  className="h-50 resize-none lg:h-75"
                  disabled={status !== "OCZEKUJACA"}
                />
                {errors.employeeNote && (
                  <p className="text-red-600">{errors.employeeNote.message}</p>
                )}
              </div>
              {/* WIADOMOSCI DO WNIOSKUJĄCEGO*/}
              <div className="space-y-2">
                <p className="text-sm leading-6 font-semibold md:text-base md:leading-7">
                  Szablony wiadomości
                </p>
                <div className="flex flex-wrap items-center gap-2 lg:gap-4">
                  <Button
                    type="button"
                    variant="success"
                    disabled={isSubmitting || status !== "OCZEKUJACA"}
                    onClick={() =>
                      applyTemplate(
                        getAcceptanceTemplate(user.fullName, animal.name),
                      )
                    }
                  >
                    Akceptacja
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isSubmitting || status !== "OCZEKUJACA"}
                    onClick={() =>
                      applyTemplate(
                        getRejectionTemplate(user.fullName, animal.name),
                      )
                    }
                  >
                    Odrzucenie
                  </Button>

                  <Button
                    type="button"
                    variant="canceled"
                    disabled={isSubmitting || status !== "OCZEKUJACA"}
                    onClick={() =>
                      applyTemplate(
                        getCancellationTemplate(user.fullName, animal.name),
                      )
                    }
                  >
                    Anulacja
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </form>
    </DashboardPage>
  );
};

export default EditAdoptionPage;

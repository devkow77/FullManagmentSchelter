"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, Container, Label } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { Ban, Check, X } from "lucide-react";
import { toast } from "sonner";
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
    <main>
      <Container className="mb-6 space-y-12 md:mb-10 md:space-y-16">
        <div className="space-y-2">
          <span
            className={`inline-block h-fit rounded-sm px-4 py-2 text-sm font-medium ${styleAdoptionStatus(status)}`}
          >
            {formatAdoptionStatus[status] ?? status}
          </span>

          <h1 className="text-3xl font-bold text-green-900 md:text-5xl">
            Informacje o adopcji
          </h1>
          <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
            {status === "OCZEKUJACA"
              ? "Wprowadź zmiany w adopcji zwierzęcia poniżej."
              : "Nie możesz edytować danych adopcji, ponieważ jest ona już zakończona."}
          </p>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          <div className="space-y-4 lg:space-y-8">
            <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:gap-8">
              <div className="space-y-4">
                <h2 className="font-semibold">Dane osoby wnioskującej</h2>
                <div className="relative aspect-square w-40 rounded-full bg-black/20">
                  {user.imageUrl && (
                    <img
                      src={user.imageUrl}
                      alt={user.fullName}
                      className="absolute h-full w-full rounded-full object-cover"
                    />
                  )}
                </div>
                <ul>
                  <li>
                    <span className="font-medium">Imię i nazwisko:</span>{" "}
                    {user.fullName}
                  </li>
                  <li>
                    <span className="font-medium">Wiek:</span>{" "}
                    {user.dateOfBirth
                      ? calculateAge(user.dateOfBirth)
                      : "Brak danych"}
                  </li>
                  <li>
                    <span className="font-medium">Adres zamieszkania:</span>{" "}
                    {formatAddress(user)}
                  </li>
                  <li>
                    <span className="font-medium">Płeć:</span>{" "}
                    {formatUserGender(user.gender)}
                  </li>
                  <li>
                    <span className="font-medium">Numer telefonu:</span>{" "}
                    {user.phoneNumber || "Brak danych"}
                  </li>
                  <li>
                    <span className="font-medium">Notatka administratora:</span>{" "}
                    {user.adminNote || "Brak notatki"}
                  </li>
                </ul>
                <Button variant="success" asChild>
                  <a href={`/admin/uzytkownicy/${user.id}/edycja`}>
                    Zobacz profil
                  </a>
                </Button>
              </div>

              <div className="flex items-end gap-x-2 lg:gap-x-4">
                <div className="space-y-4">
                  <h2 className="font-semibold">
                    Dane zwierzęcia adoptowanego
                  </h2>
                  <div className="relative aspect-square w-40 rounded-full bg-black/20">
                    {animal.imageUrl?.[0] && (
                      <img
                        src={animal.imageUrl[0]}
                        alt={animal.name}
                        className="absolute h-full w-full rounded-full object-cover"
                      />
                    )}
                  </div>
                  <ul>
                    <li>
                      <span className="font-medium">Imię:</span> {animal.name}
                    </li>
                    <li>
                      <span className="font-medium">Wiek:</span>{" "}
                      {calculateAge(animal.dateOfBirth)}
                    </li>
                    <li>
                      <span className="font-medium">Typ:</span>{" "}
                      {formatAnimalType[animal.type] ?? animal.type}
                    </li>
                    <li>
                      <span className="font-medium">Płeć:</span>{" "}
                      {formatAnimalGender(animal.gender)}
                    </li>
                    <li>
                      <span className="font-medium">Stan zdrowia:</span>{" "}
                      {formatAnimalHealthStatus[animal.healthStatus] ??
                        animal.healthStatus}
                    </li>
                    <li>
                      {" "}
                      <span className="font-medium">Cechy:</span>{" "}
                      {animal.traits}
                    </li>
                  </ul>
                  <Button variant="success" asChild>
                    <a href={`/admin/zwierzeta/${animal.id}/edycja`}>
                      Zobacz profil zwierzęcia
                    </a>
                  </Button>
                </div>
              </div>

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

              <div className="flex flex-wrap items-center gap-4">
                <Button
                  type="button"
                  variant="success"
                  disabled={isSubmitting || status !== "OCZEKUJACA"}
                  onClick={handleSubmit((data) =>
                    onSubmit(data, "ZAAKCEPTOWANA"),
                  )}
                >
                  Akceptuj wniosek <Check />
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  disabled={isSubmitting || status !== "OCZEKUJACA"}
                  onClick={handleSubmit((data) => onSubmit(data, "ODRZUCONA"))}
                >
                  Odrzuć wniosek <X />
                </Button>

                <Button
                  type="button"
                  variant="canceled"
                  disabled={isSubmitting || status !== "OCZEKUJACA"}
                  onClick={handleSubmit((data) => onSubmit(data, "ANULOWANA"))}
                >
                  Anuluj wniosek <Ban />
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-4">
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
                  Szablon akceptacji
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
                  Szablon odrzucenia
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
                  Szablon anulacji
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Container>
    </main>
  );
};

export default EditAdoptionPage;

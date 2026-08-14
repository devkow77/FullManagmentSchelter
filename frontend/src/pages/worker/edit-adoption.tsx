"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams, useNavigate } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Label,
  Skeleton,
  Textarea,
} from "@/components/ui";
import axios from "axios";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { AnimalAvatar, DashboardPage, UserAvatar } from "@/components/shared";
import {
  cn,
  styleAdoptionStatus,
  calculateAge,
  formatUserGender,
  formatAnimalGender,
  formatAdoptionStatus,
  formatAnimalType,
  formatAnimalHealthStatus,
  formatHousingType,
} from "@/lib/utils";
import {
  getAcceptanceTemplate,
  getRejectionTemplate,
  getCancellationTemplate,
  getCompletionTemplate,
  getPostMeetingCancellationTemplate,
} from "@/lib/adoptionMessageTemplates";
import {
  editAdoptionSchema,
  type EditAdoptionFormData,
} from "@/schemas/adoption.schema";
import type {
  AdoptionDetails,
  AdoptionUser,
  DecisionStatus,
  InitialDecisionStatus,
  PostMeetingDecisionStatus,
} from "@/types";

const INITIAL_DECISION_OPTIONS: {
  value: InitialDecisionStatus;
  label: string;
  variant: "success" | "destructive" | "canceled";
}[] = [
  { value: "ZAAKCEPTOWANA", label: "Akceptacja", variant: "success" },
  { value: "ODRZUCONA", label: "Odrzucenie", variant: "destructive" },
  { value: "ANULOWANA", label: "Anulacja", variant: "canceled" },
];

const POST_MEETING_DECISION_OPTIONS: {
  value: PostMeetingDecisionStatus;
  label: string;
  variant: "success" | "canceled";
}[] = [
  { value: "ZAKONCZONA", label: "Finalizuj adopcję", variant: "success" },
  { value: "ANULOWANA", label: "Anuluj po spotkaniu", variant: "canceled" },
];

const getTemplateForDecision = (
  decision: DecisionStatus,
  userName: string,
  animalName: string,
  stage: "initial" | "post-meeting",
) => {
  if (stage === "post-meeting") {
    switch (decision) {
      case "ZAKONCZONA":
        return getCompletionTemplate(userName, animalName);
      case "ANULOWANA":
        return getPostMeetingCancellationTemplate(userName, animalName);
      default:
        return "";
    }
  }

  switch (decision) {
    case "ZAAKCEPTOWANA":
      return getAcceptanceTemplate(userName, animalName);
    case "ODRZUCONA":
      return getRejectionTemplate(userName, animalName);
    case "ANULOWANA":
      return getCancellationTemplate(userName, animalName);
    default:
      return "";
  }
};

const getSubmitLabel = (decision: DecisionStatus | null) => {
  switch (decision) {
    case "ZAAKCEPTOWANA":
      return "Zatwierdź akceptację";
    case "ODRZUCONA":
      return "Zatwierdź odrzucenie";
    case "ANULOWANA":
      return "Zatwierdź anulację";
    case "ZAKONCZONA":
      return "Zatwierdź finalizację";
    default:
      return "Zatwierdź decyzję";
  }
};

const getSubmitVariant = (decision: DecisionStatus | null) => {
  switch (decision) {
    case "ZAAKCEPTOWANA":
    case "ZAKONCZONA":
      return "success" as const;
    case "ODRZUCONA":
      return "destructive" as const;
    case "ANULOWANA":
      return "canceled" as const;
    default:
      return "default" as const;
  }
};

const getConfirmDialogCopy = (
  decision: DecisionStatus,
  stage: "initial" | "post-meeting",
) => {
  if (stage === "post-meeting") {
    switch (decision) {
      case "ZAKONCZONA":
        return {
          title: "Czy na pewno chcesz sfinalizować adopcję?",
          description:
            "Po potwierdzeniu status zmieni się na Adoptowano, a zwierzę zostanie oznaczone jako adoptowane.",
          confirmLabel: "Tak, finalizuj",
        };
      case "ANULOWANA":
        return {
          title: "Czy na pewno chcesz anulować po spotkaniu?",
          description:
            "Po potwierdzeniu wniosek zostanie anulowany, a zwierzę wróci do statusu „szuka domu”.",
          confirmLabel: "Tak, anuluj",
        };
      default:
        return {
          title: "Czy na pewno chcesz zatwierdzić decyzję?",
          description: "Po potwierdzeniu status adopcji zostanie zmieniony.",
          confirmLabel: "Tak, zatwierdź",
        };
    }
  }

  switch (decision) {
    case "ZAAKCEPTOWANA":
      return {
        title: "Czy na pewno chcesz zaakceptować wniosek?",
        description:
          "To jeszcze nie finalna adopcja — wnioskodawca zostanie zaproszony na spotkanie. Ostateczna decyzja zapada po spotkaniu na żywo.",
        confirmLabel: "Tak, zaakceptuj",
      };
    case "ODRZUCONA":
      return {
        title: "Czy na pewno chcesz odrzucić wniosek?",
        description:
          "Po potwierdzeniu status adopcji zmieni się na odrzucony, a wnioskodawca otrzyma przygotowaną odpowiedź.",
        confirmLabel: "Tak, odrzuć",
      };
    case "ANULOWANA":
      return {
        title: "Czy na pewno chcesz anulować wniosek?",
        description:
          "Po potwierdzeniu status adopcji zmieni się na anulowany, a wnioskodawca otrzyma przygotowaną odpowiedź.",
        confirmLabel: "Tak, anuluj",
      };
    default:
      return {
        title: "Czy na pewno chcesz zatwierdzić decyzję?",
        description: "Po potwierdzeniu status adopcji zostanie zmieniony.",
        confirmLabel: "Tak, zatwierdź",
      };
  }
};

const formatAddress = (user: AdoptionUser) => {
  const parts = [
    user.city,
    user.postalCode,
    user.street ? `ul. ${user.street}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "Brak danych";
};

const FactRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="grid gap-1 border-b border-green-900/10 py-3 last:border-b-0 sm:grid-cols-[11rem_1fr] sm:gap-4">
    <dt className="text-sm font-semibold text-green-900 md:text-base">
      {label}
    </dt>
    <dd className="text-sm leading-6 font-medium md:text-base md:leading-7">
      {value}
    </dd>
  </div>
);

const FactRowSkeleton = () => (
  <div className="grid gap-1 border-b border-green-900/10 py-3 last:border-b-0 sm:grid-cols-[11rem_1fr] sm:gap-4">
    <Skeleton className="h-5 w-28" />
    <Skeleton className="h-5 w-full max-w-56" />
  </div>
);

const PartySummarySkeleton = ({ alignEnd = false }: { alignEnd?: boolean }) => (
  <div
    className={cn(
      "flex min-w-0 flex-1 items-center gap-3",
      alignEnd && "sm:justify-end",
    )}
  >
    <Skeleton className="size-14 shrink-0 rounded-full md:size-16" />
    <div className={cn("min-w-0 space-y-2", alignEnd && "sm:text-right")}>
      <Skeleton className={cn("h-3 w-24", alignEnd && "sm:ml-auto")} />
      <Skeleton className={cn("h-5 w-36", alignEnd && "sm:ml-auto")} />
      <Skeleton className={cn("h-4 w-28", alignEnd && "sm:ml-auto")} />
    </div>
  </div>
);

const EditAdoptionSkeleton = () => (
  <div className="space-y-10 md:space-y-14" aria-hidden="true">
    <section className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <PartySummarySkeleton />
      <Skeleton className="mx-auto hidden size-5 shrink-0 sm:block" />
      <PartySummarySkeleton alignEnd />
    </section>

    <section className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
      {Array.from({ length: 2 }).map((_, columnIndex) => (
        <div key={columnIndex}>
          <Skeleton className="mb-2 h-7 w-48 md:h-8" />
          {Array.from({ length: 6 }).map((_, rowIndex) => (
            <FactRowSkeleton key={rowIndex} />
          ))}
        </div>
      ))}
    </section>

    <section className="space-y-6 border-t border-green-900/10 pt-8 md:space-y-8 md:pt-10">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44 md:h-8" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="flex flex-wrap items-center gap-2 lg:gap-4">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="min-h-40 w-full lg:min-h-52" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-10 w-full sm:w-48" />
      </div>
    </section>
  </div>
);

const EditAdoptionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [adoption, setAdoption] = useState<AdoptionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDecision, setSelectedDecision] =
    useState<DecisionStatus | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<EditAdoptionFormData | null>(
    null,
  );
  const [isConfirming, setIsConfirming] = useState(false);

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
  const isPending = adoption?.status === "OCZEKUJACA";
  const isAccepted = adoption?.status === "ZAAKCEPTOWANA";
  const canDecide = isPending || isAccepted;
  const decisionStage = isAccepted ? "post-meeting" : "initial";
  const decisionOptions = isAccepted
    ? POST_MEETING_DECISION_OPTIONS
    : INITIAL_DECISION_OPTIONS;

  useEffect(() => {
    document.title = "Rozpatrzenie wniosku | Schronisko";
  }, []);

  useEffect(() => {
    const fetchAdoption = async () => {
      try {
        const res = await axios.get<AdoptionDetails>(`/api/adoptions/${id}`, {
          withCredentials: true,
        });

        setAdoption(res.data);

        reset({
          message: res.data.message || "",
          employeeNote: res.data.employeeNote || "",
        });
      } catch {
        toast.error("Nie udało się pobrać danych adopcji.");
        navigate("/admin/adopcje");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchAdoption();
  }, [id, reset, navigate]);

  const applyTemplate = (template: string) => {
    setValue("employeeNote", template, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleDecisionSelect = (decision: DecisionStatus) => {
    if (!adoption || !canDecide) return;

    const template = getTemplateForDecision(
      decision,
      adoption.user.fullName,
      adoption.animal.name,
      decisionStage,
    );

    const shouldReplace =
      !employeeNote?.trim() ||
      window.confirm(
        "Wstawić szablon odpowiedzi dla wybranej decyzji? Obecna treść zostanie zastąpiona.",
      );

    if (shouldReplace) {
      applyTemplate(template);
    }

    setSelectedDecision(decision);
  };

  const onSubmit = (data: EditAdoptionFormData) => {
    if (!selectedDecision) return;
    setPendingData(data);
    setIsConfirmOpen(true);
  };

  const handleConfirmDecision = async () => {
    if (!selectedDecision || !pendingData) return;

    setIsConfirming(true);

    try {
      await axios.patch(
        `/api/adoptions/${id}`,
        {
          status: selectedDecision,
          ...pendingData,
        },
        { withCredentials: true },
      );

      void queryClient.invalidateQueries({
        queryKey: ["adoptions", "pending-count"],
      });
      void queryClient.invalidateQueries({ queryKey: ["admin-adoptions"] });

      toast.success("Wniosek został zaktualizowany.");
      navigate("/admin/adopcje");
    } catch {
      toast.error("Nie udało się zaktualizować wniosku.");
    } finally {
      setIsConfirming(false);
      setIsConfirmOpen(false);
      setPendingData(null);
    }
  };

  if (isLoading) {
    return (
      <DashboardPage
        title="Rozpatrzenie wniosku"
        description="Ładowanie danych wniosku..."
        showNavbar={false}
      >
        <EditAdoptionSkeleton />
      </DashboardPage>
    );
  }

  if (!adoption) {
    return null;
  }

  const { user, animal, status } = adoption;
  const isBusy = isSubmitting || isConfirming;
  const isSubmitDisabled =
    isBusy || isLoading || !canDecide || !selectedDecision || !hasEmployeeNote;
  const confirmCopy = selectedDecision
    ? getConfirmDialogCopy(selectedDecision, decisionStage)
    : null;

  return (
    <>
      <DashboardPage
        title="Rozpatrzenie wniosku"
        eyebrow={
          <span
            className={`inline-block h-fit rounded-2xl px-4 py-2 text-sm font-medium ${styleAdoptionStatus(status)}`}
          >
            {formatAdoptionStatus[status] ?? status}
          </span>
        }
        description={
          isPending
            ? "Przejrzyj dane wnioskodawcy i zwierzęcia, przygotuj odpowiedź, a następnie podejmij decyzję. Akceptacja oznacza zaproszenie na spotkanie — nie finalną adopcję."
            : isAccepted
              ? "Wniosek jest wstępnie zaakceptowany. Po spotkaniu na żywo sfinalizuj adopcję albo anuluj proces."
              : "Nie możesz edytować danych adopcji, ponieważ jest ona już zakończona."
        }
        showNavbar={false}
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-10 md:space-y-14"
        >
          <section
            aria-label="Podsumowanie wniosku"
            className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <UserAvatar
                src={user.imageUrl}
                alt={user.fullName}
                className="size-14 md:size-16"
                iconClassName="size-7 md:size-8"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-wide text-green-900 uppercase md:text-sm">
                  Wnioskodawca
                </p>
                <p className="truncate text-base font-semibold md:text-lg">
                  {user.fullName}
                </p>
                <p className="text-muted-foreground text-sm">
                  {user.phoneNumber || "Brak telefonu"}
                </p>
              </div>
            </div>

            <ArrowRight
              className="mx-auto hidden size-5 shrink-0 text-green-900/40 sm:block"
              aria-hidden
            />

            <div className="flex min-w-0 flex-1 items-center gap-3 sm:justify-end">
              <AnimalAvatar
                type={animal.type}
                src={animal.imageUrl?.[0]}
                alt={animal.name}
                className="size-14 md:size-16"
                iconClassName="size-7 md:size-8"
              />
              <div className="min-w-0 sm:text-right">
                <p className="text-xs font-semibold tracking-wide text-green-900 uppercase md:text-sm">
                  Zwierzę
                </p>
                <p className="truncate text-base font-semibold md:text-lg">
                  {animal.name}
                </p>
                <p className="text-muted-foreground text-sm">
                  {formatAnimalType[animal.type] ?? animal.type}
                  {" · "}
                  {calculateAge(animal.dateOfBirth)}
                </p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <h2 className="mb-2 text-xl font-bold text-green-900 md:text-2xl">
                Dane wnioskodawcy
              </h2>
              <dl>
                <FactRow label="Imię i nazwisko" value={user.fullName} />
                <FactRow
                  label="Wiek"
                  value={
                    user.dateOfBirth
                      ? calculateAge(user.dateOfBirth)
                      : "Brak danych"
                  }
                />
                <FactRow label="Płeć" value={formatUserGender(user.gender)} />
                <FactRow
                  label="Telefon"
                  value={user.phoneNumber || "Brak danych"}
                />
                <FactRow label="Adres" value={formatAddress(user)} />
                <FactRow
                  label="Typ mieszkania"
                  value={
                    user.housingType
                      ? (formatHousingType[user.housingType] ??
                        user.housingType)
                      : "Brak danych"
                  }
                />
                <FactRow
                  label="Ogród / balkon"
                  value={user.hasGardenOrBalcony ? "Tak" : "Nie"}
                />
                <FactRow
                  label="Dzieci"
                  value={user.hasChildren ? "Tak" : "Nie"}
                />
                <FactRow
                  label="Inne zwierzęta"
                  value={user.hasOtherAnimals ? "Tak" : "Nie"}
                />
                <FactRow
                  label="Warunki"
                  value={user.livingConditions || "Brak opisu"}
                />
                <FactRow
                  label="Notatka admina"
                  value={user.adminNote || "Brak notatki"}
                />
              </dl>
            </div>

            <div>
              <h2 className="mb-2 text-xl font-bold text-green-900 md:text-2xl">
                Dane zwierzęcia
              </h2>
              <dl>
                <FactRow label="Imię" value={animal.name} />
                <FactRow
                  label="Wiek"
                  value={calculateAge(animal.dateOfBirth)}
                />
                <FactRow
                  label="Typ"
                  value={formatAnimalType[animal.type] ?? animal.type}
                />
                <FactRow
                  label="Płeć"
                  value={formatAnimalGender(animal.gender)}
                />
                <FactRow
                  label="Stan zdrowia"
                  value={
                    formatAnimalHealthStatus[animal.healthStatus] ??
                    animal.healthStatus
                  }
                />
                <FactRow label="Cechy" value={animal.traits || "Brak"} />
              </dl>
            </div>
          </section>

          <section className="space-y-6 border-t border-green-900/10 pt-8 md:space-y-8 md:pt-10">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-green-900 md:text-2xl">
                {isAccepted ? "Decyzja po spotkaniu" : "Decyzja o adopcji"}
              </h2>
              <p className="text-muted-foreground text-sm leading-6 md:text-base md:leading-7">
                {isPending
                  ? "Wybierz decyzję — automatycznie wstawimy szablon odpowiedzi. Akceptacja oznacza zaproszenie na spotkanie."
                  : isAccepted
                    ? "Po spotkaniu na żywo sfinalizuj adopcję albo anuluj proces — zwierzę wróci wtedy do dostępnych."
                    : "Wniosek został już rozpatrzony — pola są tylko do podglądu."}
              </p>
            </div>

            {canDecide && (
              <div className="space-y-3">
                <p className="text-sm font-semibold md:text-base">
                  Wybierz decyzję
                </p>
                <div
                  role="radiogroup"
                  aria-label={
                    isAccepted
                      ? "Decyzja po spotkaniu"
                      : "Decyzja o adopcji"
                  }
                  className="flex flex-wrap items-center gap-2 lg:gap-4"
                >
                  {decisionOptions.map((option) => {
                    const isSelected = selectedDecision === option.value;
                    return (
                      <Button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        variant={isSelected ? option.variant : "transparent"}
                        disabled={isBusy}
                        onClick={() => handleDecisionSelect(option.value)}
                        className={cn(
                          !isSelected &&
                            "border border-green-900/15 bg-white text-green-950 hover:border-green-900/30 hover:bg-green-50",
                        )}
                      >
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
              <div className="space-y-2">
                <Label htmlFor="message">Wiadomość wnioskującego</Label>
                <Textarea
                  id="message"
                  {...register("message")}
                  className="min-h-40 resize-none lg:min-h-52"
                  placeholder="Brak wiadomości od wnioskującego"
                  disabled
                />
                {errors.message && (
                  <p className="text-xs font-medium text-red-600 lg:text-sm">
                    {errors.message.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeNote" required>Odpowiedź pracownika</Label>
                <Textarea
                  id="employeeNote"
                  {...register("employeeNote")}
                  placeholder={
                    selectedDecision
                      ? "Edytuj szablon odpowiedzi przed zatwierdzeniem..."
                      : "Najpierw wybierz decyzję powyżej — wstawimy pasujący szablon."
                  }
                  className={`min-h-40 resize-none lg:min-h-52 ${errors.employeeNote ? "bg-red-600/20" : ""}`}
                  disabled={!canDecide}
                />
                {errors.employeeNote && (
                  <p className="text-xs font-medium text-red-600 lg:text-sm">
                    {errors.employeeNote.message}
                  </p>
                )}
              </div>
            </div>

            {canDecide && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground text-sm">
                  {!selectedDecision
                    ? "Wybierz decyzję, aby kontynuować."
                    : !hasEmployeeNote
                      ? "Uzupełnij odpowiedź dla wnioskującego."
                      : "Sprawdź treść odpowiedzi i zatwierdź."}
                </p>
                <Button
                  type="submit"
                  variant={getSubmitVariant(selectedDecision)}
                  disabled={isSubmitDisabled}
                  className="w-full sm:w-auto"
                >
                  {isBusy
                    ? "Zapisywanie..."
                    : getSubmitLabel(selectedDecision)}
                </Button>
              </div>
            )}
          </section>
        </form>
      </DashboardPage>

      <AlertDialog
        open={isConfirmOpen}
        onOpenChange={(open) => {
          if (isConfirming) return;
          setIsConfirmOpen(open);
          if (!open) setPendingData(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmCopy?.title ??
                "Czy na pewno chcesz zatwierdzić decyzję?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmCopy?.description ??
                "Po potwierdzeniu status adopcji zostanie zmieniony."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConfirming} variant="destructive">
              Anuluj
            </AlertDialogCancel>
            <AlertDialogAction
              variant={getSubmitVariant(selectedDecision)}
              disabled={isConfirming}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDecision();
              }}
            >
              {isConfirming
                ? "Zapisywanie..."
                : (confirmCopy?.confirmLabel ?? "Tak, zatwierdź")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditAdoptionPage;

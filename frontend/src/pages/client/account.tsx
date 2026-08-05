import { Button, Container, Input, Label, Skeleton } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { z } from "zod";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTotp } from "@/hooks/useTotp";
import { DisableTotpForm, VerifyTotpForm } from "@/components/shared";
import ClientDashboardNavbar from "@/components/layout/client/DashboardNavbar";
import {
  formatAdoptionStatus,
  styleAdoptionStatus,
  styleUserRole,
} from "@/lib/utils";
import type { Adoption } from "@/types/adoption";
import { CircleAlert, ImageOff, Info } from "lucide-react";

const updatePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, "Hasło musi mieć min. 8 znaków")
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
        "Hasło musi zawierać min. 1 wielką literę, 1 cyfrę i 1 znak specjalny.",
      ),
    newPassword: z
      .string()
      .min(8, "Hasło musi mieć min. 8 znaków")
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
        "Hasło musi zawierać min. 1 wielką literę, 1 cyfrę i 1 znak specjalny.",
      ),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Hasła muszą być takie same.",
    path: ["confirmNewPassword"],
  });

type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

const getMyAdoptions = async () => {
  const res = await axios.get<Adoption[]>("/api/adoptions", {
    withCredentials: true,
  });
  return res.data;
};

const AccountPage = () => {
  const { qrCode, manualKey } = useTotp();
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const {
    data: adoptions = [],
    isPending: isAdoptionsPending,
    isError: isAdoptionsError,
  } = useQuery({
    queryKey: ["my-adoptions", user?.id],
    queryFn: getMyAdoptions,
    enabled: Boolean(user?.id),
  });

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
  });

  const onSubmit = async (data: UpdatePasswordFormData) => {
    try {
      const res = await axios.patch("/api/users/password", data, {
        withCredentials: true,
      });
      toast.success(res.data.msg);
      await logout();
      navigate("/login");
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data.msg);
      } else {
        toast.error("Wystąpił nieoczekiwany błąd");
      }
    }
  };

  useEffect(() => {
    document.title = user?.fullName
      ? `${user.fullName} | Schronisko`
      : "Konto | Schronisko";
  }, [user?.fullName]);

  useEffect(() => {
    if (!loading && !user?.role) {
      toast.info("Musisz być zalogowany aby mieć dostęp do konta!");
      navigate("/");
    }
  }, [loading, user, navigate]);

  return (
    <main>
      <Container className="mb-6 space-y-12 md:mb-10 md:space-y-16">
        <section
          id="info"
          aria-labelledby="client-account-heading"
          className="space-y-6 gap-x-12 text-center md:flex md:text-left"
        >
          <div className="relative mx-auto h-50 w-50 overflow-hidden rounded-full md:mx-0">
            <img
              src="/client-logged-avatar.png"
              alt="profilowe klienta"
              width={200}
              height={200}
              className="absolute top-0 left-0 size-full object-cover"
            />
          </div>
          <div className="space-y-2">
            <h1
              id="client-account-heading"
              className="text-3xl font-bold text-green-900 md:text-5xl"
            >
              {user?.fullName}
            </h1>
            <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
              Poniżej znajdują się twoje podstawowe dane z konta.
            </p>
            <ul
              aria-label="Dane konta"
              className="space-y-2 text-sm leading-6 md:text-base md:leading-7"
            >
              <li>Imię i nazwisko: {user?.fullName}</li>
              <li>Email: {user?.email}</li>
              <li className="mt-4">
                <span
                  className={`${styleUserRole(user?.role as string)} rounded-2xl border-2 px-4 py-2 font-medium`}
                >
                  {user?.role}
                </span>
              </li>
            </ul>
          </div>
        </section>
        <ClientDashboardNavbar />
        <section
          id="adoptions"
          aria-labelledby="adoptions-heading"
          className="space-y-6 lg:space-y-8"
        >
          <div className="space-y-2">
            <h2
              id="adoptions-heading"
              className="text-2xl font-bold text-green-900 md:text-4xl"
            >
              Twoje aktualne adopcje
            </h2>
            <p className="text-sm leading-6 md:text-base md:leading-7">
              Poniżej znajduje się lista twoich dotychczasowych adopcji jak
              również obecne zgłoszenia w naszym schronisku.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {isAdoptionsPending && <LoadingAdoptions />}
            {isAdoptionsError && <ErrorAdoptions />}
            {!isAdoptionsPending &&
              !isAdoptionsError &&
              adoptions.length === 0 && <EmptyAdoptions />}
            {adoptions.map((adoption) => (
              <AdoptionCard key={adoption.id} adoption={adoption} />
            ))}
          </div>
        </section>
        <section
          id="editPassword"
          aria-labelledby="edit-password-heading"
          className="space-y-6 lg:space-y-8"
        >
          <div className="space-y-2">
            <h2
              id="edit-password-heading"
              className="text-2xl font-bold text-green-900 md:text-4xl"
            >
              Chcesz zmienić hasło?
            </h2>
            <p className="text-sm leading-6 md:text-base md:leading-7">
              Poniżej znajduje się formularz do zmiany dotychczasowego hasła.
            </p>
          </div>
          <form
            onSubmit={handleSubmit(onSubmit)}
            aria-label="Formularz zmiany hasła"
            noValidate
          >
            <Label htmlFor="client-currentPassword">Aktualne hasło</Label>
            <Input
              id="client-currentPassword"
              {...register("currentPassword")}
              className={`mt-2 mb-4 ${errors.currentPassword && "bg-red-600/20"}`}
              placeholder="Podaj swoje aktualne hasło..."
              autoFocus
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.currentPassword)}
              aria-describedby={
                errors.currentPassword
                  ? "client-currentPassword-error"
                  : undefined
              }
            />
            {errors.currentPassword && (
              <p
                id="client-currentPassword-error"
                role="alert"
                className="-mt-2 mb-4 text-xs font-medium text-red-600 lg:text-sm"
              >
                {errors.currentPassword.message}
              </p>
            )}
            <Label htmlFor="client-newPassword">Nowe hasło</Label>
            <Input
              id="client-newPassword"
              {...register("newPassword")}
              className={`mt-2 mb-4 ${errors.newPassword && "bg-red-600/20"}`}
              placeholder="Podaj nowe hasło..."
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.newPassword)}
              aria-describedby={
                errors.newPassword ? "client-newPassword-error" : undefined
              }
            />
            {errors.newPassword && (
              <p
                id="client-newPassword-error"
                role="alert"
                className="-mt-2 mb-4 text-xs font-medium text-red-600 lg:text-sm"
              >
                {errors.newPassword.message}
              </p>
            )}

            <Label htmlFor="client-confirmNewPassword">
              Powtórz nowe hasło
            </Label>
            <Input
              id="client-confirmNewPassword"
              {...register("confirmNewPassword")}
              className={`mt-2 mb-4 ${errors.confirmNewPassword && "bg-red-600/20"}`}
              placeholder="Powtórz nowe hasło..."
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmNewPassword)}
              aria-describedby={
                errors.confirmNewPassword
                  ? "client-confirmNewPassword-error"
                  : undefined
              }
            />
            {errors.confirmNewPassword && (
              <p
                id="client-confirmNewPassword-error"
                role="alert"
                className="-mt-2 mb-4 text-xs font-medium text-red-600 lg:text-sm"
              >
                {errors.confirmNewPassword.message}
              </p>
            )}

            <Button
              type="submit"
              className="cursor-pointer bg-green-600"
              disabled={!isDirty || isSubmitting}
            >
              {isSubmitting ? "Aktualizacja..." : "Ustaw nowe hasło"}
            </Button>
          </form>
        </section>
        <section
          id="2fa"
          aria-labelledby="2fa-heading"
          className="space-y-6 lg:space-y-8"
        >
          <div className="space-y-2">
            <h2
              id="2fa-heading"
              className="text-2xl font-bold text-green-900 md:text-4xl"
            >
              {user?.twoFactorEnabled
                ? "Zarządzaj weryfikacją dwuetapową 2FA"
                : "Włącz weryfikację dwuetapową 2FA"}
            </h2>
            <p className="text-sm leading-6 md:text-base md:leading-7">
              {user?.twoFactorEnabled
                ? "Kliknij przycisk poniżej aby wyłączyć weryfikację dwuetapową 2FA"
                : "Kliknij przycisk poniżej aby włączyć weryfikację dwuetapową 2FA"}
            </p>
          </div>
          {!user?.twoFactorEnabled && (
            <div className="space-y-2">
              <p className="text-sm leading-6 md:text-base md:leading-7">
                Zeskanuj poniższy kod QR w aplikacji Authenticator (np. Google
                Authenticator lub Authy):
              </p>
              {qrCode && (
                <img
                  src={qrCode}
                  alt="QR Code do TOTP"
                  width={200}
                  height={200}
                  className="rounded-2xl bg-black p-1"
                />
              )}
              <p className="text-sm leading-6 md:text-base md:leading-7">
                Lub wpisz ręcznie klucz:
              </p>
              <div className="w-fit rounded-2xl bg-black px-4 py-2 break-all text-white select-all">
                {manualKey}
              </div>
              <p className="text-sm leading-6 md:text-base md:leading-7">
                Po dodaniu konta w aplikacji Authenticator wprowadź wygenerowany
                kod, aby zakończyć konfigurację 2FA.
              </p>
              <p className="text-sm leading-6 font-semibold md:text-base md:leading-7">
                Weryfikacja 2FA
              </p>
              <VerifyTotpForm />
            </div>
          )}
          {user?.twoFactorEnabled && <DisableTotpForm />}
        </section>
      </Container>
    </main>
  );
};

const AdoptionCard = ({ adoption }: { adoption: Adoption }) => {
  const statusLabel = formatAdoptionStatus[adoption.status] ?? adoption.status;

  return (
    <Link
      to={`/zwierzeta/${adoption.animal.id}`}
      className="space-y-2 transition-colors duration-200 hover:text-green-800"
    >
      <div className="relative grid aspect-video place-items-center overflow-hidden rounded-xl bg-gray-100">
        <span
          className={`${styleAdoptionStatus(adoption.status)} absolute top-3 right-3 z-2 rounded-2xl px-4 py-2 text-xs font-semibold`}
        >
          {statusLabel.toUpperCase()}
        </span>
        {adoption.animal.imageUrl.length > 0 ? (
          <img
            src={adoption.animal.imageUrl[0]}
            alt={adoption.animal.name}
            width={640}
            height={360}
            className="absolute size-full object-cover"
          />
        ) : (
          <ImageOff
            className="absolute size-10 object-cover text-gray-300 md:size-20"
            aria-hidden="true"
          />
        )}
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold lg:text-lg">{adoption.animal.name}</h3>
        <p className="line-clamp-4 text-xs leading-5 lg:text-sm lg:leading-6">
          {adoption.animal.description ||
            `Wniosek złożony ${new Date(adoption.createdAt).toLocaleDateString("pl-PL")}.`}
        </p>
      </div>
    </Link>
  );
};

const LoadingAdoptions = () => {
  return Array.from({ length: 3 }).map((_, index) => (
    <div key={index} className="space-y-2" aria-hidden="true">
      <Skeleton className="aspect-video rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-40 rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  ));
};

const ErrorAdoptions = () => {
  return (
    <div
      role="alert"
      className="col-span-full flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center"
    >
      <CircleAlert className="size-12 text-red-600" aria-hidden="true" />
      <div className="space-y-2">
        <p className="text-lg font-semibold text-red-900 md:text-xl">
          Wystąpił błąd
        </p>
        <p className="max-w-md text-sm text-red-800 md:text-base">
          Nie udało się załadować Twoich adopcji. Odśwież stronę lub spróbuj
          później.
        </p>
      </div>
    </div>
  );
};

const EmptyAdoptions = () => {
  return (
    <div
      role="status"
      className="col-span-full flex flex-col items-center justify-center gap-4 rounded-2xl border border-blue-900 bg-blue-50 px-6 py-12 text-center"
    >
      <Info className="size-12 text-blue-600" aria-hidden="true" />
      <div className="space-y-2">
        <p className="text-lg font-semibold text-blue-900 md:text-xl">
          Brak adopcji
        </p>
        <p className="max-w-md text-sm text-blue-900 md:text-base">
          Nie masz jeszcze żadnych wniosków adopcyjnych. Przejrzyj nasze
          zwierzęta i złóż pierwszy wniosek.
        </p>
      </div>
    </div>
  );
};

export default AccountPage;

import { Container } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import AdminDashboardNavbar from "@/components/layout/admin/DashboardNavbar";
import WorkerDashboardNavbar from "@/components/layout/worker/DashboardNavbar";
import { z } from "zod";
import { Button, Input, Label } from "@/components/ui";
import axios, { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { styleUserRole } from "@/lib/utils";
import { useTotp } from "@/hooks/useTotp";
import { VerifyTotpForm, DisableTotpForm } from "@/components/shared";
import { useEffect } from "react";

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

const accountConfig = {
  ADMINISTRATOR: {
    panelTitle: "Panel administratora",
    pageTitle: "Panel administratora | Schronisko",
    avatarSrc: "/admin-logged-avatar.png",
    avatarAlt: "profilowe administratora",
  },
  PRACOWNIK: {
    panelTitle: "Panel pracownika",
    pageTitle: "Panel pracownika | Schronisko",
    avatarSrc: "/worker-logged-avatar.png",
    avatarAlt: "profilowe pracownika",
  },
} as const;

const AdminAccountPage = () => {
  const { qrCode, manualKey } = useTotp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const role = user?.role === "PRACOWNIK" ? "PRACOWNIK" : "ADMINISTRATOR";
  const config = accountConfig[role];
  const isWorker = role === "PRACOWNIK";

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
  });

  useEffect(() => {
    document.title = config.pageTitle;
  }, [config.pageTitle]);

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

  return (
    <main>
      <Container className="mb-6 space-y-12 md:mb-10 md:space-y-16">
        <section
          id="info"
          aria-labelledby="staff-account-heading"
          className="space-y-4 gap-x-12 text-center md:flex md:text-left"
        >
          <div className="relative mx-auto size-30 overflow-hidden rounded-full md:mx-0 md:size-50">
            <img
              src={config.avatarSrc}
              alt={config.avatarAlt}
              width={200}
              height={200}
              className="absolute top-0 left-0 size-full object-cover"
            />
          </div>
          <div className="space-y-1 md:space-y-2">
            <h1
              id="staff-account-heading"
              className="text-2xl font-bold text-green-900 md:text-5xl"
            >
              {config.panelTitle}
            </h1>
            <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
              Poniżej znajdują się twoje podstawowe dane z konta.
            </p>
            <ul
              aria-label="Dane konta"
              className="space-y-1 text-sm leading-6 md:space-y-2 md:text-base md:leading-7"
            >
              <li>
                <span className="font-medium">Imię i nazwisko:</span>{" "}
                {user?.fullName}
              </li>
              <li>
                <span className="font-medium">Email:</span> {user?.email}
              </li>
              <li className="mt-4">
                <span
                  className={`${styleUserRole(user?.role as string)} rounded-2xl border-2 p-2 px-4 font-medium`}
                >
                  {user?.role}
                </span>
              </li>
            </ul>
          </div>
        </section>
        {isWorker ? <WorkerDashboardNavbar /> : <AdminDashboardNavbar />}
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
            <Label htmlFor="staff-currentPassword" required>
              Aktualne hasło
            </Label>
            <Input
              id="staff-currentPassword"
              {...register("currentPassword")}
              className={`mt-2 mb-4 ${errors.currentPassword && "bg-red-600/20"}`}
              placeholder="Podaj swoje aktualne hasło..."
              autoFocus
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.currentPassword)}
              aria-describedby={
                errors.currentPassword
                  ? "staff-currentPassword-error"
                  : undefined
              }
            />
            {errors.currentPassword && (
              <p
                id="staff-currentPassword-error"
                role="alert"
                className="-mt-2 mb-4 text-xs font-medium text-red-600 lg:text-sm"
              >
                {errors.currentPassword.message}
              </p>
            )}
            <Label htmlFor="staff-newPassword" required>
              Nowe hasło
            </Label>
            <Input
              id="staff-newPassword"
              {...register("newPassword")}
              className={`mt-2 mb-4 ${errors.newPassword && "bg-red-600/20"}`}
              placeholder="Podaj nowe hasło..."
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.newPassword)}
              aria-describedby={
                errors.newPassword ? "staff-newPassword-error" : undefined
              }
            />
            {errors.newPassword && (
              <p
                id="staff-newPassword-error"
                role="alert"
                className="-mt-2 mb-4 text-xs font-medium text-red-600 lg:text-sm"
              >
                {errors.newPassword.message}
              </p>
            )}

            <Label htmlFor="staff-confirmNewPassword" required>
              Powtórz nowe hasło
            </Label>
            <Input
              id="staff-confirmNewPassword"
              {...register("confirmNewPassword")}
              className="mt-2 mb-4"
              placeholder="Powtórz nowe hasło..."
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmNewPassword)}
              aria-describedby={
                errors.confirmNewPassword
                  ? "staff-confirmNewPassword-error"
                  : undefined
              }
            />
            {errors.confirmNewPassword && (
              <p
                id="staff-confirmNewPassword-error"
                role="alert"
                className="-mt-2 mb-4 text-xs font-medium text-red-800 lg:text-sm"
              >
                {errors.confirmNewPassword.message}
              </p>
            )}

            <Button
              type="submit"
              variant="success"
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

export default AdminAccountPage;

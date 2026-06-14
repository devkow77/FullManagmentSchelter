import { Container } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import DashboardNavbar from "@/components/layout/admin/DashboardNavbar";
import { z } from "zod";
import { Button, Input, Label } from "@/components/ui";
import axios, { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { styleUserRole } from "@/lib/utils";
import { useTotp } from "@/hooks/useTotp";
import { VerifyTotpForm, DisableTotpForm } from "@/components/shared";

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

const AdminAccountPage = () => {
  const { qrCode, manualKey } = useTotp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  return (
    <main>
      <Container className="mb-6 space-y-12 md:mb-10 md:space-y-16">
        <section
          id="info"
          className="space-y-6 gap-x-12 text-center md:flex md:text-left"
        >
          <div className="relative mx-auto h-50 w-50 overflow-hidden rounded-full md:mx-0">
            <img
              src="/admin-logged-avatar.png"
              alt="profilowe administratora"
              className="absolute top-0 left-0 size-full object-cover"
              role="presentation"
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-green-900 md:text-5xl">
              Panel administratora
            </h1>
            <p className="text-sm leading-6 font-medium md:text-base md:leading-7">
              Poniżej znajdują się twoje podstawowe dane z konta.
            </p>
            <ul className="space-y-2 text-sm leading-6 md:text-base md:leading-7">
              <li>
                <span className="font-medium">Imię i nazwisko:</span>{" "}
                {user?.fullName}
              </li>
              <li>
                <span className="font-medium">Email:</span> {user?.email}
              </li>
              <li className="mt-4">
                <span
                  className={`${styleUserRole(user?.role as string)} rounded-sm p-2 px-4 font-medium`}
                >
                  {user?.role}
                </span>
              </li>
            </ul>
          </div>
        </section>
        <DashboardNavbar />
        <section id="editPassword" className="space-y-6 lg:space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-green-900 md:text-4xl">
              Chcesz zmienić hasło?
            </h2>
            <p className="text-sm leading-6 md:text-base md:leading-7">
              Poniżej znajduje się formularz do zmiany dotychczasowego hasła.
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Label>Aktualne hasło</Label>
            <Input
              {...register("currentPassword")}
              className="mt-2 mb-4"
              placeholder="Podaj swoje aktualne hasło..."
              autoFocus
              type="password"
            />
            {errors.currentPassword && (
              <p className="-mt-2 mb-4 text-xs font-medium text-red-600 lg:text-sm">
                {errors.currentPassword.message}
              </p>
            )}
            <Label>Nowe hasło</Label>
            <Input
              {...register("newPassword")}
              className="mt-2 mb-4"
              placeholder="Podaj nowe hasło..."
              type="password"
            />
            {errors.newPassword && (
              <p className="-mt-2 mb-4 text-xs font-medium text-red-600 lg:text-sm">
                {errors.newPassword.message}
              </p>
            )}

            <Label>Powtórz nowe hasło</Label>
            <Input
              {...register("confirmNewPassword")}
              className="mt-2 mb-4"
              placeholder="Powtórz nowe hasło..."
              type="password"
            />
            {errors.confirmNewPassword && (
              <p className="-mt-2 mb-4 text-xs font-medium text-red-600 lg:text-sm">
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
        <section id="2fa" className="space-y-6 lg:space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-green-900 md:text-4xl">
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
              {qrCode && <img src={qrCode} alt="QR Code do TOTP" />}
              <p className="text-sm leading-6 md:text-base md:leading-7">
                Lub wpisz ręcznie klucz:
              </p>
              <div className="w-fit bg-black px-4 py-2 wrap-break-word text-white select-all">
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

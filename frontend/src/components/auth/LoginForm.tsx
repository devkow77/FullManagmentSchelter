import { Button, Input, Label } from "@/components/ui";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const loginSchema = z.object({
  email: z
    .string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Niepoprawny adres email."),

  password: z.string().min(1, "Hasło jest wymagane."),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginResponse {
  requires2FA: boolean;
  tempToken: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    role: "UZYTKOWNIK" | "PRACOWNIK" | "ADMINISTRATOR";
    twoFactorEnabled: boolean;
  };
}

type LoginFormProps = {
  on2FARequired: (tempToken: string) => void;
};

const LoginForm = ({ on2FARequired }: LoginFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const navigate = useNavigate();
  const { setUser } = useAuth();

  const onSubmit = async (data: LoginFormData) => {
    try {
      const res = await axios.post<LoginResponse>("/api/auth/login", data, {
        withCredentials: true,
      });

      if (res.data.requires2FA) {
        on2FARequired(res.data.tempToken);
        return;
      }

      setUser(res.data.user);
      navigate("/");
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const payload = err.response?.data as
          | {
              msg?: string;
              requiresEmailVerification?: boolean;
              email?: string;
            }
          | undefined;

        if (
          err.response?.status === 403 &&
          payload?.requiresEmailVerification &&
          payload.email
        ) {
          toast.error(payload.msg ?? "Potwierdź adres email przed logowaniem.");
          navigate(
            `/weryfikacja-email?email=${encodeURIComponent(payload.email)}`,
          );
          return;
        }

        toast.error(payload?.msg ?? "Wystąpił błąd logowania");
      } else {
        toast.error("Wystąpił nieoczekiwany błąd");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Email */}
      <Label required>Email</Label>
      <Input
        {...register("email")}
        className={`mt-2 mb-4 ${errors.email ? "bg-red-600/20" : ""}`}
        placeholder="Podaj swój email..."
      />
      {errors.email && (
        <p className="-mt-2 mb-4 text-xs font-medium text-red-600 lg:text-sm">
          {errors.email.message}
        </p>
      )}

      {/* Password */}
      <Label required>Hasło</Label>
      <Input
        type="password"
        {...register("password")}
        className={`mt-2 mb-4 ${errors.password ? "bg-red-600/20" : ""}`}
        placeholder="Podaj swoje hasło..."
      />
      {errors.password && (
        <p className="-mt-2 mb-4 text-xs font-medium text-red-600 lg:text-sm">
          {errors.password.message}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="cursor-pointer bg-green-600"
        >
          {isSubmitting ? "Logowanie..." : "Zaloguj się"}
        </Button>

        <div className="space-y-1 text-sm lg:text-base">
          <p>
            Nie masz konta?{" "}
            <Link to="/rejestracja" className="font-semibold">
              Zarejestruj się
            </Link>
          </p>
          <p>
            Nie pamiętasz hasła?{" "}
            <Link to="/reset-hasla" className="font-semibold">
              Zresetuj hasło
            </Link>
          </p>
        </div>
      </div>
    </form>
  );
};

export default LoginForm;

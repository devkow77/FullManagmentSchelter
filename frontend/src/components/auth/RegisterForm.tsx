import { Button, Input, Label } from "@/components/ui";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(3, "Imię i nazwisko musi mieć minimum 3 znaki.")
      .max(50, "Imię i nazwisko nie może mieć więcej niż 50 znaków."),
    email: z
      .string()
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Niepoprawny adres email."),
    password: z
      .string()
      .min(8, "Hasło musi mieć min. 8 znaków")
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
        "Hasło musi zawierać min. 1 wielką literę, 1 cyfrę i 1 znak specjalny.",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być takie same.",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const navigate = useNavigate();

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const res = await axios.post<{
        msg: string;
        email: string;
        requiresEmailVerification?: boolean;
      }>("/api/auth/register", data);

      toast.success(res.data.msg);
      navigate(
        `/weryfikacja-email?email=${encodeURIComponent(res.data.email)}`,
      );
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data.msg ?? "Wystąpił błąd rejestracji");
      } else {
        toast.error("Wystąpił nieoczekiwany błąd");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Label required>Imię i nazwisko</Label>
      <Input
        {...register("fullName")}
        className={`mt-2 mb-4 ${errors.fullName ? "bg-red-600/20" : ""}`}
        placeholder="Podaj swoje imię i nazwisko..."
        autoFocus
      />
      {errors.fullName && (
        <p className="-mt-2 mb-4 text-xs font-medium text-red-600 lg:text-sm">
          {errors.fullName.message}
        </p>
      )}

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

      <Label required>Hasło</Label>
      <Input
        {...register("password")}
        type="password"
        className={`mt-2 mb-4 ${errors.password ? "bg-red-600/20" : ""}`}
        placeholder="Podaj swoje hasło..."
      />
      {errors.password && (
        <p className="-mt-2 mb-4 text-xs font-medium text-red-600 lg:text-sm">
          {errors.password.message}
        </p>
      )}

      <Label required>Powtórz hasło</Label>
      <Input
        {...register("confirmPassword")}
        type="password"
        className={`mt-2 mb-4 ${errors.confirmPassword ? "bg-red-600/20" : ""}`}
        placeholder="Powtórz swoje hasło..."
      />
      {errors.confirmPassword && (
        <p className="-mt-2 mb-4 text-xs font-medium text-red-600 lg:text-sm">
          {errors.confirmPassword.message}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="cursor-pointer bg-green-600"
        >
          {isSubmitting ? "Rejestracja..." : "Utwórz nowe konto"}
        </Button>
        <p className="text-sm lg:text-base">
          Masz już konto?{" "}
          <Link to="/login" className="font-semibold">
            Zaloguj się
          </Link>
        </p>
      </div>
    </form>
  );
};

export default RegisterForm;

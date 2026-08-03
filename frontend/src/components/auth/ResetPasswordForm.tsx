import { Button, Input, Label } from "@/components/ui";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

const resetPasswordSchema = z
  .object({
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

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

type Props = {
  token: string;
};

const ResetPasswordForm = ({ token }: Props) => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      const res = await axios.post<{ msg: string }>("/api/auth/reset-password", {
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      toast.success(res.data.msg);
      navigate("/login");
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data.msg ?? "Nie udało się zmienić hasła");
      } else {
        toast.error("Wystąpił nieoczekiwany błąd");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Label>Nowe hasło</Label>
      <Input
        type="password"
        {...register("password")}
        className={`mt-2 mb-4 ${errors.password ? "bg-red-600/20" : ""}`}
        placeholder="Podaj nowe hasło..."
        autoFocus
      />
      {errors.password && (
        <p className="-mt-2 mb-4 text-xs font-medium text-red-600 lg:text-sm">
          {errors.password.message}
        </p>
      )}

      <Label>Powtórz nowe hasło</Label>
      <Input
        type="password"
        {...register("confirmPassword")}
        className={`mt-2 mb-4 ${errors.confirmPassword ? "bg-red-600/20" : ""}`}
        placeholder="Powtórz nowe hasło..."
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
          {isSubmitting ? "Zapisywanie..." : "Zmień hasło"}
        </Button>
        <p className="text-sm lg:text-base">
          Wróć do{" "}
          <Link to="/login" className="font-semibold">
            logowania
          </Link>
        </p>
      </div>
    </form>
  );
};

export default ResetPasswordForm;

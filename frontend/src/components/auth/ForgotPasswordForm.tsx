import { Button, Input, Label } from "@/components/ui";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import { Link } from "react-router";
import { toast } from "sonner";
import { useState } from "react";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Niepoprawny adres email."),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordForm = () => {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      const res = await axios.post<{ msg: string }>(
        "/api/auth/forgot-password",
        data,
      );
      toast.success(res.data.msg);
      setSent(true);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data.msg ?? "Nie udało się wysłać linku");
      } else {
        toast.error("Wystąpił nieoczekiwany błąd");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Label required>Email</Label>
      <Input
        {...register("email")}
        className={`mt-2 mb-4 ${errors.email ? "bg-red-600/20" : ""}`}
        placeholder="Podaj email powiązany z kontem..."
        autoFocus
      />
      {errors.email && (
        <p className="-mt-2 mb-4 text-xs font-medium text-red-600 lg:text-sm">
          {errors.email.message}
        </p>
      )}

      {sent && (
        <p className="mb-4 text-sm font-medium text-green-900 lg:text-base">
          Sprawdź skrzynkę email — jeśli konto istnieje, znajdziesz tam link do
          resetu hasła.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="cursor-pointer bg-green-600"
        >
          {isSubmitting ? "Wysyłanie..." : "Wyślij link resetujący"}
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

export default ForgotPasswordForm;

import { Button, Input, Label } from "@/components/ui";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { useState } from "react";

const verifyEmailSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Kod musi składać się z 6 cyfr."),
});

type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;

type Props = {
  email: string;
};

const VerifyEmailForm = ({ email }: Props) => {
  const navigate = useNavigate();
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
  });

  const onSubmit = async (data: VerifyEmailFormData) => {
    try {
      const res = await axios.post<{ msg: string }>("/api/auth/verify-email", {
        email,
        code: data.code,
      });
      toast.success(res.data.msg);
      navigate("/login");
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(
          err.response?.data.msg ?? "Nie udało się zweryfikować kodu",
        );
      } else {
        toast.error("Wystąpił nieoczekiwany błąd");
      }
    }
  };

  const handleResend = async () => {
    try {
      setIsResending(true);
      const res = await axios.post<{ msg: string }>(
        "/api/auth/resend-verification",
        { email },
      );
      toast.success(res.data.msg);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data.msg ?? "Nie udało się wysłać kodu");
      } else {
        toast.error("Wystąpił nieoczekiwany błąd");
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Kod weryfikacyjny</Label>
        <Input
          type="text"
          inputMode="numeric"
          autoFocus
          maxLength={6}
          placeholder="Wpisz 6-cyfrowy kod z emaila..."
          className={`mt-2 ${errors.code ? "bg-red-600/20" : ""}`}
          {...register("code")}
        />
        {errors.code && (
          <p className="mt-2 text-xs font-medium text-red-600 lg:text-sm">
            {errors.code.message}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="cursor-pointer bg-green-600"
        >
          {isSubmitting ? "Sprawdzanie..." : "Potwierdź email"}
        </Button>
        <Button
          type="button"
          variant="transparent"
          disabled={isResending}
          onClick={() => void handleResend()}
          className="border-2 border-green-900 text-green-950"
        >
          {isResending ? "Wysyłanie..." : "Wyślij kod ponownie"}
        </Button>
      </div>

      <p className="text-sm lg:text-base">
        Masz już potwierdzone konto?{" "}
        <Link to="/login" className="font-semibold">
          Zaloguj się
        </Link>
      </p>
    </form>
  );
};

export default VerifyEmailForm;

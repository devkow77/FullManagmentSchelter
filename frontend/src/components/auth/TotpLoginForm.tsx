import { Button, Input, Label } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router";

const verifyTotpSchema = z.object({
  code: z.string().min(6, "Kod musi mieć 6 cyfr").max(6, "Kod musi mieć 6 cyfr"),
});

type VerifyTotpFormData = z.infer<typeof verifyTotpSchema>;

interface TotpLoginResponse {
  user: {
    id: number;
    fullName: string;
    email: string;
    role: "UZYTKOWNIK" | "PRACOWNIK" | "ADMINISTRATOR";
    twoFactorEnabled: boolean;
  };
}

type Props = {
  tempToken: string;
};

const TotpLoginForm = ({ tempToken }: Props) => {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<VerifyTotpFormData>({
    resolver: zodResolver(verifyTotpSchema),
  });

  const onSubmit = async (data: VerifyTotpFormData) => {
    try {
      const res = await axios.post<TotpLoginResponse>(
        "/api/auth/2fa/login",
        { code: data.code, tempToken },
        { withCredentials: true },
      );
      setUser(res.data.user);
      toast.success("Weryfikacja 2FA przebiegła pomyślnie");
      navigate("/");
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data.msg);
      } else {
        toast.error("Wystąpił nieoczekiwany błąd");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label required>Kod z aplikacji uwierzytelniającej</Label>
        <Input
          type="text"
          placeholder="Kod z aplikacji uwierzytelniającej"
          inputMode="numeric"
          autoFocus
          maxLength={6}
          className={`mt-2 ${errors.code ? "bg-red-600/20" : ""}`}
          {...register("code")}
        />
        {errors.code && (
          <p className="mt-2 text-xs font-medium text-red-600 lg:text-sm">
            {errors.code.message}
          </p>
        )}
      </div>

      <Button type="submit" variant="success" disabled={isSubmitting}>
        {isSubmitting ? "Sprawdzanie..." : "Potwierdź"}
      </Button>
    </form>
  );
};

export default TotpLoginForm;
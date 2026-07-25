import { Button, Input } from "@/components/ui";
import axios, { AxiosError } from "axios";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router";

const verifyTotpSchema = z.object({
  code: z
    .string()
    .min(6, "Kod TOTP musi posiadać 6 znaków")
    .max(6, "Kod TOTP musi posiadać 6 znaków"),
});

type VerifyTotpFormData = z.infer<typeof verifyTotpSchema>;

const VerifyTotpForm = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm<VerifyTotpFormData>({
    resolver: zodResolver(verifyTotpSchema),
  });

  const onSubmit = async (data: VerifyTotpFormData) => {
    try {
      const res = await axios.post("/api/auth/2fa/verify", data, {
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-64 flex-col gap-4"
    >
      <Input
        {...register("code")}
        type="text"
        placeholder="Wpisz kod TOTP"
        autoFocus
        className={errors.code && "bg-red-600/20"}
      />
      <Button variant={"success"} type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Weryfikowanie..." : "Weryfikuj"}
      </Button>
      {errors.code && (
        <p className="-mt-2 mb-4 text-xs font-medium text-red-600 lg:text-sm">
          {errors.code.message}
        </p>
      )}
    </form>
  );
};

export default VerifyTotpForm;

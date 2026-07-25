import { Button, Container, Input, Label } from "@/components/ui";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router";

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

const RegisterPage = () => {
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
      const res = await axios.post("/api/auth/register", data);
      toast.info(res.data.msg);
      navigate("/login");
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.info(err.response?.data.msg);
      }
      toast.info("Wystąpił nieoczekiwany błąd");
    }
  };

  return (
    <main>
      <Container className="flex min-h-screen items-center justify-center">
        <article className="space-y-6 lg:space-y-8">
          <div className="space-y-2 lg:space-y-4">
            <h1 className="text-3xl font-bold md:text-5xl">Rejestracja</h1>
            <p className="text-sm leading-5 md:text-base md:leading-6">
              Musisz posiadać konto aby móc adoptować swojego pierwszego
              przyjaciela.
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Label>Imię i nazwisko</Label>
            <Input
              {...register("fullName")}
              className="mt-2 mb-4"
              placeholder="Podaj swoje imię i nazwisko..."
              autoFocus
            />
            {errors.fullName && (
              <p className="-mt-2 mb-4 text-xs font-medium text-red-600 lg:text-sm">
                {errors.fullName.message}
              </p>
            )}

            <Label>Email</Label>
            <Input
              {...register("email")}
              className="mt-2 mb-4"
              placeholder="Podaj swój email..."
            />
            {errors.email && (
              <p className="-mt-2 mb-4 text-xs font-medium text-red-600 lg:text-sm">
                {errors.email.message}
              </p>
            )}

            <Label>Hasło</Label>
            <Input
              {...register("password")}
              type="password"
              className="mt-2 mb-4"
              placeholder="Podaj swoje hasło..."
            />
            {errors.password && (
              <p className="-mt-2 mb-4 text-xs font-medium text-red-600 lg:text-sm">
                {errors.password.message}
              </p>
            )}

            <Label>Powtórz hasło</Label>
            <Input
              {...register("confirmPassword")}
              type="password"
              className="mt-2 mb-4"
              placeholder="Powtórz swoje hasło..."
            />
            {errors.confirmPassword && (
              <p className="-mt-2 mb-4 text-xs font-medium text-red-600 lg:text-sm">
                {errors.confirmPassword.message}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Button type="submit" className="cursor-pointer bg-green-600">
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
        </article>
      </Container>
    </main>
  );
};

export default RegisterPage;

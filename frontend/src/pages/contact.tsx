import { Button, Container, Input, Label } from "@/components/ui";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { Link } from "react-router";

const contactSchema = z.object({
  fullName: z
    .string()
    .min(3, "Imię i nazwisko musi mieć minimum 3 znaki.")
    .max(50, "Imię i nazwisko nie może mieć więcej niż 50 znaków."),
  email: z
    .string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Niepoprawny adres email."),
  message: z
    .string()
    .min(10, "Wiadomość musi mieć minimum 10 znaków.")
    .max(200, "Wiadomość nie może mieć więcej niż 200 znaków."),
});

type ContactFormData = z.infer<typeof contactSchema>;

const ContactPage = () => {
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      email: user?.email || "",
      fullName: user?.fullName || "",
      message: "",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        email: user.email,
        fullName: user.fullName,
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ContactFormData) => {
    try {
      const res = await axios.post("/api/contact", data);
      toast.success(res.data.msg);
      reset();
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.info(err.response?.data.msg);
      }
      console.error(err);
    }
  };

  const canSendMessage = !user || user.role === "UZYTKOWNIK";

  return (
    <main>
      <Container>
        <article className="space-y-6 lg:space-y-8">
          <div className="space-y-2 lg:space-y-4">
            <h1 className="text-3xl font-bold text-green-900 md:text-5xl">
              Kontakt
            </h1>
            <p className="text-sm leading-5 md:text-base md:leading-6">
              Skontaktuj się z nami, jeśli masz pytania lub potrzebujesz pomocy.
            </p>
          </div>
          {canSendMessage ? (
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Email */}
              <Label>Email</Label>
              <Input
                {...register("email")}
                className={`${errors.email && "bg-red-600/20"} mt-2 mb-4`}
                placeholder="Podaj swój email..."
                type="email"
                disabled={!!user}
              />
              {errors.email && (
                <p className="-mt-2 mb-4 text-xs font-medium text-red-600 lg:text-sm">
                  {errors.email.message}
                </p>
              )}

              {/* Imię i nazwisko */}
              <Label>Imię i nazwisko</Label>
              <Input
                {...register("fullName")}
                className={`${errors.fullName && "bg-red-600/20"} mt-2 mb-4`}
                placeholder="Podaj swoje imię i nazwisko..."
                disabled={!!user}
              />
              {errors.fullName && (
                <p className="-mt-2 mb-4 text-xs font-medium text-red-600 lg:text-sm">
                  {errors.fullName.message}
                </p>
              )}

              {/* Wiadomość */}
              <Label>Wiadomość</Label>
              <Textarea
                {...register("message")}
                className={`${errors.message && "bg-red-600/20"} mt-2 mb-4 resize-none md:h-50`}
                placeholder="Podaj swoją wiadomość..."
              />
              {errors.message && (
                <p className="-mt-2 mb-4 text-xs font-medium text-red-600 lg:text-sm">
                  {errors.message.message}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer bg-green-600"
                >
                  {isSubmitting ? "Wysyłanie..." : "Wyślij wiadomość"}
                </Button>

                <p className="text-sm lg:text-base">
                  Sprawdź czy twoje pytanie znajduje się w{" "}
                  <Link to="/faq" className="font-semibold">
                    FAQ
                  </Link>
                </p>
              </div>
            </form>
          ) : (
            <p className="max-w-4xl text-sm leading-5 md:text-base md:leading-6">
              Jesteś zalogowany jako{" "}
              {user.role === "ADMINISTRATOR" ? "administrator" : "pracownik"}.
              Aby zarządzać wiadomościami, przejdź do panelu{" "}
              <Link to="/wiadomosci" className="font-semibold">
                wiadomości
              </Link>
              .
            </p>
          )}
        </article>
      </Container>
    </main>
  );
};

export default ContactPage;

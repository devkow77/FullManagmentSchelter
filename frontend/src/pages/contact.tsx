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

const PAGE_TITLE = "Kontakt | Schronisko";

const contactJsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Kontakt",
  description:
    "Skontaktuj się z nami, jeśli masz pytania lub potrzebujesz pomocy.",
  mainEntity: {
    "@type": "Organization",
    name: "Schronisko",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      availableLanguage: "Polish",
    },
  },
};

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
    document.title = PAGE_TITLE;
  }, []);

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />
      <Container>
        <article
          aria-labelledby="contact-heading"
          className="space-y-6 lg:space-y-8"
        >
          <div className="space-y-2 lg:space-y-4">
            <h1
              id="contact-heading"
              className="text-3xl font-bold text-green-900 md:text-5xl"
            >
              Kontakt
            </h1>
            <p className="text-sm leading-5 md:text-base md:leading-6">
              Skontaktuj się z nami, jeśli masz pytania lub potrzebujesz pomocy.
            </p>
          </div>
          {canSendMessage ? (
            <form
              onSubmit={handleSubmit(onSubmit)}
              aria-label="Formularz kontaktowy"
              noValidate
            >
              {/* Email */}
              <Label htmlFor="contact-email" required>
                Email
              </Label>
              <Input
                id="contact-email"
                {...register("email")}
                className={`${errors.email && "bg-red-600/20"} mt-2 mb-4`}
                placeholder="Podaj swój email..."
                type="email"
                autoComplete="email"
                disabled={!!user}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={
                  errors.email ? "contact-email-error" : undefined
                }
              />
              {errors.email && (
                <p
                  id="contact-email-error"
                  role="alert"
                  className="-mt-2 mb-4 text-xs font-medium text-red-600 lg:text-sm"
                >
                  {errors.email.message}
                </p>
              )}

              {/* Imię i nazwisko */}
              <Label htmlFor="contact-fullName" required>
                Imię i nazwisko
              </Label>
              <Input
                id="contact-fullName"
                {...register("fullName")}
                className={`${errors.fullName && "bg-red-600/20"} mt-2 mb-4`}
                placeholder="Podaj swoje imię i nazwisko..."
                autoComplete="name"
                disabled={!!user}
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={
                  errors.fullName ? "contact-fullName-error" : undefined
                }
              />
              {errors.fullName && (
                <p
                  id="contact-fullName-error"
                  role="alert"
                  className="-mt-2 mb-4 text-xs font-medium text-red-600 lg:text-sm"
                >
                  {errors.fullName.message}
                </p>
              )}

              {/* Wiadomość */}
              <Label htmlFor="contact-message" required>
                Wiadomość
              </Label>
              <Textarea
                id="contact-message"
                {...register("message")}
                className={`${errors.message && "bg-red-600/20"} mt-2 mb-4 h-50 resize-none`}
                placeholder="Podaj swoją wiadomość..."
                aria-invalid={Boolean(errors.message)}
                aria-describedby={
                  errors.message ? "contact-message-error" : undefined
                }
              />
              {errors.message && (
                <p
                  id="contact-message-error"
                  role="alert"
                  className="-mt-2 mb-4 text-xs font-medium text-red-600 lg:text-sm"
                >
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
              <Link
                to={import.meta.env.VITE_TEAM_CHAT_URL as string}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold"
              >
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

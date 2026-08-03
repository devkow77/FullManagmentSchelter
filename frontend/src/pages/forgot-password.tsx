import { useEffect } from "react";
import { Container } from "@/components/ui";
import { ForgotPasswordForm } from "@/components/auth";

const ForgotPasswordPage = () => {
  useEffect(() => {
    document.title = "Reset hasła | Schronisko";
  }, []);

  return (
    <main>
      <Container className="flex min-h-screen items-center justify-center">
        <article
          aria-labelledby="forgot-password-heading"
          className="max-w-xl space-y-6 lg:space-y-8"
        >
          <div className="space-y-2 lg:space-y-4">
            <h1
              id="forgot-password-heading"
              className="text-3xl font-bold md:text-5xl"
            >
              Reset hasła
            </h1>
            <p className="text-sm leading-5 md:text-base md:leading-6">
              Podaj adres email powiązany z kontem. Wyślemy na niego link do
              ustawienia nowego hasła.
            </p>
          </div>

          <ForgotPasswordForm />
        </article>
      </Container>
    </main>
  );
};

export default ForgotPasswordPage;

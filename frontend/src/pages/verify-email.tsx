import { useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { Container } from "@/components/ui";
import { VerifyEmailForm } from "@/components/auth";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const email = (searchParams.get("email") ?? "").trim();

  useEffect(() => {
    document.title = "Weryfikacja email | Schronisko";
  }, []);

  return (
    <main>
      <Container className="flex min-h-screen items-center justify-center">
        <article
          aria-labelledby="verify-email-heading"
          className="max-w-xl space-y-6 lg:space-y-8"
        >
          <div className="space-y-2 lg:space-y-4">
            <h1
              id="verify-email-heading"
              className="text-3xl font-bold md:text-5xl"
            >
              Sprawdź swoją skrzynkę
            </h1>
            {email ? (
              <p className="text-sm leading-5 md:text-base md:leading-6">
                Na adres{" "}
                <span className="font-semibold text-green-900">{email}</span>{" "}
                wysłaliśmy wiadomość z linkiem weryfikacyjnym. Otwórz email i
                wpisz poniżej 6-cyfrowy kod, aby aktywować konto.
              </p>
            ) : (
              <p className="text-sm leading-5 md:text-base md:leading-6">
                Brak adresu email do weryfikacji. Wróć do rejestracji i utwórz
                konto ponownie.
              </p>
            )}
          </div>

          {email ? (
            <VerifyEmailForm email={email} />
          ) : (
            <p className="text-sm lg:text-base">
              <Link to="/rejestracja" className="font-semibold">
                Przejdź do rejestracji
              </Link>
            </p>
          )}
        </article>
      </Container>
    </main>
  );
};

export default VerifyEmailPage;

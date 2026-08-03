import { useEffect } from "react";
import { Link, useParams } from "react-router";
import { Container } from "@/components/ui";
import { ResetPasswordForm } from "@/components/auth";

const ResetPasswordPage = () => {
  const { token = "" } = useParams<{ token: string }>();

  useEffect(() => {
    document.title = "Nowe hasło | Schronisko";
  }, []);

  return (
    <main>
      <Container className="flex min-h-screen items-center justify-center">
        <article
          aria-labelledby="reset-password-heading"
          className="max-w-xl space-y-6 lg:space-y-8"
        >
          <div className="space-y-2 lg:space-y-4">
            <h1
              id="reset-password-heading"
              className="text-3xl font-bold md:text-5xl"
            >
              Ustaw nowe hasło
            </h1>
            <p className="text-sm leading-5 md:text-base md:leading-6">
              Wpisz dwukrotnie nowe hasło do konta.
            </p>
          </div>

          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <p className="text-sm lg:text-base">
              Nieprawidłowy link resetu.{" "}
              <Link to="/reset-hasla" className="font-semibold">
                Poproś o nowy
              </Link>
            </p>
          )}
        </article>
      </Container>
    </main>
  );
};

export default ResetPasswordPage;

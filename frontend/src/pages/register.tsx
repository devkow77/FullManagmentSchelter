import { useEffect } from "react";
import { Container } from "@/components/ui";
import { RegisterForm } from "@/components/auth";

const RegisterPage = () => {
  useEffect(() => {
    document.title = "Rejestracja | Schronisko";
  }, []);

  return (
    <main>
      <Container className="flex min-h-screen items-center justify-center">
        <article
          aria-labelledby="register-heading"
          className="space-y-6 lg:space-y-8"
        >
          <div className="space-y-2 lg:space-y-4">
            <h1
              id="register-heading"
              className="text-3xl font-bold md:text-5xl"
            >
              Rejestracja
            </h1>
            <p className="text-sm leading-5 md:text-base md:leading-6">
              Musisz posiadać konto aby móc adoptować swojego pierwszego
              przyjaciela.
            </p>
          </div>

          <RegisterForm />
        </article>
      </Container>
    </main>
  );
};

export default RegisterPage;

import { Button } from "@/components/ui";
import { Link } from "react-router";

const NotFoundPage = () => {
  return (
    <main>
      <section className="h-screen w-screen space-y-6 lg:space-y-8">
        <div className="flex h-full flex-col items-center justify-center space-y-4">
          <h1 className="text-6xl font-bold text-green-900 md:text-8xl">404</h1>
          <p className="max-w-2xl text-center text-sm leading-6 font-medium md:text-base md:leading-7">
            Przepraszamy, ta podstrona nie istnieje. Kliknij poniżej, aby
            przejść do strony głównej, a następnie skorzystaj z menu
            nawigacyjnego.
          </p>
          <Button variant={"success"} asChild>
            <Link to="/">Przejdź do strony głównej</Link>
          </Button>
        </div>
      </section>
    </main>
  );
};

export default NotFoundPage;

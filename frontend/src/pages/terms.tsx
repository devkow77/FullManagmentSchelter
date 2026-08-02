import { useEffect } from "react";
import { Container } from "@/components/ui";
import { TERMS_CONTENT } from "@/assets/docs/terms";

const TermsPage = () => {
  useEffect(() => {
    document.title = "Regulamin serwisu | Schronisko";
  }, []);

  return (
    <main>
      <Container className="space-y-12 md:space-y-16">
        <section
          aria-labelledby="terms-heading"
          className="space-y-6 lg:space-y-8"
        >
          <div className="space-y-2">
            <h1
              id="terms-heading"
              className="text-3xl font-bold text-green-900 md:text-5xl"
            >
              Regulamin serwisu
            </h1>
            <p className="text-sm leading-6 md:text-base md:leading-7">
              Poniżej znajduje się regulamin schroniska.
            </p>
          </div>
          <div className="space-y-10">
            {TERMS_CONTENT.sections.map((section) => (
              <section
                key={section.id}
                aria-labelledby={`terms-section-${section.id}`}
              >
                <h2
                  id={`terms-section-${section.id}`}
                  className="mb-4 flex items-center text-xl font-bold text-gray-800"
                >
                  <span className="mr-3 rounded-lg bg-green-100 px-3 py-1 text-sm text-green-700">
                    § {section.id}
                  </span>
                  {section.title}
                </h2>
                <ul className="list-disc space-y-2 pl-6">
                  {section.content.map((point, index) => (
                    <li
                      key={index}
                      className="text-sm leading-relaxed text-gray-600 md:text-base"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
};

export default TermsPage;

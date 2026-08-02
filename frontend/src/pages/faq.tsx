import { useEffect } from "react";
import { FullFaqList, fullFaqData } from "@/components/shared";
import { Container } from "@/components/ui";

const PAGE_TITLE = "Najczęstsze pytania | Schronisko";

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: fullFaqData.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

const FaqPage = () => {
  useEffect(() => {
    document.title = PAGE_TITLE;
  }, []);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Container>
        <section
          aria-labelledby="faq-heading"
          className="space-y-6 lg:space-y-8"
        >
          <div className="space-y-2">
            <h1
              id="faq-heading"
              className="text-3xl font-bold text-green-900 md:text-5xl"
            >
              Najczęstsze pytania
            </h1>
            <p className="text-sm leading-6 md:text-base md:leading-7">
              Masz pytania dotyczące adopcji, wolontariatu lub innych aspektów.
              <br /> Sprawdź nasze FAQ – być może znajdziesz tam odpowiedź,
              której szukasz!
            </p>
          </div>
          <FullFaqList />
        </section>
      </Container>
    </main>
  );
};

export default FaqPage;

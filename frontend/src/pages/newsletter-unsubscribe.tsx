import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Container } from "@/components/ui";
import axios from "axios";

const NewsletterUnsubscribePage = () => {
  const { token } = useParams();
  const [message, setMessage] = useState("Trwa wypisywanie z newslettera...");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    document.title = "Newsletter | Schronisko";
  }, []);

  useEffect(() => {
    if (!token) {
      setMessage("Nieprawidłowy link wypisania.");
      return;
    }

    axios
      .get(`/api/newsletter/unsubscribe/${token}`)
      .then((res) => {
        setMessage(res.data.msg);
        setIsSuccess(true);
      })
      .catch((err) => {
        setMessage(
          err.response?.data?.msg ?? "Wystąpił błąd podczas wypisywania.",
        );
      });
  }, [token]);

  return (
    <main>
      <Container>
        <article
          aria-labelledby="newsletter-heading"
          className="mx-auto max-w-xl space-y-4 py-16 text-center"
        >
          <h1
            id="newsletter-heading"
            className="text-3xl font-bold text-green-900"
          >
            Newsletter
          </h1>
          <p
            role="status"
            className={isSuccess ? "text-green-700" : "text-neutral-700"}
          >
            {message}
          </p>
          <Link to="/" className="inline-block text-green-800 underline">
            Wróć na stronę główną
          </Link>
        </article>
      </Container>
    </main>
  );
};

export default NewsletterUnsubscribePage;

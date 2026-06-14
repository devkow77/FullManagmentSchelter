import { Container } from "@/components/ui";
import { styleAnimalStatus } from "@/lib/utils";

const FoundAnimalsPage = () => {
  return (
    <main>
      <Container className="space-y-12 md:space-y-16">
        <section id="categories" className="space-y-6 lg:space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-green-900 md:text-5xl">
              Znalezione zwierzęta
            </h1>
            <p className="text-sm leading-6 md:text-base md:leading-7">
              Zgubiłeś swojego pupila? Sprawdź, czy ktoś go nie znalazł i nie
              oddał do naszego schroniska!
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <a href={"/"} key={index} className="space-y-2">
                <div className="relative grid aspect-video place-items-center overflow-hidden rounded-xl bg-black/10">
                  <span
                    className={`${styleAnimalStatus("ZNALEZIONY")} absolute top-3 right-3 rounded-2xl px-4 py-2 text-xs font-semibold`}
                  >
                    ZNALEZIONY
                  </span>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold lg:text-lg">
                    Znaleziono: 02.03.2026 r. w miejscowości Rzeszów, ul.
                    Krakowska 4
                  </h3>
                  <p className="line-clamp-4 text-xs leading-5 lg:text-sm lg:leading-6">
                    Lorem ipsum dolor sit, amet consectetur adipisicing elit.
                    Ipsam, aliquam. Numquam, ex officiis amet facere commodi
                    voluptatum debitis nam deleniti!
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
};

export default FoundAnimalsPage;

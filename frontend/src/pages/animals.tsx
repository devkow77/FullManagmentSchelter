import { Container } from "@/components/ui";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart } from "lucide-react";
import {
  animalTypeOptions,
  animalGenderOptions,
  animalSizeOptions,
  animalTraitOptions,
} from "@/constants/animal.constants";
import { MultiValueSelector, AgeSlider } from "@/components/shared";
interface Animal {
  slug: string;
  name: string;
  type: string;
  gender: string;
  size: string;
  traits: string[];
  age: number;
  img: string;
  description: string;
}

const AnimalsPage = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [filteredAnimals, setFilteredAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [selectedAnimals, setSelectedAnimals] = useState<string[]>([]);
  const [selectedGender, setSelectedGender] = useState<string[]>([]);
  const [selectedSize, setSelectedSize] = useState<string[]>([]);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 25]);

  useEffect(() => {
    const handleGetAnimals = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/api/animals");
        setAnimals(res.data);
        setFilteredAnimals(res.data);
      } catch (err) {
        console.error("Błąd podczas pobierania zwierząt:", err);
      } finally {
        setLoading(false);
      }
    };

    handleGetAnimals();
  }, []);

  const applyFilters = () => {
    const filtered = animals.filter((animal) => {
      const matchesType =
        selectedAnimals.length === 0 || selectedAnimals.includes(animal.type);

      const matchesGender =
        selectedGender.length === 0 || selectedGender.includes(animal.gender);

      const matchesSize =
        selectedSize.length === 0 || selectedSize.includes(animal.size);

      const matchesTraits =
        selectedTraits.length === 0 ||
        selectedTraits.every((trait) => animal.traits.includes(trait));

      const matchesAge = animal.age >= ageRange[0] && animal.age <= ageRange[1];

      return (
        matchesType &&
        matchesGender &&
        matchesSize &&
        matchesTraits &&
        matchesAge
      );
    });

    setFilteredAnimals(filtered);
  };

  return (
    <main>
      <Container className="space-y-12 md:space-y-16">
        <section id="categories" className="space-y-6 lg:space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-green-900 md:text-5xl">
              Wszystkie zwierzęta
            </h1>
            <p className="text-sm leading-6 md:text-base md:leading-7">
              Aktualnie posiadamy {animals.length} zwierząt, które czekają na
              nowy dom!
            </p>
          </div>
          <div className="top-0 z-2 -mt-4 flex flex-wrap items-center gap-4 bg-white py-4 sm:sticky lg:-mt-8">
            <MultiValueSelector
              items={animalTypeOptions}
              placeholder="Wybierz zwierzę"
              value={selectedAnimals}
              onValueChange={setSelectedAnimals}
            />
            <MultiValueSelector
              items={animalGenderOptions}
              placeholder="Wybierz płeć"
              value={selectedGender}
              onValueChange={setSelectedGender}
            />
            <MultiValueSelector
              items={animalSizeOptions}
              placeholder="Wybierz rozmiar"
              value={selectedSize}
              onValueChange={setSelectedSize}
            />
            <MultiValueSelector
              items={animalTraitOptions}
              placeholder="Wybierz cechy"
              value={selectedTraits}
              onValueChange={setSelectedTraits}
            />
            <AgeSlider value={ageRange} onChange={setAgeRange} />
            <Button onClick={applyFilters} variant={"success"}>
              Zastosuj
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {loading ? (
              Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="aspect-video rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40 rounded-xl" />
                    <Skeleton className="h-20 w-100 rounded-xl" />
                  </div>
                </div>
              ))
            ) : filteredAnimals.length === 0 ? (
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-center font-medium">
                  Nie znaleziono zwierząt spełniających wybrane kryteria.
                </p>
              </div>
            ) : (
              filteredAnimals.map((animal, index) => (
                <a
                  href={`/zwierzeta/${animal.type}/${animal.slug}`}
                  key={index}
                  className="space-y-2"
                >
                  <div className="relative grid aspect-video place-items-center overflow-hidden rounded-xl bg-black/10">
                    <span className="absolute top-3 right-3 rounded-full bg-white p-1 sm:p-2">
                      <Heart className="scale-80 text-red-600 sm:scale-100" />
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold lg:text-lg">
                      {animal.name} {animal.age} lat
                    </h3>
                    <p className="line-clamp-4 text-xs leading-5 lg:text-sm lg:leading-6">
                      {animal.description}
                    </p>
                  </div>
                </a>
              ))
            )}
          </div>
        </section>
      </Container>
    </main>
  );
};

export default AnimalsPage;

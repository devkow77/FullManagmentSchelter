import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui";

export const shortFaqData = [
  {
    question: "Jak wygląda proces adopcji?",
    answer:
      "Proces adopcji obejmuje wypełnienie formularza, rozmowę z pracownikiem schroniska oraz podpisanie umowy adopcyjnej. Chcemy mieć pewność, że zwierzę trafi do dobrego domu.",
  },
  {
    question: "Czy zwierzęta są zaszczepione i zdrowe?",
    answer:
      "Tak, wszystkie zwierzęta w naszym schronisku są pod opieką weterynarza, zaszczepione, odrobaczone i w miarę możliwości wysterylizowane lub wykastrowane.",
  },
  {
    question: "Czy mogę adoptować zwierzę mieszkając w bloku?",
    answer:
      "Oczywiście! Wiele naszych zwierząt świetnie odnajduje się w mieszkaniach. Pomożemy dobrać pupila odpowiedniego do Twojego stylu życia.",
  },
  {
    question: "Czy adopcja jest płatna?",
    answer:
      "Adopcja jest bezpłatna lub wiąże się z symboliczną opłatą, która pomaga pokryć koszty opieki weterynaryjnej.",
  },
  {
    question: "Czy mogę najpierw poznać zwierzę?",
    answer:
      "Tak, zachęcamy do odwiedzin w schronisku i poznania zwierzęcia przed podjęciem decyzji o adopcji.",
  },
  {
    question: "Czy mogę oddać zwierzę, jeśli sobie nie poradzę?",
    answer:
      "W wyjątkowych sytuacjach prosimy o kontakt ze schroniskiem. Zawsze staramy się znaleźć najlepsze rozwiązanie zarówno dla zwierzęcia, jak i opiekuna.",
  },
  {
    question: "Czy mogę adoptować zwierzę, jeśli mam już inne?",
    answer:
      "Tak, ale zalecamy wcześniejsze zapoznanie zwierząt. Nasi pracownicy pomogą ocenić, czy dany pupil będzie odpowiedni do Twojego domu.",
  },
];

const ShortFaqList = () => {
  return (
    <Accordion type="single" collapsible className="w-full flex-1">
      {shortFaqData.map((item, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent>{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default ShortFaqList;

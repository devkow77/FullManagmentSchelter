import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui";

export const fullFaqData = [
  {
    question: "Jak wygląda proces adopcji?",
    answer:
      "Proces adopcji obejmuje wypełnienie ankiety przedadopcyjnej, rozmowę z pracownikiem lub wolontariuszem schroniska, wizytę zapoznawczą ze zwierzęciem oraz podpisanie umowy adopcyjnej.",
  },
  {
    question: "Jakie dokumenty są potrzebne do adopcji?",
    answer:
      "Do podpisania umowy adopcyjnej niezbędny jest dowód osobisty (osoba adoptująca musi być pełnoletnia) oraz, w przypadku adopcji psa, własna obroża i smycz, a w przypadku kota – bezpieczny transporter.",
  },
  {
    question: "Czy zwierzęta są zaszczepione i zdrowe?",
    answer:
      "Tak, każde zwierzę opuszczające schronisko jest odrobaczone, odpchlone, posiada aktualne szczepienie przeciwko wściekliźnie (psy) oraz chorobom zakaźnym. Wszystkie posiadają również mikroczip.",
  },
  {
    question: "Czy muszę wykastrować/wysterylizować adoptowane zwierzę?",
    answer:
      "Zdecydowana większość naszych podopiecznych jest już po zabiegu. Jeśli adoptujesz szczenię lub kocię, które jest za młode na zabieg, w umowie znajduje się zapis zobowiązujący Cię do wykonania kastracji w odpowiednim wieku (często schronisko oferuje wtedy zabieg bezpłatnie).",
  },
  {
    question:
      "Czy mogę adoptować zwierzę mieszkając w wynajmowanym mieszkaniu?",
    answer:
      "Tak, pod warunkiem, że właściciel mieszkania wyraża na to zgodę. Zalecamy sprawdzenie zapisów w umowie najmu przed rozpoczęciem procesu adopcyjnego.",
  },
  {
    question: "Czy mogę przyjechać ze swoim psem na zapoznanie?",
    answer:
      "Tak, tzw. spacer równoległy to najlepszy sposób, aby sprawdzić, czy Twój obecny pies zaakceptuje nowego domownika. Takie spotkanie odbywa się pod okiem naszego behawiorysty.",
  },
  {
    question: "Jak przygotować dom na przybycie nowego zwierzaka?",
    answer:
      "Należy przygotować legowisko, miski na wodę i jedzenie, odpowiednią karmę, zabawki oraz zabezpieczyć okna (w przypadku kotów) lub teren posesji (w przypadku psów).",
  },
  {
    question: "Czy prowadzicie wizyty poadopcyjne?",
    answer:
      "Zastrzegamy sobie prawo do wizyt poadopcyjnych, aby sprawdzić, jak zwierzę aklimatyzuje się w nowym miejscu. Zależy nam na budowaniu relacji z nowymi opiekunami i służeniu im radą.",
  },
  {
    question:
      "Jak mogę wesprzeć schronisko, jeśli nie mogę adoptować zwierzaka?",
    answer:
      "Możesz zostać wolontariuszem, przekazać darowiznę finansową, podarować karmę wysokiej jakości, koce lub ręczniki, albo zostać 'Wirtualnym Opiekunem' wybranego zwierzaka.",
  },
  {
    question: "Czy schronisko pomaga w transporcie zwierzaka do nowego domu?",
    answer:
      "Zasady schroniska wymagają, aby to adoptujący odebrał zwierzę osobiście. Jest to ostatni moment na instruktaż i przekazanie dokumentacji medycznej.",
  },
  {
    question: "Czym jest adopcja wirtualna?",
    answer:
      "To forma wsparcia dla osób, które nie mogą przyjąć zwierzęcia pod swój dach. Polega na regularnych wpłatach na konkretnego psa lub kota, co pokrywa koszty jego specjalistycznej karmy lub leczenia.",
  },
  {
    question: "Czy mogę zwrócić zwierzę, jeśli wystąpi alergia u domownika?",
    answer:
      "Adopcja powinna być przemyślaną decyzją. Zachęcamy do wcześniejszego wykonania testów alergicznych. Jeśli jednak sytuacja stanie się krytyczna, prosimy o kontakt – priorytetem jest dla nas bezpieczeństwo zwierzęcia.",
  },
];

const FullFaqList = () => {
  return (
    <Accordion type="single" collapsible className="w-full flex-1">
      {fullFaqData.map((item, index) => (
        <AccordionItem key={item.question} value={`item-${index}`}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent>{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default FullFaqList;

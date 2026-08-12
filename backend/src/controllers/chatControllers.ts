import { type Request, type Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import prisma from '../prisma';
import { AnimalStatus } from '../generated/prisma/enums';
import {
  animalBooleanTraitSelect,
  animalListSelect,
} from '../selects/animal.select';
import { mapAnimalListItem } from '../utils/animalHelpers';
import { chatMessageSchema } from '../validators/chat.validator';
import {
  OTHER_CATEGORY_MESSAGE,
  replyWithGemini,
  type AnimalCatalogItem,
} from '../services/geminiService';

const SHELTER_FAQ = [
  {
    question: 'Jak wygląda proces adopcji?',
    answer:
      'Proces adopcji obejmuje wypełnienie formularza, rozmowę z pracownikiem schroniska oraz podpisanie umowy adopcyjnej.',
  },
  {
    question: 'Czy zwierzęta są zaszczepione i zdrowe?',
    answer:
      'Tak, zwierzęta są pod opieką weterynarza, zaszczepione, odrobaczone i w miarę możliwości wysterylizowane lub wykastrowane.',
  },
  {
    question: 'Czy mogę adoptować zwierzę mieszkając w bloku?',
    answer:
      'Tak, wiele zwierząt świetnie odnajduje się w mieszkaniach. Pomagamy dobrać pupila do stylu życia.',
  },
  {
    question: 'Czy adopcja jest płatna?',
    answer:
      'Adopcja jest bezpłatna lub wiąże się z symboliczną opłatą na koszty opieki weterynaryjnej.',
  },
  {
    question: 'Czy mogę najpierw poznać zwierzę?',
    answer:
      'Tak, zachęcamy do odwiedzin w schronisku i poznania zwierzęcia przed adopcją.',
  },
  {
    question: 'Czy mogę oddać zwierzę, jeśli sobie nie poradzę?',
    answer:
      'W wyjątkowych sytuacjach prosimy o kontakt ze schroniskiem — szukamy najlepszego rozwiązania.',
  },
  {
    question: 'Czy mogę adoptować zwierzę, jeśli mam już inne?',
    answer:
      'Tak, ale zalecamy wcześniejsze zapoznanie zwierząt z pomocą pracowników.',
  },
];

const truncateDescription = (description: string, max = 220) => {
  const trimmed = description.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
};

const getAgeYears = (dateOfBirth: Date) => {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
  ) {
    age -= 1;
  }
  return Math.max(0, age);
};

export const handleChatMessage = async (req: Request, res: Response) => {
  const parsedBody = chatMessageSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: parsedBody.error.issues[0]?.message ?? 'Nieprawidłowy format danych!',
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
      msg: 'Asystent adopcji jest chwilowo niedostępny (brak konfiguracji GEMINI_API_KEY).',
    });
  }

  try {
    const animals = await prisma.animal.findMany({
      where: { status: AnimalStatus.SZUKA_DOMU },
      select: {
        ...animalListSelect,
        ...animalBooleanTraitSelect,
      },
      orderBy: { id: 'asc' },
      take: 80,
    });

    const catalog: AnimalCatalogItem[] = animals.map((animal) => ({
      id: animal.id,
      name: animal.name,
      type: animal.type,
      gender: animal.gender,
      size: animal.size,
      breed: animal.breed,
      energyLevel: animal.energyLevel,
      ageYears: getAgeYears(animal.dateOfBirth),
      healthStatus: animal.healthStatus,
      traits: animal.traits,
      description: truncateDescription(animal.description),
      isSterilized: animal.isSterilized,
      isVaccinated: animal.isVaccinated,
      isChildFriendly: animal.isChildFriendly,
      isTrained: animal.isTrained,
      lovesPlay: animal.lovesPlay,
      lovesWalks: animal.lovesWalks,
      acceptsDogs: animal.acceptsDogs,
      acceptsCats: animal.acceptsCats,
      lovesAffection: animal.lovesAffection,
      poorlyToleratesShelter: animal.poorlyToleratesShelter,
    }));

    const reply = await replyWithGemini(
      parsedBody.data.message,
      catalog,
      SHELTER_FAQ,
      parsedBody.data.history,
    );

    if (reply.category === 'OTHER') {
      return res.status(StatusCodes.OK).json({
        category: reply.category,
        message: OTHER_CATEGORY_MESSAGE,
        animals: [],
      });
    }

    if (reply.category === 'SHELTER_INFO') {
      return res.status(StatusCodes.OK).json({
        category: reply.category,
        message: reply.message,
        animals: [],
      });
    }

    if (animals.length === 0) {
      return res.status(StatusCodes.OK).json({
        category: 'FIND_ANIMAL',
        message:
          'Obecnie nie mamy zwierząt szukających domu. Sprawdź katalog później.',
        animals: [],
      });
    }

    const animalsById = new Map(animals.map((animal) => [animal.id, animal]));
    const matchedAnimals = reply.matches
      .map((match) => {
        const animal = animalsById.get(match.id);
        if (!animal) return null;

        return {
          ...mapAnimalListItem(animal),
          reason: match.reason,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return res.status(StatusCodes.OK).json({
      category: 'FIND_ANIMAL',
      message:
        reply.message ||
        (matchedAnimals.length > 0
          ? 'Oto zwierzęta, które mogą do Ciebie pasować:'
          : 'Nie znalazłem dobrego dopasowania. Spróbuj opisać potrzeby inaczej.'),
      animals: matchedAnimals,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';

    if (message === 'MISSING_GEMINI_API_KEY') {
      return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
        msg: 'Asystent adopcji jest chwilowo niedostępny (brak konfiguracji GEMINI_API_KEY).',
      });
    }

    console.error('handleChatMessage error:', err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg:
        message === 'GEMINI_REQUEST_FAILED'
          ? 'Usługa AI jest chwilowo niedostępna. Sprawdź klucz/model Gemini na serwerze albo spróbuj za chwilę.'
          : message === 'EMPTY_GEMINI_RESPONSE'
            ? 'Asystent nie zwrócił odpowiedzi. Spróbuj ponownie.'
            : 'Nie udało się uzyskać odpowiedzi asystenta. Spróbuj ponownie.',
    });
  }
};

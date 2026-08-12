const DEFAULT_MODEL = 'gemini-3.6-flash';

export const OTHER_CATEGORY_MESSAGE =
  'Jestem asystentem do udzielania informacji odnośnie schroniska lub doboru zwierzęcia do adopcji na podstawie podanych parametrów.';

export type ChatCategory = 'FIND_ANIMAL' | 'SHELTER_INFO' | 'OTHER';

export type AnimalCatalogItem = {
  id: number;
  name: string;
  type: string;
  gender: string;
  size: string;
  breed: string;
  energyLevel: string;
  ageYears: number;
  healthStatus: string;
  traits: string | null;
  description: string;
  isSterilized: boolean;
  isVaccinated: boolean;
  isChildFriendly: boolean;
  isTrained: boolean;
  lovesPlay: boolean;
  lovesWalks: boolean;
  acceptsDogs: boolean;
  acceptsCats: boolean;
  lovesAffection: boolean;
  poorlyToleratesShelter: boolean;
};

export type AnimalMatch = {
  id: number;
  reason: string;
};

export type ChatReplyResult = {
  category: ChatCategory;
  message: string;
  matches: AnimalMatch[];
};

export type ChatHistoryItem = {
  role: 'user' | 'assistant';
  content: string;
};

const SYSTEM_PROMPT = `Jesteś asystentem polskiego schroniska dla zwierząt.
Najpierw sklasyfikuj AKTUALNĄ wiadomość użytkownika do DOKŁADNIE jednej kategorii:
- FIND_ANIMAL — użytkownik szuka / chce doboru zwierzęcia do adopcji (opis stylu życia, preferencji, "znajdź mi psa/kota" itd.)
- SHELTER_INFO — pytanie o schronisko, adopcję, procedury, zdrowie zwierząt, opłaty, wizyty, zasady
- OTHER — wszystko poza tym (pogoda, żarty, polityka, programowanie, tematy niezwiązane)

Zasady odpowiedzi:
- FIND_ANIMAL: wybierz max 5 zwierząt WYŁĄCZNIE z podanego katalogu; nie wymyślaj ID spoza listy; jeśli nic nie pasuje, matches=[] i uprzejma wiadomość.
- Przy doborze uwzględniaj szczególnie: typ, rasę, wiek (ageYears), rozmiar, poziom energii (energyLevel), stan zdrowia (healthStatus), flagi cech oraz opis.
- Uwzględniaj historię rozmowy przy doprecyzowaniach (np. "a mniejszego?", "a kota?", "coś spokojniejszego").
- SHELTER_INFO: odpowiedz po polsku na podstawie FAQ / wiedzy o schronisku; matches musi być [].
- OTHER: message może być puste (system podstawi uniwersalną odpowiedź); matches=[].

Odpowiedz WYŁĄCZNIE poprawnym JSON-em (bez markdown):
{"category":"FIND_ANIMAL|SHELTER_INFO|OTHER","message":"odpowiedź po polsku","matches":[{"id":1,"reason":"krótki powód"}]}`;

const extractJsonObject = (raw: string): unknown => {
  const trimmed = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');

  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      throw new Error('Nie udało się odczytać odpowiedzi asystenta.');
    }
    return JSON.parse(trimmed.slice(start, end + 1));
  }
};

const parseCategory = (value: unknown): ChatCategory => {
  if (value === 'FIND_ANIMAL' || value === 'SHELTER_INFO' || value === 'OTHER') {
    return value;
  }
  return 'OTHER';
};

const parseChatResult = (raw: string): ChatReplyResult => {
  const parsed = extractJsonObject(raw) as {
    category?: unknown;
    message?: unknown;
    matches?: unknown;
  };

  const category = parseCategory(parsed.category);
  const message =
    typeof parsed.message === 'string' ? parsed.message.trim() : '';

  const matchesRaw = Array.isArray(parsed.matches) ? parsed.matches : [];
  const matches: AnimalMatch[] =
    category === 'FIND_ANIMAL'
      ? matchesRaw
          .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const { id, reason } = item as { id?: unknown; reason?: unknown };
            const numericId = typeof id === 'number' ? id : Number(id);
            if (!Number.isInteger(numericId) || typeof reason !== 'string') {
              return null;
            }
            return {
              id: numericId,
              reason: reason.trim() || 'Pasuje do Twojego opisu.',
            };
          })
          .filter((item): item is AnimalMatch => item !== null)
          .slice(0, 5)
      : [];

  if (category === 'OTHER') {
    return {
      category,
      message: OTHER_CATEGORY_MESSAGE,
      matches: [],
    };
  }

  return {
    category,
    message:
      message ||
      (category === 'FIND_ANIMAL'
        ? 'Oto zwierzęta, które mogą do Ciebie pasować:'
        : 'Chętnie pomogę w sprawach schroniska i adopcji.'),
    matches,
  };
};

export const replyWithGemini = async (
  userMessage: string,
  catalog: AnimalCatalogItem[],
  shelterFaq: Array<{ question: string; answer: string }>,
  history: ChatHistoryItem[] = [],
): Promise<ChatReplyResult> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('MISSING_GEMINI_API_KEY');
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const historyBlock =
    history.length > 0
      ? `Historia rozmowy (od najstarszej):\n${history
          .map(
            (item) =>
              `${item.role === 'user' ? 'Użytkownik' : 'Asystent'}: ${item.content}`,
          )
          .join('\n')}\n\n`
      : '';

  const prompt = `${SYSTEM_PROMPT}

FAQ schroniska (JSON):
${JSON.stringify(shelterFaq)}

Katalog zwierząt dostępnych do adopcji (JSON):
${JSON.stringify(catalog)}

${historyBlock}Aktualna wiadomość użytkownika:
${userMessage}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    console.error('Gemini API error:', response.status, errorText);
    throw new Error('GEMINI_REQUEST_FAILED');
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const content = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? '')
    .join('')
    .trim();

  if (!content) {
    throw new Error('EMPTY_GEMINI_RESPONSE');
  }

  return parseChatResult(content);
};

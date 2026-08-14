// KATEGORIA, DO KTOREJ MODEL KLASYFIKUJE WIADOMOSC UZYTKOWNIKA
export type ChatCategory = 'FIND_ANIMAL' | 'SHELTER_INFO' | 'OTHER';

// ZWIERZE W KATALOGU PRZEKAZYWANYM DO MODELU
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

// ZWIERZE DOPASOWANE PRZEZ MODEL WRAZ Z UZASADNIENIEM
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

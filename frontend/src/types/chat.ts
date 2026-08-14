/** Zwierzę zaproponowane przez asystenta AI. */
export type ChatAnimal = {
  id: number;
  name: string;
  imageUrl: string[];
  dateOfBirth: string | Date;
  description: string;
  breed?: string;
  energyLevel?: string;
  reason?: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  animals?: ChatAnimal[];
  isError?: boolean;
};

export type ChatResponse = {
  category?: "FIND_ANIMAL" | "SHELTER_INFO" | "OTHER";
  message: string;
  animals: ChatAnimal[];
};

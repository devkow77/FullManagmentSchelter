export const formatCageLabel = (cage: {
  zone: string;
  number: number;
}): string => `${cage.zone}-${String(cage.number).padStart(2, '0')}`;

export const cageSelect = {
  id: true,
  zone: true,
  number: true,
} as const;

export const animalBooleanTraitSelect = {
  isSterilized: true,
  isVaccinated: true,
  isChildFriendly: true,
  isTrained: true,
  lovesPlay: true,
  lovesWalks: true,
  acceptsDogs: true,
  acceptsCats: true,
  lovesAffection: true,
  poorlyToleratesShelter: true,
} as const;

// WSZYSTKIE DANE ZWIERZA
export const animalSelect = {
  id: true,
  name: true,
  type: true,
  gender: true,
  size: true,
  breed: true,
  energyLevel: true,
  traits: true,
  dateOfBirth: true,
  description: true,
  cageId: true,
  cage: { select: cageSelect },
  ...animalBooleanTraitSelect,
  status: true,
  healthStatus: true,
  nextVisitDate: true,
  foundAt: true,
  foundLocation: true,
  imageUrl: true,
  createdAt: true,
} as const;

export const animalListSelect = {
  id: true,
  name: true,
  type: true,
  gender: true,
  size: true,
  breed: true,
  energyLevel: true,
  description: true,
  dateOfBirth: true,
  cageId: true,
  cage: { select: cageSelect },
  status: true,
  healthStatus: true,
  imageUrl: true,
  traits: true,
  nextVisitDate: true,
  foundAt: true,
  foundLocation: true,
  _count: {
    select: { needs: { where: { isActive: true } } },
  },
} as const;

export const animalIdSelect = {
  id: true,
} as const;

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

export const animalSelect = {
  id: true,
  name: true,
  type: true,
  gender: true,
  size: true,
  traits: true,
  dateOfBirth: true,
  description: true,
  cageNumber: true,
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
  description: true,
  dateOfBirth: true,
  cageNumber: true,
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

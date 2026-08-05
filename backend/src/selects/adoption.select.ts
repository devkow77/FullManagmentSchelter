export const adoptionListInclude = {
  user: {
    select: {
      fullName: true,
    },
  },
  animal: {
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
    },
  },
} as const;

export const adoptionDetailInclude = {
  user: {
    select: {
      id: true,
      fullName: true,
      gender: true,
      phoneNumber: true,
      city: true,
      postalCode: true,
      street: true,
      dateOfBirth: true,
      imageUrl: true,
      adminNote: true,
    },
  },
  animal: {
    select: {
      id: true,
      name: true,
      type: true,
      gender: true,
      dateOfBirth: true,
      healthStatus: true,
      traits: true,
      imageUrl: true,
    },
  },
} as const;

export const userListSelect = {
  id: true,
  fullName: true,
  gender: true,
  email: true,
  role: true,
  city: true,
  isBanned: true,
  isFormFilled: true,
  hasChildren: true,
  twoFactorEnabled: true,
  imageUrl: true,
  createdAt: true,
} as const;

export const userDetailSelect = {
  id: true,
  fullName: true,
  gender: true,
  email: true,
  role: true,
  phoneNumber: true,
  city: true,
  postalCode: true,
  street: true,
  dateOfBirth: true,
  hasChildren: true,
  hasOtherAnimals: true,
  housingType: true,
  hasGardenOrBalcony: true,
  livingConditions: true,
  isBanned: true,
  isFormFilled: true,
  adminNote: true,
  twoFactorEnabled: true,
  imageUrl: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const userProfileSelect = {
  id: true,
  fullName: true,
  gender: true,
  email: true,
  phoneNumber: true,
  city: true,
  postalCode: true,
  street: true,
  dateOfBirth: true,
  hasChildren: true,
  hasOtherAnimals: true,
  housingType: true,
  hasGardenOrBalcony: true,
  livingConditions: true,
  isFormFilled: true,
  twoFactorEnabled: true,
  imageUrl: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const userPasswordSelect = {
  id: true,
  password: true,
} as const;

export const userRoleSelect = {
  role: true,
} as const;

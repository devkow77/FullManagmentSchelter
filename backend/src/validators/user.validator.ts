import { z } from 'zod';

// router.patch('/password', authenticateUser, updatePassword);
export const updatePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, 'Hasło musi mieć min. 8 znaków')
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
        'Hasło musi zawierać min. 1 wielką literę, 1 cyfrę i 1 znak specjalny.',
      ),
    newPassword: z
      .string()
      .min(8, 'Hasło musi mieć min. 8 znaków')
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
        'Hasło musi zawierać min. 1 wielką literę, 1 cyfrę i 1 znak specjalny.',
      ),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Hasła muszą być takie same.',
    path: ['confirmNewPassword'],
  });

export const RoleEnum = z.enum(['UZYTKOWNIK', 'ADMINISTRATOR', 'PRACOWNIK']);
export const GenderEnum = z.enum(['MEZCZYZNA', 'KOBIETA']);
export const HousingTypeEnum = z.enum(['DOM', 'MIESZKANIE', 'INNE']);

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const isAtLeast18 = (date: Date) => {
  const eighteenthBirthday = new Date(date);
  eighteenthBirthday.setFullYear(eighteenthBirthday.getFullYear() + 18);
  eighteenthBirthday.setHours(0, 0, 0, 0);
  return eighteenthBirthday.getTime() <= startOfToday().getTime();
};

// router.patch('/:id', updateUniqueUser);
export const updateUserSchema = z.object({
  fullName: z
    .string()
    .min(3, 'Imię i nazwisko musi mieć minimum 3 znaki.')
    .max(50, 'Imię i nazwisko nie może mieć więcej niż 50 znaków.'),
  gender: GenderEnum,
  role: RoleEnum,
  phoneNumber: z.preprocess(
    (val) => (val === '' || val == null ? null : val),
    z
      .string()
      .trim()
      .regex(/^\d{9}$/, 'Numer telefonu musi składać się z 9 cyfr.')
      .nullable(),
  ),
  city: z.preprocess(
    (val) => (val === '' || val == null ? null : val),
    z
      .string()
      .trim()
      .min(3, 'Miasto musi mieć minimum 3 znaki.')
      .max(50, 'Miasto może mieć maksymalnie 50 znaków.')
      .nullable()
      .optional(),
  ),
  postalCode: z.preprocess(
    (val) => (val === '' || val == null ? null : val),
    z
      .string()
      .trim()
      .regex(/^\d{2}-\d{3}$/, 'Kod pocztowy musi mieć format XX-XXX.')
      .nullable()
      .optional(),
  ),
  street: z.preprocess(
    (val) => (val === '' || val == null ? null : val),
    z
      .string()
      .trim()
      .min(3, 'Adres musi mieć minimum 3 znaki.')
      .max(100, 'Adres może mieć maksymalnie 100 znaków.')
      .nullable()
      .optional(),
  ),
  dateOfBirth: z.preprocess(
    (val) => {
      if (val === '' || val == null) return null;
      return val;
    },
    z.coerce
      .date({ message: 'Niepoprawna data urodzenia.' })
      .nullable()
      .optional(),
  ),
  hasChildren: z.boolean().optional(),
  hasOtherAnimals: z.boolean().optional(),
  housingType: z.preprocess(
    (val) => (val === '' || val == null ? null : val),
    HousingTypeEnum.nullable().optional(),
  ),
  hasGardenOrBalcony: z.boolean().optional(),
  livingConditions: z.preprocess(
    (val) => (val === '' || val == null ? null : val),
    z
      .string()
      .trim()
      .max(500, 'Opis warunków może mieć maksymalnie 500 znaków.')
      .nullable()
      .optional(),
  ),
  isBanned: z.boolean().optional(),
  adminNote: z
    .string()
    .max(500, 'Notatka może mieć maksymalnie 500 znaków.')
    .optional(),
  imageUrl: z.string().nullable().optional(),
});

// router.patch('/me', updateOwnProfile);
export const updateOwnProfileSchema = z.object({
  fullName: z
    .string()
    .min(3, 'Imię i nazwisko musi mieć minimum 3 znaki.')
    .max(50, 'Imię i nazwisko nie może mieć więcej niż 50 znaków.'),
  gender: GenderEnum,
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\d{9}$/, 'Numer telefonu musi składać się z 9 cyfr.'),
  city: z
    .string()
    .trim()
    .min(3, 'Miasto musi mieć minimum 3 znaki.')
    .max(50, 'Miasto może mieć maksymalnie 50 znaków.'),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{2}-\d{3}$/, 'Kod pocztowy musi mieć format XX-XXX.'),
  street: z
    .string()
    .trim()
    .min(3, 'Adres musi mieć minimum 3 znaki.')
    .max(100, 'Adres może mieć maksymalnie 100 znaków.'),
  dateOfBirth: z.coerce
    .date({ message: 'Niepoprawna data urodzenia.' })
    .refine(
      (date) => date.getTime() <= startOfToday().getTime(),
      'Data urodzenia nie może być z przyszłości.',
    )
    .refine(isAtLeast18, 'Musisz mieć ukończone 18 lat.'),
  hasChildren: z.boolean(),
  hasOtherAnimals: z.boolean(),
  housingType: HousingTypeEnum,
  hasGardenOrBalcony: z.boolean(),
  livingConditions: z
    .string()
    .trim()
    .min(10, 'Opisz warunki mieszkaniowe (min. 10 znaków).')
    .max(500, 'Opis warunków może mieć maksymalnie 500 znaków.'),
  imageUrl: z.string().nullable().optional(),
});

// router.post('/', createUser);
export const createUserSchema = z.object({
  fullName: z
    .string()
    .min(3, 'Imię i nazwisko musi mieć minimum 3 znaki.')
    .max(50, 'Imię i nazwisko nie może mieć więcej niż 50 znaków.'),
  email: z
    .string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Niepoprawny adres email.'),
  gender: GenderEnum,
  role: RoleEnum,
  password: z
    .string()
    .min(8, 'Hasło musi mieć min. 8 znaków')
    .regex(
      /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
      'Hasło musi zawierać min. 1 wielką literę, 1 cyfrę i 1 znak specjalny.',
    ),
  imageUrl: z.string().nullable().optional(),
});

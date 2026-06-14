export const medicalRecordListInclude = {
  animal: {
    select: {
      name: true,
      type: true,
    },
  },
  vet: {
    select: {
      name: true,
      clinic: true,
    },
  },
} as const;

export const medicalRecordDetailInclude = {
  animal: {
    select: {
      id: true,
      name: true,
      type: true,
    },
  },
  vet: {
    select: {
      id: true,
      clinic: true,
    },
  },
} as const;

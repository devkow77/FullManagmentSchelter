/** Odpowiedź endpointów listujących z paginacją po stronie serwera. */
export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

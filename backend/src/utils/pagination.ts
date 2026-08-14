import type { PaginatedResponse } from '../types';

// BUDUJE JEDNOLITA KOPERTE ODPOWIEDZI DLA ENDPOINTOW LISTUJACYCH
export const paginate = <T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResponse<T> => ({
  data,
  total,
  page,
  pageSize,
  hasMore: page * pageSize < total,
});

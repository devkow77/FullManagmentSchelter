// KOPERTA ODPOWIEDZI ENDPOINTOW LISTUJACYCH Z PAGINACJA
export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export interface Pagination {
  totalPages: number;
  currentPage: number;
  nextPage: number | null;
  previousPage: number | null;
}

/**
 * Generic wrapper that matches the shape returned by all API endpoints.
 * Use this as the return type for any API call response.
 */
export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  pagination?: Pagination;
};

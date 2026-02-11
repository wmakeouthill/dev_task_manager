/** Espelha PagedResponse<T> do backend .NET */
export interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  isLast: boolean
}

/** Espelha ErrorResponse do backend .NET */
export interface ErrorResponse {
  status: number
  error: string
  message: string
  path: string
  timestamp: string
  fieldErrors?: { field: string; message: string }[]
}

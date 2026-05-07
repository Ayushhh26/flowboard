export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { code: string; message: string } }

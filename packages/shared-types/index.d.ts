export interface ApiResponse<T = unknown> {
  code: number;
  msg?: string;
  data: T;
}

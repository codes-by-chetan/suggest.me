/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ApiResponse<T = any> {
  statusCode: number;
  data?: T | null;
  message: string;
  success: boolean;
  redirect?: string | boolean | null;
  status?: string;
  isOperational?: boolean;
  [key: string]: any;
}
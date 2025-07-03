/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ApiResponse {
  statusCode: number
  data: { [key: string]: any } |null
  message: string
  success: boolean
  redirect: string | boolean | null
  [key: string]: any
}

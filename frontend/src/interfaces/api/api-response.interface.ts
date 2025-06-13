export interface ApiResponse {
  statusCode: number
  data: { [key: string]: any }
  message: string
  success: boolean
  redirect: string | boolean | null
  [key: string]: any
}

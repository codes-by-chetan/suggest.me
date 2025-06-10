export default interface ApiErrorResponse {
  success: boolean
  message: string
  redirect?: string | null
  statusCode: number
  status: string
  isOperational: boolean
}

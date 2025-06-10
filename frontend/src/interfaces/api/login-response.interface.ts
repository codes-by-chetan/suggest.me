/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Credentials {
  email: string
  password: string
}

export interface LoginApiResponse {
  statusCode: number
  data: Data
  message: string
  success: boolean
  redirect: null
}

interface Data {
  token: string
  expiryTime: string
  [key: string]: any
}

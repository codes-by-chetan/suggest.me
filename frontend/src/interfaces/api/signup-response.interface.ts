/* eslint-disable @typescript-eslint/no-explicit-any */

export interface registrationDetails {
  fullName: string
  userName: string
  email: string
  password: string
  contactNumber: string
}

export interface SignUpApiResponse {
  statusCode: number
  data: Data
  message: string
  success: boolean
  redirect: null
}

interface Data {
  user: User
  token: string
  expiryTime: string
  [key: string]: any
}

interface User {
  fullName: FullName
  email: string
  contactNumber: ContactNumber
  role: string
  fullNameString: string
  [key: string]: any
}

interface ContactNumber {
  countryCode: string
  number: string
  [key: string]: any
}

interface FullName {
  firstName: string
  lastName: string
  [key: string]: any
}

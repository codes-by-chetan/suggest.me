/* eslint-disable @typescript-eslint/no-explicit-any */
export interface RefreshUserDetailsApiResponse {
  statusCode: number;
  data: Data;
  message: string;
  success: boolean;
  redirect: null;
}

interface Data {
  user: User;
}

interface User {
  _id: string;
  fullName: FullName;
  email: string;
  contactNumber: ContactNumber;
  role: string;
  fullNameString: string;
  avatar: Avatar;
}

interface Avatar {
  publicId: string;
  url: string;
  _id: string;
  id: string;
}

interface ContactNumber {
  countryCode: string;
  number: string;

}

interface FullName {
  firstName: string;
  lastName: string;
  [key: string]: any;
}
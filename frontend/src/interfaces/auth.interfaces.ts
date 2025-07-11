/* eslint-disable @typescript-eslint/no-explicit-any */
export interface credentials {
  email: string;
  password: string;
}

export interface registrationDetails {
  fullName: string;
  userName: string;
  email: string;
  password: string;
  contactNumber: string;
}
export interface response {
  data: { [key: string]: any } | null;
  success: boolean;
  message: string;
  statusCode: number;
  redirect?: string;
}

export interface User {
  org: { [key: string]: any } | null | string;
  fullName: string;
  email: string;
  contactNumber: string;
  role: string;
  status: string;
  salary: number;
  avatar: { url: string; publicId: string };
  gender: string;
  age: number;
  joiningDate: string;
  department: string;
  [key: string]: any;
}

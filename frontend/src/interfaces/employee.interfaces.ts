/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Employee {
  fullName: string;
  email: string;
  contactNumber: string;
  role: string;
  status: string;
  salary: number;
  profileImage: any;
  gender: string;
  age: number;
  joiningDate: string;
  department: string;
  [key: string]: any;
}

export interface NewEmployee {
  fullName: string;
  email: string;
  contactNumber: string;
  password: string;
  confirmPassword?: string;
  role: "admin"|"employee";
  salary: number;
  profileImage: any;
  gender: string;
  age: number;
  joiningDate: string;
  department: string;
}

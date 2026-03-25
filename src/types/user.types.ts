export interface User {
    _id: string;
    name: string;
    email: string;
    password?: string;
    role: string[];
    /** Set by the backend when an admin manages this user (employee / hr / manager). */
    managedBy?: string | null;
    profileImage: string | null;
    address: any[]; // you can refine later
    phone: string | null;
    skills: any[];
    education: any[];
    experience: any[];
    leaves: any[];
    dob: string | null;
    gender: "male" | "female" | "other";
    isActive: boolean;
    isEmailVerified?: boolean;
    emailVerificationToken?: string | null;
    emailVerificationExpiresAt?: string | null;
    createdAt: string;
    updatedAt: string;
    __v: number;
  }
  
export interface LoginResponse {
    success: boolean;
    message: string;
    user: User;
    token: string;
  }
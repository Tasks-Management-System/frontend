export interface User {
    _id: string;
    name: string;
    email: string;
    password?: string;
    role: string[];
    /** Set by the backend when an admin manages this user (employee / hr / manager). */
    managedBy?: string | null;
    profileImage: string | null;
    address: Array<{ address?: string; city?: string }>;
    phone: string | null;
    skills: Array<{ skill?: string; yearsOfExperience?: number }>;
    education: Array<{
      degree?: string;
      institution?: string;
      year?: number;
      specialization?: string;
    }>;
    experience: Array<{
      company?: string;
      position?: string;
      startDate?: string;
      endDate?: string;
    }>;
    leaves: Array<{
      totalBalance?: number;
      paidLeave?: number;
      leaveTaken?: number;
    }>;
    dob: string | null;
    aadharCardNumber?: string;
    panCardNumber?: string;
    bankAccountNo?: string;
    bankName?: string;
    bankIFSC?: string;
    bankBranch?: string;
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
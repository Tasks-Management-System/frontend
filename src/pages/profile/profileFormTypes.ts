export type ProfileEditFormState = {
  name: string;
  email: string;
  phone: string;
  dob: string;
  gender: "male" | "female" | "other" | "";
  addressLine: string;
  addressCity: string;
  aadharCardNumber: string;
  panCardNumber: string;
  bankAccountNo: string;
  bankName: string;
  bankIFSC: string;
  bankBranch: string;
  skillsJson: string;
  educationJson: string;
  experienceJson: string;
  leavesJson: string;
};

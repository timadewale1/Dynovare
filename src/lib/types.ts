export type Role = "policy_analyst" | "researcher" | "organization" | "student";

export type UserProfile = {
  uid: string;
  email: string;
  fullName: string;
  role: Role;
  onboardingComplete: boolean;
  organizationName?: string;
  institution?: string;
  createdAt?: any;
  updatedAt?: any;
};

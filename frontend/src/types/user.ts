export type Role = "ADMIN" | "SALESPERSON";

export interface UserResponse {
  id: string;
  username: string;
  email: string | null;
  fullName: string;
  role: Role;
  active: boolean;
  lastLoginAt: string | null;
  lastActivityAt: string | null;
  locationId: string | null;
  locationName: string | null;
}

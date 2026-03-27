import { axiosInstance } from "@/app/lib/api/client";

export type AuthenticateInput = {
  tenancyName?: string;
  userNameOrEmailAddress: string;
  password: string;
  rememberClient: boolean;
};

export type TenantAvailabilityState = "Available" | "InActive" | "NotFound";

export type TenantAvailabilityResult = {
  state: TenantAvailabilityState;
  tenantId: number | null;
};

export type AuthenticateResult = {
  accessToken: string;
  encryptedAccessToken: string;
  expireInSeconds: number;
  userId: number;
  tenantId: number | null;
  userName: string;
  fullName: string;
  emailAddress: string;
};

export async function authenticate(payload: AuthenticateInput) {
  try {
    const response = await axiosInstance.post<AuthenticateResult>("/api/TokenAuth/Authenticate", payload);
    return response.data;
  } catch {
    throw new Error("Sign-in failed. Verify the backend is running and the credentials are correct.");
  }
}

export async function checkTenantAvailability(tenancyName: string) {
  try {
    const response = await axiosInstance.post<{ result: TenantAvailabilityResult }>("/api/services/app/Account/IsTenantAvailable", {
      tenancyName
    });

    return response.data.result;
  } catch {
    throw new Error("Unable to verify tenant right now.");
  }
}

export async function logout() {
  await axiosInstance.post("/api/TokenAuth/Logout");
}

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

export type CurrentLoginInformationsResult = {
  user: {
    id: number;
    userName: string;
    name: string;
    surname: string;
    emailAddress: string;
  } | null;
  tenant: {
    id: number;
    tenancyName: string;
    name: string;
  } | null;
};

export type ActiveTenantLoginOption = {
  id: number;
  tenancyName: string;
  name: string;
};

export async function authenticate(payload: AuthenticateInput) {
  try {
    const response = await axiosInstance.post<AuthenticateResult>("/api/TokenAuth/Authenticate", payload);
    return response.data;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      typeof (error as { response?: unknown }).response === "object" &&
      (error as { response?: unknown }).response !== null &&
      "data" in ((error as { response: { data?: unknown } }).response)
    ) {
      const responseData = (error as { response: { data?: unknown; status?: number } }).response.data;

      if (
        typeof responseData === "object" &&
        responseData !== null &&
        "error" in responseData &&
        typeof (responseData as { error?: unknown }).error === "object" &&
        (responseData as { error?: unknown }).error !== null
      ) {
        const errorPayload = (responseData as { error: { message?: string; details?: string } }).error;
        throw new Error(errorPayload.details || errorPayload.message || "Sign-in failed.");
      }
    }

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

export async function getActiveTenantsForLogin() {
  try {
    const response = await axiosInstance.get<{ result: ActiveTenantLoginOption[] }>(
      "/api/services/app/Account/GetActiveTenantsForLogin"
    );

    return response.data.result;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      typeof (error as { response?: unknown }).response === "object" &&
      (error as { response?: unknown }).response !== null &&
      "status" in ((error as { response: { status?: number } }).response)
    ) {
      const status = (error as { response: { status?: number } }).response.status;

      if (status === 404) {
        return [];
      }
    }

    throw new Error("Unable to load tenants right now.");
  }
}

export async function logout() {
  await axiosInstance.post("/api/TokenAuth/Logout");
}

export async function getCurrentLoginInformations() {
  const response = await axiosInstance.get<{ result: CurrentLoginInformationsResult }>(
    "/api/services/app/Session/GetCurrentLoginInformations"
  );

  return response.data.result;
}

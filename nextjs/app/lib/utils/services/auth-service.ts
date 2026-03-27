import { axiosInstance } from "@/app/lib/api/client";

export type AuthenticateInput = {
  userNameOrEmailAddress: string;
  password: string;
  rememberClient: boolean;
};

export type AuthenticateResult = {
  accessToken: string;
  encryptedAccessToken: string;
  expireInSeconds: number;
  userId: number;
};

export async function authenticate(payload: AuthenticateInput) {
  try {
    const response = await axiosInstance.post<AuthenticateResult>("/api/TokenAuth/Authenticate", payload);
    return response.data;
  } catch {
    throw new Error("Sign-in failed. Verify the backend is running and the credentials are correct.");
  }
}

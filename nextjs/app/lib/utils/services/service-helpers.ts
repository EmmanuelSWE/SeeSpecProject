import { axiosInstance } from "@/app/lib/api/client";

type AbpResponse<T> = {
  result?: T;
} & T;

export type AbpPagedResult<T> = {
  items: T[];
  totalCount: number;
};

export function unwrapResponse<T>(payload: AbpResponse<T>): T {
  return (payload.result ?? payload) as T;
}

export function mapErrorMessage(error: unknown, fallbackMessage: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object" &&
    (error as { response?: unknown }).response !== null &&
    "data" in (error as { response: { data?: unknown } }).response
  ) {
    const responseData = (error as { response: { data?: unknown } }).response.data;

    if (
      typeof responseData === "object" &&
      responseData !== null &&
      "error" in responseData &&
      typeof (responseData as { error?: unknown }).error === "object" &&
      (responseData as { error?: unknown }).error !== null
    ) {
      const errorPayload = (responseData as { error: { message?: string; details?: string } }).error;
      return errorPayload.details || errorPayload.message || fallbackMessage;
    }
  }

  return fallbackMessage;
}

export async function getPaged<T>(url: string, params: Record<string, unknown> = {}) {
  const response = await axiosInstance.get<AbpResponse<AbpPagedResult<T>>>(url, {
    params: {
      MaxResultCount: 1000,
      ...params
    }
  });

  return unwrapResponse(response.data);
}

export async function getOne<T>(url: string, params: Record<string, unknown> = {}) {
  const response = await axiosInstance.get<AbpResponse<T>>(url, { params });
  return unwrapResponse(response.data);
}

export async function postOne<T, TPayload>(url: string, payload: TPayload) {
  const response = await axiosInstance.post<AbpResponse<T>>(url, payload);
  return unwrapResponse(response.data);
}

export async function putOne<T, TPayload>(url: string, payload: TPayload) {
  const response = await axiosInstance.put<AbpResponse<T>>(url, payload);
  return unwrapResponse(response.data);
}

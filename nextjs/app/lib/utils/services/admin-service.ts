import { axiosInstance } from "@/app/lib/api/client";

type AbpResponse<T> = {
  result?: T;
} & T;

type PagedResult<T> = {
  items: T[];
  totalCount: number;
};

export type RoleDto = {
  id: number;
  name: string;
  displayName: string;
  normalizedName?: string | null;
  description?: string | null;
  grantedPermissions?: string[] | null;
};

export type UserDto = {
  id: number;
  userName: string;
  name: string;
  surname: string;
  fullName?: string | null;
  emailAddress: string;
  isActive: boolean;
  lastLoginTime?: string | null;
  creationTime?: string;
  roleNames?: string[];
};

export type CreateUserInput = {
  userName: string;
  name: string;
  surname: string;
  emailAddress: string;
  isActive: boolean;
  roleNames: string[];
  password: string;
};

export type UpdateUserInput = {
  id: number;
  userName: string;
  name: string;
  surname: string;
  emailAddress: string;
  isActive: boolean;
  fullName?: string;
  lastLoginTime?: string | null;
  creationTime?: string;
  roleNames: string[];
};

export type TenantDto = {
  id: number;
  tenancyName: string;
  name: string;
  isActive: boolean;
};

export type CreateTenantInput = {
  tenancyName: string;
  name: string;
  adminEmailAddress: string;
  isActive: boolean;
};

export type UpdateTenantInput = {
  id: number;
  tenancyName: string;
  name: string;
  isActive: boolean;
};

function unwrapResponse<T>(payload: AbpResponse<T>): T {
  return (payload.result ?? payload) as T;
}

function mapErrorMessage(error: unknown, fallbackMessage: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object" &&
    (error as { response?: unknown }).response !== null &&
    "data" in ((error as { response: { data?: unknown } }).response)
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

export async function getUsers(params: { keyword?: string; isActive?: boolean | null; maxResultCount?: number } = {}) {
  try {
    const response = await axiosInstance.get<AbpResponse<PagedResult<UserDto>>>("/api/services/app/User/GetAll", {
      params: {
        Keyword: params.keyword,
        IsActive: params.isActive ?? undefined,
        MaxResultCount: params.maxResultCount ?? 100
      }
    });

    return unwrapResponse(response.data);
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to load users."));
  }
}

export async function getUserRoles() {
  try {
    const response = await axiosInstance.get<AbpResponse<{ items: RoleDto[] }>>("/api/services/app/User/GetRoles");
    return unwrapResponse(response.data).items ?? [];
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to load roles."));
  }
}

export async function getRoles(params: { keyword?: string; maxResultCount?: number } = {}) {
  try {
    const response = await axiosInstance.get<AbpResponse<PagedResult<RoleDto>>>("/api/services/app/Role/GetAll", {
      params: {
        Keyword: params.keyword,
        MaxResultCount: params.maxResultCount ?? 100
      }
    });

    return unwrapResponse(response.data);
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to load roles."));
  }
}

export async function createUser(payload: CreateUserInput) {
  try {
    const response = await axiosInstance.post<AbpResponse<UserDto>>("/api/services/app/User/Create", payload);
    return unwrapResponse(response.data);
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to create user."));
  }
}

export async function updateUser(payload: UpdateUserInput) {
  try {
    const response = await axiosInstance.put<AbpResponse<UserDto>>("/api/services/app/User/Update", payload);
    return unwrapResponse(response.data);
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to update user."));
  }
}

export async function deleteUser(id: number) {
  try {
    await axiosInstance.delete("/api/services/app/User/Delete", {
      params: {
        Id: id
      }
    });
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to delete user."));
  }
}

export async function activateUser(id: number) {
  try {
    await axiosInstance.post("/api/services/app/User/Activate", { id });
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to activate user."));
  }
}

export async function deactivateUser(id: number) {
  try {
    await axiosInstance.post("/api/services/app/User/DeActivate", { id });
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to deactivate user."));
  }
}

export async function getTenants(params: { keyword?: string; isActive?: boolean | null; maxResultCount?: number } = {}) {
  try {
    const response = await axiosInstance.get<AbpResponse<PagedResult<TenantDto>>>("/api/services/app/Tenant/GetAll", {
      params: {
        Keyword: params.keyword,
        IsActive: params.isActive ?? undefined,
        MaxResultCount: params.maxResultCount ?? 100
      }
    });

    return unwrapResponse(response.data);
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to load tenants."));
  }
}

export async function createTenant(payload: CreateTenantInput) {
  try {
    const response = await axiosInstance.post<AbpResponse<TenantDto>>("/api/services/app/Tenant/Create", payload);
    return unwrapResponse(response.data);
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to create tenant."));
  }
}

export async function updateTenant(payload: UpdateTenantInput) {
  try {
    const response = await axiosInstance.put<AbpResponse<TenantDto>>("/api/services/app/Tenant/Update", payload);
    return unwrapResponse(response.data);
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to update tenant."));
  }
}

export async function deleteTenant(id: number) {
  try {
    await axiosInstance.delete("/api/services/app/Tenant/Delete", {
      params: {
        Id: id
      }
    });
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to delete tenant."));
  }
}

import { getOne, getPaged, mapErrorMessage, postOne, putOne } from "@/app/lib/utils/services/service-helpers";

export type SpecDto = {
  id: string;
  backendId: string;
  title: string;
  version: string;
  status: number;
};

export type CreateSpecInput = {
  backendId: string;
  title: string;
  version: string;
  status: number;
};

export type UpdateSpecInput = Partial<CreateSpecInput> & {
  id: string;
};

export async function getSpecs(): Promise<SpecDto[]> {
  try {
    const response = await getPaged<SpecDto>("/services/app/Spec/GetAll");
    return response.items ?? [];
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to load specs."));
  }
}

export async function getSpecById(id: string): Promise<SpecDto> {
  try {
    return await getOne<SpecDto>("/services/app/Spec/Get", { Id: id });
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to load spec."));
  }
}

export async function getSpecByBackendId(backendId: string): Promise<SpecDto | null> {
  const specs = await getSpecs();
  return specs.find((spec) => spec.backendId === backendId) ?? null;
}

export async function createSpec(payload: CreateSpecInput): Promise<SpecDto> {
  try {
    return await postOne<SpecDto, CreateSpecInput>("/services/app/Spec/Create", payload);
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to create spec."));
  }
}

export async function updateSpec(payload: UpdateSpecInput): Promise<SpecDto> {
  try {
    const current = await getSpecById(payload.id);
    return await putOne<SpecDto, SpecDto>("/services/app/Spec/Update", {
      ...current,
      backendId: payload.backendId ?? current.backendId,
      title: payload.title ?? current.title,
      version: payload.version ?? current.version,
      status: payload.status ?? current.status
    });
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to update spec."));
  }
}

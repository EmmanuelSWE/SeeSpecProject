import { axiosInstance } from "@/app/lib/api/client";
import { getOne, getPaged, mapErrorMessage, postOne, putOne } from "@/app/lib/utils/services/service-helpers";

export type SectionItemDto = {
  id: string;
  specSectionId: string;
  label: string;
  content: string;
  position: number;
  itemType: number;
};

export type CreateSectionItemInput = {
  specSectionId: string;
  label: string;
  content: string;
  position: number;
  itemType?: number;
};

export type UpdateSectionItemInput = Partial<CreateSectionItemInput> & {
  id: string;
};

export async function getSectionItemsBySection(specSectionId: string): Promise<SectionItemDto[]> {
  try {
    const response = await getPaged<SectionItemDto>("/services/app/SectionItem/GetAll");
    return (response.items ?? []).filter((item) => item.specSectionId === specSectionId);
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to load section items."));
  }
}

export async function createSectionItem(payload: CreateSectionItemInput): Promise<SectionItemDto> {
  try {
    return await postOne<SectionItemDto, Omit<SectionItemDto, "id">>("/services/app/SectionItem/Create", {
      specSectionId: payload.specSectionId,
      label: payload.label,
      content: payload.content,
      position: payload.position,
      itemType: payload.itemType ?? 1
    });
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to create section item."));
  }
}

export async function updateSectionItem(payload: UpdateSectionItemInput): Promise<SectionItemDto> {
  try {
    const current = await getOne<SectionItemDto>("/services/app/SectionItem/Get", { Id: payload.id });
    return await putOne<SectionItemDto, SectionItemDto>("/services/app/SectionItem/Update", {
      ...current,
      specSectionId: payload.specSectionId ?? current.specSectionId,
      label: payload.label ?? current.label,
      content: payload.content ?? current.content,
      position: payload.position ?? current.position,
      itemType: payload.itemType ?? current.itemType
    });
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to update section item."));
  }
}

export async function deleteSectionItem(id: string): Promise<string> {
  try {
    await axiosInstance.delete("/services/app/SectionItem/Delete", {
      params: {
        Id: id
      }
    });
    return id;
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to delete section item."));
  }
}

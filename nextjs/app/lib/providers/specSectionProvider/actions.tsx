import type { SpecSectionDto, SpecSectionType } from "@/app/lib/utils/services/spec-section-service";

export enum SpecSectionActionEnums {
  pending = "SPEC_SECTION_PENDING",
  getSectionSuccess = "GET_SPEC_SECTION_SUCCESS",
  getSectionsSuccess = "GET_SPEC_SECTIONS_SUCCESS",
  error = "SPEC_SECTION_ERROR",
  createSectionSuccess = "CREATE_SPEC_SECTION_SUCCESS",
  updateSectionSuccess = "UPDATE_SPEC_SECTION_SUCCESS",
  deleteSectionSuccess = "DELETE_SPEC_SECTION_SUCCESS",
  setActiveSection = "SET_ACTIVE_SPEC_SECTION",
  setActiveType = "SET_ACTIVE_SPEC_SECTION_TYPE",
  reset = "RESET_SPEC_SECTION_STATE"
}

export type SpecSectionAction =
  | { type: SpecSectionActionEnums.pending }
  | { type: SpecSectionActionEnums.getSectionSuccess; payload: SpecSectionDto | null }
  | { type: SpecSectionActionEnums.getSectionsSuccess; payload: SpecSectionDto[] }
  | { type: SpecSectionActionEnums.error; payload: string }
  | { type: SpecSectionActionEnums.createSectionSuccess; payload: SpecSectionDto }
  | { type: SpecSectionActionEnums.updateSectionSuccess; payload: SpecSectionDto }
  | { type: SpecSectionActionEnums.deleteSectionSuccess; payload: string }
  | { type: SpecSectionActionEnums.setActiveSection; payload: SpecSectionDto | null }
  | { type: SpecSectionActionEnums.setActiveType; payload: SpecSectionType | null }
  | { type: SpecSectionActionEnums.reset };

export const specSectionPending = (): SpecSectionAction => ({ type: SpecSectionActionEnums.pending });
export const getSpecSectionSuccess = (payload: SpecSectionDto | null): SpecSectionAction => ({ type: SpecSectionActionEnums.getSectionSuccess, payload });
export const getSpecSectionsSuccess = (payload: SpecSectionDto[]): SpecSectionAction => ({ type: SpecSectionActionEnums.getSectionsSuccess, payload });
export const specSectionError = (payload: string): SpecSectionAction => ({ type: SpecSectionActionEnums.error, payload });
export const createSpecSectionSuccess = (payload: SpecSectionDto): SpecSectionAction => ({ type: SpecSectionActionEnums.createSectionSuccess, payload });
export const updateSpecSectionSuccess = (payload: SpecSectionDto): SpecSectionAction => ({ type: SpecSectionActionEnums.updateSectionSuccess, payload });
export const deleteSpecSectionSuccess = (payload: string): SpecSectionAction => ({ type: SpecSectionActionEnums.deleteSectionSuccess, payload });
export const setActiveSpecSection = (payload: SpecSectionDto | null): SpecSectionAction => ({ type: SpecSectionActionEnums.setActiveSection, payload });
export const setActiveSpecSectionType = (payload: SpecSectionType | null): SpecSectionAction => ({ type: SpecSectionActionEnums.setActiveType, payload });
export const resetSpecSectionState = (): SpecSectionAction => ({ type: SpecSectionActionEnums.reset });

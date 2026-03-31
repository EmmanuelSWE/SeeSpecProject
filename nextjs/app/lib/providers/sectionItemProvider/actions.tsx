import type { ISectionItem } from "./context";

export enum SectionItemActionEnums {
  pending = "SECTION_ITEM_PENDING",
  getItemsSuccess = "GET_SECTION_ITEMS_SUCCESS",
  error = "SECTION_ITEM_ERROR",
  createItemSuccess = "CREATE_SECTION_ITEM_SUCCESS",
  updateItemSuccess = "UPDATE_SECTION_ITEM_SUCCESS",
  deleteItemSuccess = "DELETE_SECTION_ITEM_SUCCESS",
  reset = "RESET_SECTION_ITEM_STATE"
}

export type SectionItemAction =
  | { type: SectionItemActionEnums.pending }
  | { type: SectionItemActionEnums.getItemsSuccess; payload: ISectionItem[] }
  | { type: SectionItemActionEnums.error; payload: string }
  | { type: SectionItemActionEnums.createItemSuccess; payload: ISectionItem }
  | { type: SectionItemActionEnums.updateItemSuccess; payload: ISectionItem }
  | { type: SectionItemActionEnums.deleteItemSuccess; payload: string }
  | { type: SectionItemActionEnums.reset };

export const sectionItemPending = (): SectionItemAction => ({ type: SectionItemActionEnums.pending });
export const getSectionItemsSuccess = (payload: ISectionItem[]): SectionItemAction => ({ type: SectionItemActionEnums.getItemsSuccess, payload });
export const sectionItemError = (payload: string): SectionItemAction => ({ type: SectionItemActionEnums.error, payload });
export const createSectionItemSuccess = (payload: ISectionItem): SectionItemAction => ({ type: SectionItemActionEnums.createItemSuccess, payload });
export const updateSectionItemSuccess = (payload: ISectionItem): SectionItemAction => ({ type: SectionItemActionEnums.updateItemSuccess, payload });
export const deleteSectionItemSuccess = (payload: string): SectionItemAction => ({ type: SectionItemActionEnums.deleteItemSuccess, payload });
export const resetSectionItemState = (): SectionItemAction => ({ type: SectionItemActionEnums.reset });

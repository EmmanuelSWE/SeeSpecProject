import type { SectionItemDto } from "@/app/lib/utils/services/section-item-service";

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
  | { type: SectionItemActionEnums.getItemsSuccess; payload: SectionItemDto[] }
  | { type: SectionItemActionEnums.error; payload: string }
  | { type: SectionItemActionEnums.createItemSuccess; payload: SectionItemDto }
  | { type: SectionItemActionEnums.updateItemSuccess; payload: SectionItemDto }
  | { type: SectionItemActionEnums.deleteItemSuccess; payload: string }
  | { type: SectionItemActionEnums.reset };

export const sectionItemPending = (): SectionItemAction => ({ type: SectionItemActionEnums.pending });
export const getSectionItemsSuccess = (payload: SectionItemDto[]): SectionItemAction => ({ type: SectionItemActionEnums.getItemsSuccess, payload });
export const sectionItemError = (payload: string): SectionItemAction => ({ type: SectionItemActionEnums.error, payload });
export const createSectionItemSuccess = (payload: SectionItemDto): SectionItemAction => ({ type: SectionItemActionEnums.createItemSuccess, payload });
export const updateSectionItemSuccess = (payload: SectionItemDto): SectionItemAction => ({ type: SectionItemActionEnums.updateItemSuccess, payload });
export const deleteSectionItemSuccess = (payload: string): SectionItemAction => ({ type: SectionItemActionEnums.deleteItemSuccess, payload });
export const resetSectionItemState = (): SectionItemAction => ({ type: SectionItemActionEnums.reset });

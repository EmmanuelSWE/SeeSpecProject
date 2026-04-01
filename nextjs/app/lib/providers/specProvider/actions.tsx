import type { ISpec } from "./context";

export enum SpecActionEnums {
  pending = "SPEC_PENDING",
  getSpecSuccess = "GET_SPEC_SUCCESS",
  getSpecsSuccess = "GET_SPECS_SUCCESS",
  error = "SPEC_ERROR",
  createSpecSuccess = "CREATE_SPEC_SUCCESS",
  updateSpecSuccess = "UPDATE_SPEC_SUCCESS",
  setActiveSpec = "SET_ACTIVE_SPEC",
  reset = "RESET_SPEC_STATE"
}

export type SpecAction =
  | { type: SpecActionEnums.pending }
  | { type: SpecActionEnums.getSpecSuccess; payload: ISpec | null }
  | { type: SpecActionEnums.getSpecsSuccess; payload: ISpec[] }
  | { type: SpecActionEnums.error; payload: string }
  | { type: SpecActionEnums.createSpecSuccess; payload: ISpec }
  | { type: SpecActionEnums.updateSpecSuccess; payload: ISpec }
  | { type: SpecActionEnums.setActiveSpec; payload: ISpec | null }
  | { type: SpecActionEnums.reset };

export const specPending = (): SpecAction => ({ type: SpecActionEnums.pending });
export const getSpecSuccess = (payload: ISpec | null): SpecAction => ({ type: SpecActionEnums.getSpecSuccess, payload });
export const getSpecsSuccess = (payload: ISpec[]): SpecAction => ({ type: SpecActionEnums.getSpecsSuccess, payload });
export const specError = (payload: string): SpecAction => ({ type: SpecActionEnums.error, payload });
export const createSpecSuccess = (payload: ISpec): SpecAction => ({ type: SpecActionEnums.createSpecSuccess, payload });
export const updateSpecSuccess = (payload: ISpec): SpecAction => ({ type: SpecActionEnums.updateSpecSuccess, payload });
export const setActiveSpec = (payload: ISpec | null): SpecAction => ({ type: SpecActionEnums.setActiveSpec, payload });
export const resetSpecState = (): SpecAction => ({ type: SpecActionEnums.reset });

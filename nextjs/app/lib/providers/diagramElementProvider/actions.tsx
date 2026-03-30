import type { DiagramElementDto, DiagramElementType } from "@/app/lib/utils/services/diagram-element-service";

export enum DiagramElementActionEnums {
  pending = "DIAGRAM_ELEMENT_PENDING",
  getDiagramElementSuccess = "GET_DIAGRAM_ELEMENT_SUCCESS",
  getDiagramElementsSuccess = "GET_DIAGRAM_ELEMENTS_SUCCESS",
  error = "DIAGRAM_ELEMENT_ERROR",
  createDiagramElementSuccess = "CREATE_DIAGRAM_ELEMENT_SUCCESS",
  updateDiagramElementSuccess = "UPDATE_DIAGRAM_ELEMENT_SUCCESS",
  deleteDiagramElementSuccess = "DELETE_DIAGRAM_ELEMENT_SUCCESS",
  setActiveDiagramElement = "SET_ACTIVE_DIAGRAM_ELEMENT",
  setActiveDiagramElementType = "SET_ACTIVE_DIAGRAM_ELEMENT_TYPE",
  reset = "RESET_DIAGRAM_ELEMENT_STATE"
}

export type DiagramElementAction =
  | { type: DiagramElementActionEnums.pending }
  | { type: DiagramElementActionEnums.getDiagramElementSuccess; payload: DiagramElementDto | null }
  | { type: DiagramElementActionEnums.getDiagramElementsSuccess; payload: DiagramElementDto[] }
  | { type: DiagramElementActionEnums.error; payload: string }
  | { type: DiagramElementActionEnums.createDiagramElementSuccess; payload: DiagramElementDto }
  | { type: DiagramElementActionEnums.updateDiagramElementSuccess; payload: DiagramElementDto }
  | { type: DiagramElementActionEnums.deleteDiagramElementSuccess; payload: string }
  | { type: DiagramElementActionEnums.setActiveDiagramElement; payload: DiagramElementDto | null }
  | { type: DiagramElementActionEnums.setActiveDiagramElementType; payload: DiagramElementType | null }
  | { type: DiagramElementActionEnums.reset };

export const diagramElementPending = (): DiagramElementAction => ({ type: DiagramElementActionEnums.pending });
export const getDiagramElementSuccess = (payload: DiagramElementDto | null): DiagramElementAction => ({ type: DiagramElementActionEnums.getDiagramElementSuccess, payload });
export const getDiagramElementsSuccess = (payload: DiagramElementDto[]): DiagramElementAction => ({ type: DiagramElementActionEnums.getDiagramElementsSuccess, payload });
export const diagramElementError = (payload: string): DiagramElementAction => ({ type: DiagramElementActionEnums.error, payload });
export const createDiagramElementSuccess = (payload: DiagramElementDto): DiagramElementAction => ({ type: DiagramElementActionEnums.createDiagramElementSuccess, payload });
export const updateDiagramElementSuccess = (payload: DiagramElementDto): DiagramElementAction => ({ type: DiagramElementActionEnums.updateDiagramElementSuccess, payload });
export const deleteDiagramElementSuccess = (payload: string): DiagramElementAction => ({ type: DiagramElementActionEnums.deleteDiagramElementSuccess, payload });
export const setActiveDiagramElement = (payload: DiagramElementDto | null): DiagramElementAction => ({ type: DiagramElementActionEnums.setActiveDiagramElement, payload });
export const setActiveDiagramElementType = (payload: DiagramElementType | null): DiagramElementAction => ({ type: DiagramElementActionEnums.setActiveDiagramElementType, payload });
export const resetDiagramElementState = (): DiagramElementAction => ({ type: DiagramElementActionEnums.reset });

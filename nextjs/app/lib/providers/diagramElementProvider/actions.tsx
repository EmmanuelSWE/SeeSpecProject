import type {
  DiagramEditorMode,
  DiagramElementDto,
  DiagramElementType,
  DiagramGraphDto,
  DiagramValidationResultDto,
  RenderedDiagramDto
} from "@/app/lib/utils/services/diagram-element-service";
import type { DiagramInlineEditorState, DiagramSelection } from "./context";

export enum DiagramElementActionEnums {
  pending = "DIAGRAM_ELEMENT_PENDING",
  renderPending = "DIAGRAM_ELEMENT_RENDER_PENDING",
  getDiagramElementSuccess = "GET_DIAGRAM_ELEMENT_SUCCESS",
  getDiagramElementsSuccess = "GET_DIAGRAM_ELEMENTS_SUCCESS",
  getGraphSuccess = "GET_DIAGRAM_GRAPH_SUCCESS",
  renderSuccess = "RENDER_DIAGRAM_SUCCESS",
  error = "DIAGRAM_ELEMENT_ERROR",
  createDiagramElementSuccess = "CREATE_DIAGRAM_ELEMENT_SUCCESS",
  updateDiagramElementSuccess = "UPDATE_DIAGRAM_ELEMENT_SUCCESS",
  deleteDiagramElementSuccess = "DELETE_DIAGRAM_ELEMENT_SUCCESS",
  setActiveDiagramElement = "SET_ACTIVE_DIAGRAM_ELEMENT",
  setActiveDiagramElementType = "SET_ACTIVE_DIAGRAM_ELEMENT_TYPE",
  setEditorMode = "SET_EDITOR_MODE",
  setSelection = "SET_SELECTION",
  openInlineEditor = "OPEN_INLINE_EDITOR",
  closeInlineEditor = "CLOSE_INLINE_EDITOR",
  reset = "RESET_DIAGRAM_ELEMENT_STATE"
}

export type DiagramElementAction =
  | { type: DiagramElementActionEnums.pending }
  | { type: DiagramElementActionEnums.renderPending }
  | { type: DiagramElementActionEnums.getDiagramElementSuccess; payload: DiagramElementDto | null }
  | { type: DiagramElementActionEnums.getDiagramElementsSuccess; payload: DiagramElementDto[] }
  | { type: DiagramElementActionEnums.getGraphSuccess; payload: { graph: DiagramGraphDto; validation: DiagramValidationResultDto } }
  | { type: DiagramElementActionEnums.renderSuccess; payload: RenderedDiagramDto }
  | { type: DiagramElementActionEnums.error; payload: string }
  | { type: DiagramElementActionEnums.createDiagramElementSuccess; payload: DiagramElementDto }
  | { type: DiagramElementActionEnums.updateDiagramElementSuccess; payload: DiagramElementDto }
  | { type: DiagramElementActionEnums.deleteDiagramElementSuccess; payload: string }
  | { type: DiagramElementActionEnums.setActiveDiagramElement; payload: DiagramElementDto | null }
  | { type: DiagramElementActionEnums.setActiveDiagramElementType; payload: DiagramElementType | null }
  | { type: DiagramElementActionEnums.setEditorMode; payload: DiagramEditorMode }
  | { type: DiagramElementActionEnums.setSelection; payload: DiagramSelection }
  | { type: DiagramElementActionEnums.openInlineEditor; payload: Omit<DiagramInlineEditorState, "isOpen"> }
  | { type: DiagramElementActionEnums.closeInlineEditor }
  | { type: DiagramElementActionEnums.reset };

export const diagramElementPending = (): DiagramElementAction => ({ type: DiagramElementActionEnums.pending });
export const diagramElementRenderPending = (): DiagramElementAction => ({ type: DiagramElementActionEnums.renderPending });
export const getDiagramElementSuccess = (payload: DiagramElementDto | null): DiagramElementAction => ({ type: DiagramElementActionEnums.getDiagramElementSuccess, payload });
export const getDiagramElementsSuccess = (payload: DiagramElementDto[]): DiagramElementAction => ({ type: DiagramElementActionEnums.getDiagramElementsSuccess, payload });
export const getDiagramGraphSuccess = (graph: DiagramGraphDto, validation: DiagramValidationResultDto): DiagramElementAction => ({
  type: DiagramElementActionEnums.getGraphSuccess,
  payload: { graph, validation }
});
export const getRenderedDiagramSuccess = (payload: RenderedDiagramDto): DiagramElementAction => ({ type: DiagramElementActionEnums.renderSuccess, payload });
export const diagramElementError = (payload: string): DiagramElementAction => ({ type: DiagramElementActionEnums.error, payload });
export const createDiagramElementSuccess = (payload: DiagramElementDto): DiagramElementAction => ({ type: DiagramElementActionEnums.createDiagramElementSuccess, payload });
export const updateDiagramElementSuccess = (payload: DiagramElementDto): DiagramElementAction => ({ type: DiagramElementActionEnums.updateDiagramElementSuccess, payload });
export const deleteDiagramElementSuccess = (payload: string): DiagramElementAction => ({ type: DiagramElementActionEnums.deleteDiagramElementSuccess, payload });
export const setActiveDiagramElement = (payload: DiagramElementDto | null): DiagramElementAction => ({ type: DiagramElementActionEnums.setActiveDiagramElement, payload });
export const setActiveDiagramElementType = (payload: DiagramElementType | null): DiagramElementAction => ({ type: DiagramElementActionEnums.setActiveDiagramElementType, payload });
export const setDiagramEditorMode = (payload: DiagramEditorMode): DiagramElementAction => ({ type: DiagramElementActionEnums.setEditorMode, payload });
export const setDiagramSelection = (payload: DiagramSelection): DiagramElementAction => ({ type: DiagramElementActionEnums.setSelection, payload });
export const openDiagramInlineEditor = (payload: Omit<DiagramInlineEditorState, "isOpen">): DiagramElementAction => ({ type: DiagramElementActionEnums.openInlineEditor, payload });
export const closeDiagramInlineEditor = (): DiagramElementAction => ({ type: DiagramElementActionEnums.closeInlineEditor });
export const resetDiagramElementState = (): DiagramElementAction => ({ type: DiagramElementActionEnums.reset });

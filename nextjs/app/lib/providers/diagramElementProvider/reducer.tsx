import { INITIAL_STATE, type IDiagramElementStateContext } from "./context";
import { DiagramElementActionEnums, type DiagramElementAction } from "./actions";

function upsertDiagramCollection(
  stateElements: IDiagramElementStateContext["diagramElements"],
  nextElement: NonNullable<IDiagramElementStateContext["diagramElement"]>
) {
  const existingIndex = stateElements.findIndex((diagramElement) => diagramElement.id === nextElement.id);
  if (existingIndex === -1) {
    return [...stateElements, nextElement];
  }

  return stateElements.map((diagramElement) =>
    diagramElement.id === nextElement.id ? nextElement : diagramElement
  );
}

export function DiagramElementReducer(
  state: IDiagramElementStateContext = INITIAL_STATE,
  action: DiagramElementAction
): IDiagramElementStateContext {
  switch (action.type) {
    case DiagramElementActionEnums.pending:
      return {
        ...state,
        isPending: true,
        isSuccess: false,
        isError: false,
        errorMessage: null
      };
    case DiagramElementActionEnums.renderPending:
      return {
        ...state,
        isRendering: true,
        isError: false,
        errorMessage: null
      };
    case DiagramElementActionEnums.getDiagramElementSuccess:
      return {
        ...state,
        isPending: false,
        isSuccess: true,
        isError: false,
        errorMessage: null,
        diagramElement: action.payload
      };
    case DiagramElementActionEnums.getDiagramElementsSuccess:
      return {
        ...state,
        isPending: false,
        isSuccess: true,
        isError: false,
        errorMessage: null,
        diagramElements: action.payload
      };
    case DiagramElementActionEnums.getGraphSuccess:
      return {
        ...state,
        isPending: false,
        isSuccess: true,
        isError: false,
        errorMessage: null,
        graph: action.payload.graph,
        validation: action.payload.validation
      };
    case DiagramElementActionEnums.renderSuccess:
      return {
        ...state,
        isRendering: false,
        isSuccess: true,
        isError: false,
        errorMessage: null,
        renderedDiagram: action.payload
      };
    case DiagramElementActionEnums.error:
      return {
        ...state,
        isPending: false,
        isRendering: false,
        isSuccess: false,
        isError: true,
        errorMessage: action.payload
      };
    case DiagramElementActionEnums.createDiagramElementSuccess:
      return {
        ...state,
        isPending: false,
        isSuccess: true,
        isError: false,
        errorMessage: null,
        diagramElement: action.payload,
        diagramElements: upsertDiagramCollection(state.diagramElements, action.payload)
      };
    case DiagramElementActionEnums.updateDiagramElementSuccess:
      return {
        ...state,
        isPending: false,
        isSuccess: true,
        isError: false,
        errorMessage: null,
        diagramElement: action.payload,
        diagramElements: upsertDiagramCollection(state.diagramElements, action.payload)
      };
    case DiagramElementActionEnums.deleteDiagramElementSuccess:
      return {
        ...state,
        isPending: false,
        isSuccess: true,
        isError: false,
        errorMessage: null,
        diagramElement: state.diagramElement?.id === action.payload ? null : state.diagramElement,
        diagramElements: state.diagramElements.filter((diagramElement) => diagramElement.id !== action.payload)
      };
    case DiagramElementActionEnums.setActiveDiagramElement:
      return {
        ...state,
        diagramElement: action.payload
      };
    case DiagramElementActionEnums.setActiveDiagramElementType:
      return {
        ...state,
        activeType: action.payload
      };
    case DiagramElementActionEnums.setEditorMode:
      return {
        ...state,
        editorMode: action.payload
      };
    case DiagramElementActionEnums.setSelection:
      return {
        ...state,
        selection: action.payload
      };
    case DiagramElementActionEnums.openInlineEditor:
      return {
        ...state,
        inlineEditor: {
          ...action.payload,
          isOpen: true
        }
      };
    case DiagramElementActionEnums.closeInlineEditor:
      return {
        ...state,
        inlineEditor: {
          ...state.inlineEditor,
          isOpen: false,
          value: "",
          targetKind: null,
          targetId: null
        }
      };
    case DiagramElementActionEnums.reset:
      return { ...INITIAL_STATE };
    default:
      return state;
  }
}

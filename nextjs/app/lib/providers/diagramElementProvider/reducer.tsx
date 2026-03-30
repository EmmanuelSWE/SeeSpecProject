import { INITIAL_STATE, type IDiagramElementStateContext } from "./context";
import { DiagramElementActionEnums, type DiagramElementAction } from "./actions";

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
    case DiagramElementActionEnums.error:
      return {
        ...state,
        isPending: false,
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
        diagramElements: [...state.diagramElements, action.payload]
      };
    case DiagramElementActionEnums.updateDiagramElementSuccess:
      return {
        ...state,
        isPending: false,
        isSuccess: true,
        isError: false,
        errorMessage: null,
        diagramElement: action.payload,
        diagramElements: state.diagramElements.map((diagramElement) =>
          diagramElement.id === action.payload.id ? action.payload : diagramElement
        )
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
    case DiagramElementActionEnums.reset:
      return { ...INITIAL_STATE };
    default:
      return state;
  }
}

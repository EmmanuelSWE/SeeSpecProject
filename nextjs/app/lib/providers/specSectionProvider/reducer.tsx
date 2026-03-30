import { INITIAL_STATE, type ISpecSectionStateContext } from "./context";
import { SpecSectionActionEnums, type SpecSectionAction } from "./actions";

export function SpecSectionReducer(
  state: ISpecSectionStateContext = INITIAL_STATE,
  action: SpecSectionAction
): ISpecSectionStateContext {
  switch (action.type) {
    case SpecSectionActionEnums.pending:
      return {
        ...state,
        isPending: true,
        isSuccess: false,
        isError: false,
        errorMessage: null
      };
    case SpecSectionActionEnums.getSectionSuccess:
      return {
        ...state,
        isPending: false,
        isSuccess: true,
        isError: false,
        errorMessage: null,
        section: action.payload
      };
    case SpecSectionActionEnums.getSectionsSuccess:
      return {
        ...state,
        isPending: false,
        isSuccess: true,
        isError: false,
        errorMessage: null,
        sections: action.payload
      };
    case SpecSectionActionEnums.error:
      return {
        ...state,
        isPending: false,
        isSuccess: false,
        isError: true,
        errorMessage: action.payload
      };
    case SpecSectionActionEnums.createSectionSuccess:
      return {
        ...state,
        isPending: false,
        isSuccess: true,
        isError: false,
        errorMessage: null,
        section: action.payload,
        sections: [...state.sections, action.payload]
      };
    case SpecSectionActionEnums.updateSectionSuccess:
      return {
        ...state,
        isPending: false,
        isSuccess: true,
        isError: false,
        errorMessage: null,
        section: action.payload,
        sections: state.sections.map((section) => (section.id === action.payload.id ? action.payload : section))
      };
    case SpecSectionActionEnums.deleteSectionSuccess:
      return {
        ...state,
        isPending: false,
        isSuccess: true,
        isError: false,
        errorMessage: null,
        section: state.section?.id === action.payload ? null : state.section,
        sections: state.sections.filter((section) => section.id !== action.payload)
      };
    case SpecSectionActionEnums.setActiveSection:
      return {
        ...state,
        section: action.payload
      };
    case SpecSectionActionEnums.setActiveType:
      return {
        ...state,
        activeType: action.payload
      };
    case SpecSectionActionEnums.reset:
      return { ...INITIAL_STATE };
    default:
      return state;
  }
}

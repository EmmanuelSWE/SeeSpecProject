import { SpecActionEnums, type SpecAction } from "./actions";
import { INITIAL_STATE, type ISpecStateContext } from "./context";

function upsertSpecCollection(stateSpecs: ISpecStateContext["specs"], nextSpec: NonNullable<ISpecStateContext["spec"]>) {
  const existingIndex = stateSpecs.findIndex((spec) => spec.id === nextSpec.id);
  if (existingIndex === -1) {
    return [...stateSpecs, nextSpec];
  }

  return stateSpecs.map((spec) => (spec.id === nextSpec.id ? nextSpec : spec));
}

export function SpecReducer(
  state: ISpecStateContext = INITIAL_STATE,
  action: SpecAction
): ISpecStateContext {
  switch (action.type) {
    case SpecActionEnums.pending:
      return {
        ...state,
        isPending: true,
        isSuccess: false,
        isError: false,
        errorMessage: null
      };
    case SpecActionEnums.getSpecSuccess:
      return {
        ...state,
        isPending: false,
        isSuccess: true,
        isError: false,
        errorMessage: null,
        spec: action.payload
      };
    case SpecActionEnums.getSpecsSuccess:
      return {
        ...state,
        isPending: false,
        isSuccess: true,
        isError: false,
        errorMessage: null,
        specs: action.payload
      };
    case SpecActionEnums.error:
      return {
        ...state,
        isPending: false,
        isSuccess: false,
        isError: true,
        errorMessage: action.payload
      };
    case SpecActionEnums.createSpecSuccess:
    case SpecActionEnums.updateSpecSuccess:
      return {
        ...state,
        isPending: false,
        isSuccess: true,
        isError: false,
        errorMessage: null,
        spec: action.payload,
        specs: upsertSpecCollection(state.specs, action.payload)
      };
    case SpecActionEnums.setActiveSpec:
      return {
        ...state,
        spec: action.payload
      };
    case SpecActionEnums.reset:
      return { ...INITIAL_STATE };
    default:
      return state;
  }
}

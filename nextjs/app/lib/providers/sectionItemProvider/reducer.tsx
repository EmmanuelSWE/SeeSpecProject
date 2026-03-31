import { type SectionItemAction, SectionItemActionEnums } from "./actions";
import { INITIAL_STATE, type ISectionItemStateContext } from "./context";

function upsertSectionItems(
  stateItems: ISectionItemStateContext["items"],
  nextItem: ISectionItemStateContext["items"][number]
) {
  const existingIndex = stateItems.findIndex((item) => item.id === nextItem.id);
  if (existingIndex === -1) {
    return [...stateItems, nextItem];
  }

  return stateItems.map((item) => (item.id === nextItem.id ? nextItem : item));
}

export function SectionItemReducer(
  state: ISectionItemStateContext = INITIAL_STATE,
  action: SectionItemAction
): ISectionItemStateContext {
  switch (action.type) {
    case SectionItemActionEnums.pending:
      return {
        ...state,
        isPending: true,
        isSuccess: false,
        isError: false,
        errorMessage: null
      };
    case SectionItemActionEnums.getItemsSuccess:
      return {
        ...state,
        isPending: false,
        isSuccess: true,
        isError: false,
        errorMessage: null,
        items: action.payload
      };
    case SectionItemActionEnums.error:
      return {
        ...state,
        isPending: false,
        isSuccess: false,
        isError: true,
        errorMessage: action.payload
      };
    case SectionItemActionEnums.createItemSuccess:
    case SectionItemActionEnums.updateItemSuccess:
      return {
        ...state,
        isPending: false,
        isSuccess: true,
        isError: false,
        errorMessage: null,
        items: upsertSectionItems(state.items, action.payload)
      };
    case SectionItemActionEnums.deleteItemSuccess:
      return {
        ...state,
        isPending: false,
        isSuccess: true,
        isError: false,
        errorMessage: null,
        items: state.items.filter((item) => item.id !== action.payload)
      };
    case SectionItemActionEnums.reset:
      return { ...INITIAL_STATE };
    default:
      return state;
  }
}

"use client";

import { useCallback, useContext, useMemo, useReducer } from "react";
import {
  applyDiagramSemanticAction,
  createDiagramElement,
  deleteDiagramElement,
  getDiagramElementById,
  getDiagramElements,
  getDiagramElementsByBackend,
  getDiagramElementsByBackendAndType,
  getDiagramElementsByType,
  getDiagramGraph,
  renderDiagramSvg,
  type ApplyDiagramSemanticActionInput,
  type CreateDiagramElementInput,
  type DiagramEditorMode,
  type DiagramElementDto,
  type DiagramElementType,
  type DiagramGraphDto,
  type RenderedDiagramDto,
  updateDiagramElement,
  type UpdateDiagramElementInput
} from "@/app/lib/utils/services/diagram-element-service";
import {
  closeDiagramInlineEditor,
  createDiagramElementSuccess,
  deleteDiagramElementSuccess,
  diagramElementError,
  diagramElementPending,
  diagramElementRenderPending,
  getDiagramElementSuccess,
  getDiagramElementsSuccess,
  getDiagramGraphSuccess,
  getRenderedDiagramSuccess,
  openDiagramInlineEditor,
  resetDiagramElementState,
  setActiveDiagramElement,
  setActiveDiagramElementType,
  setDiagramEditorMode,
  setDiagramSelection,
  updateDiagramElementSuccess
} from "./actions";
import {
  DiagramElementActionContext,
  DiagramElementStateContext,
  INITIAL_STATE,
  type DiagramInlineEditorState,
  type DiagramSelection
} from "./context";
import { DiagramElementReducer } from "./reducer";

export function DiagramElementProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(DiagramElementReducer, INITIAL_STATE);

  const getDiagramElement = useCallback(async (id: string) => {
    dispatch(diagramElementPending());
    try {
      const diagramElement = await getDiagramElementById(id);
      dispatch(getDiagramElementSuccess(diagramElement));
      return diagramElement;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load diagram element.";
      dispatch(diagramElementError(message));
      throw error;
    }
  }, []);

  const getAllDiagramElements = useCallback(async () => {
    dispatch(diagramElementPending());
    try {
      const diagramElements = await getDiagramElements();
      dispatch(getDiagramElementsSuccess(diagramElements));
      return diagramElements;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load diagram elements.";
      dispatch(diagramElementError(message));
      throw error;
    }
  }, []);

  const getBackendDiagramElements = useCallback(async (backendId: string) => {
    dispatch(diagramElementPending());
    try {
      const diagramElements = await getDiagramElementsByBackend(backendId);
      dispatch(getDiagramElementsSuccess(diagramElements));
      return diagramElements;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load diagram elements.";
      dispatch(diagramElementError(message));
      throw error;
    }
  }, []);

  const getTypedDiagramElements = useCallback(async (type: DiagramElementType) => {
    dispatch(diagramElementPending());
    try {
      const diagramElements = await getDiagramElementsByType(type);
      dispatch(getDiagramElementsSuccess(diagramElements));
      dispatch(setActiveDiagramElementType(type));
      return diagramElements;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load diagram elements.";
      dispatch(diagramElementError(message));
      throw error;
    }
  }, []);

  const getBackendTypedDiagramElements = useCallback(async (backendId: string, type: DiagramElementType) => {
    dispatch(diagramElementPending());
    try {
      const diagramElements = await getDiagramElementsByBackendAndType(backendId, type);
      dispatch(getDiagramElementsSuccess(diagramElements));
      dispatch(setActiveDiagramElementType(type));
      return diagramElements;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load diagram elements.";
      dispatch(diagramElementError(message));
      throw error;
    }
  }, []);

  const getGraph = useCallback(async (diagramElementId: string) => {
    dispatch(diagramElementPending());
    try {
      const graph = await getDiagramGraph(diagramElementId);
      dispatch(getDiagramGraphSuccess(graph, graph.validation));
      return graph;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load diagram graph.";
      dispatch(diagramElementError(message));
      throw error;
    }
  }, []);

  const applyAction = useCallback(async (payload: ApplyDiagramSemanticActionInput): Promise<DiagramGraphDto> => {
    dispatch(diagramElementPending());
    try {
      const result = await applyDiagramSemanticAction(payload);
      dispatch(getDiagramGraphSuccess(result.graph, result.validation));
      return result.graph;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to apply diagram action.";
      dispatch(diagramElementError(message));
      throw error;
    }
  }, []);

  const renderSvg = useCallback(async (diagramElementId: string, includePlantUmlText = false): Promise<RenderedDiagramDto> => {
    dispatch(diagramElementRenderPending());
    try {
      const render = await renderDiagramSvg(diagramElementId, includePlantUmlText);
      dispatch(getRenderedDiagramSuccess(render));
      return render;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to render diagram.";
      dispatch(diagramElementError(message));
      throw error;
    }
  }, []);

  const createElement = useCallback(async (payload: CreateDiagramElementInput) => {
    dispatch(diagramElementPending());
    try {
      const diagramElement = await createDiagramElement(payload);
      dispatch(createDiagramElementSuccess(diagramElement));
      return diagramElement;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create diagram element.";
      dispatch(diagramElementError(message));
      throw error;
    }
  }, []);

  const updateElement = useCallback(async (payload: UpdateDiagramElementInput) => {
    dispatch(diagramElementPending());
    try {
      const diagramElement = await updateDiagramElement(payload);
      dispatch(updateDiagramElementSuccess(diagramElement));
      return diagramElement;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update diagram element.";
      dispatch(diagramElementError(message));
      throw error;
    }
  }, []);

  const removeElement = useCallback(async (id: string) => {
    dispatch(diagramElementPending());
    try {
      await deleteDiagramElement(id);
      dispatch(deleteDiagramElementSuccess(id));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete diagram element.";
      dispatch(diagramElementError(message));
      throw error;
    }
  }, []);

  const setDiagramElement = useCallback((diagramElement: DiagramElementDto | null) => {
    dispatch(setActiveDiagramElement(diagramElement));
  }, []);

  const setType = useCallback((type: DiagramElementType | null) => {
    dispatch(setActiveDiagramElementType(type));
  }, []);

  const setMode = useCallback((mode: DiagramEditorMode) => {
    dispatch(setDiagramEditorMode(mode));
  }, []);

  const setSelection = useCallback((selection: DiagramSelection) => {
    dispatch(setDiagramSelection(selection));
  }, []);

  const openInlineEditor = useCallback((payload: Omit<DiagramInlineEditorState, "isOpen">) => {
    dispatch(openDiagramInlineEditor(payload));
  }, []);

  const closeInlineEditor = useCallback(() => {
    dispatch(closeDiagramInlineEditor());
  }, []);

  const reset = useCallback(() => {
    dispatch(resetDiagramElementState());
  }, []);

  const actions = useMemo(
    () => ({
      getDiagramElement,
      getDiagramElements: getAllDiagramElements,
      getDiagramElementsByBackend: getBackendDiagramElements,
      getDiagramElementsByType: getTypedDiagramElements,
      getDiagramElementsByBackendAndType: getBackendTypedDiagramElements,
      createDiagramElement: createElement,
      updateDiagramElement: updateElement,
      deleteDiagramElement: removeElement,
      getDiagramGraph: getGraph,
      applySemanticAction: applyAction,
      renderSvg,
      setActiveDiagramElement: setDiagramElement,
      setActiveType: setType,
      setEditorMode: setMode,
      setSelection,
      openInlineEditor,
      closeInlineEditor,
      reset
    }),
    [
      applyAction,
      createElement,
      getAllDiagramElements,
      getBackendDiagramElements,
      getBackendTypedDiagramElements,
      getDiagramElement,
      getGraph,
      getTypedDiagramElements,
      removeElement,
      renderSvg,
      reset,
      setDiagramElement,
      setMode,
      setSelection,
      setType,
      openInlineEditor,
      closeInlineEditor,
      updateElement
    ]
  );

  return (
    <DiagramElementStateContext.Provider value={state}>
      <DiagramElementActionContext.Provider value={actions}>{children}</DiagramElementActionContext.Provider>
    </DiagramElementStateContext.Provider>
  );
}

export function useDiagramElementState() {
  const context = useContext(DiagramElementStateContext);

  if (!context) {
    throw new Error("useDiagramElementState must be used within a DiagramElementProvider");
  }

  return context;
}

export function useDiagramElementActions() {
  const context = useContext(DiagramElementActionContext);

  if (!context) {
    throw new Error("useDiagramElementActions must be used within a DiagramElementProvider");
  }

  return context;
}

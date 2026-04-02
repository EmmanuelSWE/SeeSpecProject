"use client";

import {
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  useDiagramElementActions,
  useDiagramElementState
} from "@/app/lib/providers/diagramElementProvider";
import type {
  DiagramDirection,
  DiagramGraphDto,
  DiagramGraphNodeDto,
  DiagramSemanticTargetKind
} from "@/app/lib/utils/services/diagram-element-service";

type SemanticSvgDiagramEditorProps = {
  diagramElementId: string;
  title: string;
  defaultNodeType: string;
  allowMembers: boolean;
};

type ParsedSelectionTarget = {
  kind: DiagramSemanticTargetKind;
  id: string;
};

type DisplayedRender = {
  diagramElementId: string;
  svg: string;
  graphHash: string;
};

type DiagramScopedNodeSelection = {
  diagramElementId: string;
  nodeId: string;
};

type DiagramScopedMessage = {
  diagramElementId: string;
  message: string;
};

// Which input panel is visible in edit mode: keyboard controller or form
type InputPanelTab = "controller" | "form";

// Form state for the structured alternative input panel
type FormState = {
  nodeLabel: string;
  nodeType: string;
  memberSignature: string;
  memberKind: "property" | "function";
  edgeSourceId: string;
  edgeTargetId: string;
  edgeLabel: string;
  edgeType: string;
};

const EMPTY_FORM: FormState = {
  nodeLabel: "",
  nodeType: "",
  memberSignature: "",
  memberKind: "property",
  edgeSourceId: "",
  edgeTargetId: "",
  edgeLabel: "",
  edgeType: ""
};

const renderedDiagramCache = new Map<string, DisplayedRender>();

function parseSemanticTarget(value: string | null): ParsedSelectionTarget | null {
  if (!value || !value.startsWith("seespec://")) {
    return null;
  }

  const match = /^seespec:\/\/(node|edge|member)\/(.+)$/.exec(value);
  if (!match) {
    return null;
  }

  return {
    kind: match[1] as DiagramSemanticTargetKind,
    id: decodeURIComponent(match[2])
  };
}

function getHrefFromTarget(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) {
    return null;
  }

  const anchor = target.closest("a");
  if (!anchor) {
    return null;
  }

  return anchor.getAttribute("href") ?? anchor.getAttribute("xlink:href");
}

function getOrderedNodes(graph: DiagramGraphDto | null): DiagramGraphNodeDto[] {
  return [...(graph?.nodes ?? [])].sort(
    (left, right) => left.label.localeCompare(right.label) || left.id.localeCompare(right.id)
  );
}

function getDefaultEdgeType(diagramType: number) {
  if (diagramType === 2) {
    return "association";
  }

  if (diagramType === 3) {
    return "flow";
  }

  return "dependency";
}

function getRelationshipRequirementMessage(diagramType: number) {
  if (diagramType === 2) {
    return "Domain model travel needs an explicit relationship type before a new connection can be created.";
  }

  if (diagramType === 1) {
    return "Use case travel creates dependency links when no directed path exists yet.";
  }

  return "Activity travel creates flow links when no directed path exists yet.";
}

function getDirectionalTarget(
  graph: DiagramGraphDto,
  nodeId: string,
  direction: DiagramDirection
) {
  const edge =
    direction === "forward"
      ? graph.edges.find((item) => item.sourceNodeId === nodeId)
      : graph.edges.find((item) => item.targetNodeId === nodeId);

  if (!edge) {
    return null;
  }

  return {
    edge,
    nodeId: direction === "forward" ? edge.targetNodeId : edge.sourceNodeId
  };
}

function isTextEntryKey(event: KeyboardEvent<HTMLDivElement>) {
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
}

function focusScene(sceneElement: HTMLDivElement | null) {
  if (!sceneElement) {
    return;
  }

  window.requestAnimationFrame(() => {
    sceneElement.focus();
  });
}

function annotateSemanticSvg(
  svg: string,
  selection: ParsedSelectionTarget | null,
  editingTarget: ParsedSelectionTarget | null,
  newlyCreatedNodeId: string | null
): string {
  if (typeof window === "undefined") {
    return svg;
  }

  const parser = new window.DOMParser();
  const documentNode = parser.parseFromString(svg, "image/svg+xml");

  documentNode.querySelectorAll("script, foreignObject").forEach((node) => node.remove());
  documentNode.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      if (/^on/i.test(attribute.name)) {
        node.removeAttribute(attribute.name);
      }
    });
  });

  documentNode.querySelectorAll("a").forEach((anchor) => {
    const href = anchor.getAttribute("href") ?? anchor.getAttribute("xlink:href");
    const target = parseSemanticTarget(href);
    if (!target) {
      return;
    }

    const classes = ["seespec-svg-target", `seespec-svg-target-${target.kind}`];
    if (selection && target.kind === selection.kind && target.id === selection.id) {
      classes.push("is-active");
    }
    if (editingTarget && target.kind === editingTarget.kind && target.id === editingTarget.id) {
      classes.push("is-editing");
    }
    if (target.kind === "node" && newlyCreatedNodeId && target.id === newlyCreatedNodeId) {
      classes.push("is-new");
    }

    anchor.setAttribute("class", classes.join(" "));
    anchor.querySelectorAll("rect, ellipse, polygon, path, line, circle, text").forEach((element) => {
      element.setAttribute("class", `${element.getAttribute("class") ?? ""} ${classes.join(" ")}`.trim());
    });
  });

  return documentNode.documentElement.outerHTML;
}

export function SemanticSvgDiagramEditor({
  diagramElementId,
  title,
  defaultNodeType,
  allowMembers
}: SemanticSvgDiagramEditorProps) {
  const {
    graph,
    renderedDiagram,
    validation,
    selection,
    inlineEditor,
    editorMode,
    isRendering
  } = useDiagramElementState();
  const {
    getDiagramGraph,
    applySemanticAction,
    renderSvg,
    setEditorMode,
    setSelection,
    openInlineEditor,
    closeInlineEditor
  } = useDiagramElementActions();

  const sceneRef = useRef<HTMLDivElement | null>(null);
  const lastRenderedHashRef = useRef<string | null>(null);
  const pendingRenderHashRef = useRef<string | null>(null);
  const [draftOverride, setDraftOverride] = useState<string | null>(null);
  const [newlyCreatedSelection, setNewlyCreatedSelection] = useState<DiagramScopedNodeSelection | null>(null);
  const [controllerMessageOverride, setControllerMessageOverride] = useState<DiagramScopedMessage | null>(null);
  // Which tab is active in the controls panel when in edit mode
  const [inputPanelTab, setInputPanelTab] = useState<InputPanelTab>("controller");
  // Form state for the structured input alternative
  const [formState, setFormState] = useState<FormState>(EMPTY_FORM);
  const [formMessage, setFormMessage] = useState<string>("");

  const toEditorMessage = useCallback((error: unknown, fallback: string) => {
    return error instanceof Error ? error.message : fallback;
  }, []);

  const orderedNodes = useMemo(() => getOrderedNodes(graph), [graph]);
  const selectedNode = useMemo(
    () => orderedNodes.find((node) => selection?.kind === "node" && node.id === selection.id) ?? null,
    [orderedNodes, selection]
  );
  const draftValue = draftOverride ?? inlineEditor.value;
  const newlyCreatedNodeId =
    newlyCreatedSelection?.diagramElementId === diagramElementId ? newlyCreatedSelection.nodeId : null;
  const displayedRender = useMemo(() => {
    if (renderedDiagram?.svg && graph && renderedDiagram.graphHash === graph.graphHash) {
      return {
        diagramElementId,
        svg: renderedDiagram.svg,
        graphHash: renderedDiagram.graphHash
      };
    }

    if (!graph) {
      return null;
    }

    const cachedRender = renderedDiagramCache.get(graph.graphHash);
    if (!cachedRender || cachedRender.diagramElementId !== diagramElementId) {
      return null;
    }

    return cachedRender;
  }, [diagramElementId, graph, renderedDiagram]);

  const controllerMessage = useMemo(() => {
    const currentOverride =
      controllerMessageOverride?.diagramElementId === diagramElementId
        ? controllerMessageOverride.message
        : null;
    if (currentOverride) {
      return currentOverride;
    }

    if (editorMode === "view") {
      return "Enable edit mode to begin controller-style semantic editing.";
    }

    if (inlineEditor.isOpen) {
      return inlineEditor.targetId
        ? "Step 2: typing for the selected semantic target."
        : "Step 2: typing a new semantic node.";
    }

    if (selection) {
      return `Step 1: current graph location is ${selection.kind} ${selection.id}.`;
    }

    return "Step 1: edit mode is active. Use Arrow to navigate or Ctrl + Arrow to travel/create.";
  }, [controllerMessageOverride, diagramElementId, editorMode, inlineEditor.isOpen, inlineEditor.targetId, selection]);

  const sanitizedSvg = useMemo(() => {
    if (!displayedRender || displayedRender.diagramElementId !== diagramElementId) {
      return "";
    }

    return annotateSemanticSvg(
      displayedRender.svg,
      selection,
      inlineEditor.targetKind && inlineEditor.targetId
        ? { kind: inlineEditor.targetKind, id: inlineEditor.targetId }
        : null,
      newlyCreatedNodeId
    );
  }, [diagramElementId, displayedRender, inlineEditor.targetId, inlineEditor.targetKind, newlyCreatedNodeId, selection]);

  useEffect(() => {
    getDiagramGraph(diagramElementId).catch((error) => {
      setControllerMessageOverride({
        diagramElementId,
        message: toEditorMessage(error, "Unable to load the diagram graph.")
      });
    });
  }, [diagramElementId, getDiagramGraph, toEditorMessage]);

  useEffect(() => {
    lastRenderedHashRef.current = null;
    pendingRenderHashRef.current = null;
  }, [diagramElementId]);

  useEffect(() => {
    if (editorMode !== "view") {
      focusScene(sceneRef.current);
    }
  }, [editorMode]);

  useEffect(() => {
    if (!selection || !graph) {
      return;
    }

    const selectionStillExists =
      (selection.kind === "node" && graph.nodes.some((node) => node.id === selection.id)) ||
      (selection.kind === "edge" && graph.edges.some((edge) => edge.id === selection.id)) ||
      (selection.kind === "member" &&
        graph.nodes.some((node) => node.members.some((member) => member.id === selection.id)));

    if (!selectionStillExists) {
      setSelection(null);
    }
  }, [graph, selection, setSelection]);

  useEffect(() => {
    if (!renderedDiagram?.svg || !graph || renderedDiagram.graphHash !== graph.graphHash) {
      return;
    }

    renderedDiagramCache.set(renderedDiagram.graphHash, {
      diagramElementId,
      svg: renderedDiagram.svg,
      graphHash: renderedDiagram.graphHash
    });
    lastRenderedHashRef.current = renderedDiagram.graphHash;
    pendingRenderHashRef.current = null;
  }, [diagramElementId, graph, renderedDiagram]);

  useEffect(() => {
    if (!graph || !graph.validation.isValid) {
      return;
    }

    const cachedRender = renderedDiagramCache.get(graph.graphHash);
    if (cachedRender && cachedRender.diagramElementId === diagramElementId) {
      lastRenderedHashRef.current = cachedRender.graphHash;
      return;
    }

    if (graph.graphHash === lastRenderedHashRef.current || graph.graphHash === pendingRenderHashRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      pendingRenderHashRef.current = graph.graphHash;
      renderSvg(diagramElementId)
        .then((result) => {
          lastRenderedHashRef.current = result.graphHash;
          renderedDiagramCache.set(result.graphHash, {
            diagramElementId,
            svg: result.svg,
            graphHash: result.graphHash
          });
        })
        .catch((error) => {
          pendingRenderHashRef.current = null;
          setControllerMessageOverride({
            diagramElementId,
            message: toEditorMessage(error, "Unable to render the latest diagram state.")
          });
        });
    }, 200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [diagramElementId, graph, renderSvg, toEditorMessage]);

  const openFormTab = useCallback(() => {
    if (selectedNode) {
      setFormState((prev) => ({
        ...prev,
        nodeLabel: selectedNode.label,
        nodeType: selectedNode.nodeType ?? ""
      }));
    }

    setInputPanelTab("form");
  }, [selectedNode]);

  const commitInlineEdit = useCallback(async (memberCommit: boolean) => {
    if (!inlineEditor.targetKind) {
      return;
    }

    try {
      if (inlineEditor.targetKind === "node" && inlineEditor.targetId && !memberCommit) {
        await applySemanticAction({
          diagramElementId,
          actionType: "update",
          targetKind: "node",
          targetId: inlineEditor.targetId,
          value: draftValue,
          nodeType: selectedNode?.nodeType ?? defaultNodeType
        });
        setSelection({ kind: "node", id: inlineEditor.targetId });
        setNewlyCreatedSelection(null);
        setDraftOverride(null);
        closeInlineEditor();
        setEditorMode("navigate");
        return;
      }

      if (inlineEditor.targetKind === "node" && inlineEditor.targetId && memberCommit && allowMembers) {
        await applySemanticAction({
          diagramElementId,
          actionType: "create",
          targetKind: "member",
          targetId: inlineEditor.targetId,
          value: draftValue,
          memberKind: "function"
        });
        setSelection({ kind: "node", id: inlineEditor.targetId });
        setNewlyCreatedSelection(null);
        setDraftOverride(null);
        closeInlineEditor();
        setEditorMode("navigate");
        return;
      }

      if (inlineEditor.targetKind === "edge" && inlineEditor.targetId) {
        await applySemanticAction({
          diagramElementId,
          actionType: "update",
          targetKind: "edge",
          targetId: inlineEditor.targetId,
          value: draftValue
        });
        setSelection({ kind: "edge", id: inlineEditor.targetId });
        setNewlyCreatedSelection(null);
        setDraftOverride(null);
        closeInlineEditor();
        setEditorMode("navigate");
        return;
      }

      if (inlineEditor.targetKind === "member" && inlineEditor.targetId && selection?.kind === "node") {
        await applySemanticAction({
          diagramElementId,
          actionType: "update",
          targetKind: "member",
          targetId: selection.id,
          relatedId: inlineEditor.targetId,
          value: draftValue,
          memberKind: memberCommit ? "function" : "property"
        });
        setSelection({ kind: "node", id: selection.id });
        setNewlyCreatedSelection(null);
        setDraftOverride(null);
        closeInlineEditor();
        setEditorMode("navigate");
      }
    } catch (error) {
      setControllerMessageOverride({
        diagramElementId,
        message: toEditorMessage(error, "Unable to commit the semantic change.")
      });
    }
  }, [
    allowMembers,
    applySemanticAction,
    closeInlineEditor,
    defaultNodeType,
    diagramElementId,
    draftValue,
    inlineEditor.targetId,
    inlineEditor.targetKind,
    selectedNode,
    selection,
    setEditorMode,
    setSelection,
    toEditorMessage
  ]);

  const handleSceneClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (editorMode === "view") {
        event.preventDefault();
        setControllerMessageOverride({
          diagramElementId,
          message: "Use the Edit button above the diagram before interacting with the semantic graph."
        });
        return;
      }

      const href = getHrefFromTarget(event.target);
      const target = parseSemanticTarget(href);

      if (!target) {
        setSelection(null);
        setControllerMessageOverride({
          diagramElementId,
          message: "No semantic target selected. Press Enter to create a node."
        });
        return;
      }

      event.preventDefault();
      focusScene(sceneRef.current);
      setSelection(target);
      setNewlyCreatedSelection(null);
      setControllerMessageOverride({
        diagramElementId,
        message: `Selected ${target.kind}. Press Enter to type or Ctrl + Arrow to travel.`
      });
    },
    [diagramElementId, editorMode, setSelection]
  );

  const handleCreateNode = useCallback(async () => {
    if (editorMode === "view") {
      setControllerMessageOverride({
        diagramElementId,
        message: "Use Edit diagram before creating semantic nodes."
      });
      return;
    }

    if (!inlineEditor.isOpen || inlineEditor.targetId !== null) {
      return;
    }

    try {
      const createdGraph = await applySemanticAction({
        diagramElementId,
        actionType: "create",
        targetKind: "node",
        value: draftValue,
        nodeType: defaultNodeType
      });
      const nextNode = createdGraph.nodes[createdGraph.nodes.length - 1] ?? null;
      closeInlineEditor();
      setDraftOverride(null);
      if (nextNode) {
        setSelection({ kind: "node", id: nextNode.id });
        setNewlyCreatedSelection({ diagramElementId, nodeId: nextNode.id });
        setControllerMessageOverride({
          diagramElementId,
          message: `Created node ${nextNode.label}. Controller focus stays here.`
        });
      }
      setEditorMode("navigate");
    } catch (error) {
      setControllerMessageOverride({
        diagramElementId,
        message: toEditorMessage(error, "Unable to create the semantic node.")
      });
    }
  }, [
    applySemanticAction,
    closeInlineEditor,
    defaultNodeType,
    diagramElementId,
    draftValue,
    editorMode,
    inlineEditor.isOpen,
    inlineEditor.targetId,
    setEditorMode,
    setSelection,
    toEditorMessage
  ]);

  const handleControllerTravel = useCallback(
    async (direction: DiagramDirection) => {
      if (!graph || selection?.kind !== "node") {
        setControllerMessageOverride({
          diagramElementId,
          message: "Select a node before using controller travel."
        });
        return;
      }

      const currentTarget = getDirectionalTarget(graph, selection.id, direction);
      if (currentTarget) {
        setSelection({ kind: "node", id: currentTarget.nodeId });
        setNewlyCreatedSelection(null);
        setEditorMode("navigate");
        setControllerMessageOverride({
          diagramElementId,
          message: `Moved ${direction} along the directed graph to ${currentTarget.nodeId}.`
        });
        return;
      }

      if (graph.diagramType === 2) {
        setControllerMessageOverride({
          diagramElementId,
          message: getRelationshipRequirementMessage(graph.diagramType)
        });
        return;
      }

      try {
        const createdGraph = await applySemanticAction({
          diagramElementId,
          actionType: "create",
          targetKind: "node",
          value: direction === "forward" ? "New step" : "New prerequisite",
          nodeType: defaultNodeType
        });
        const createdNode = createdGraph.nodes[createdGraph.nodes.length - 1] ?? null;
        if (!createdNode) {
          return;
        }

        await applySemanticAction({
          diagramElementId,
          actionType: "create",
          targetKind: "edge",
          targetId: direction === "forward" ? selection.id : createdNode.id,
          relatedId: direction === "forward" ? createdNode.id : selection.id,
          edgeType: getDefaultEdgeType(graph.diagramType),
          value: ""
        });
        await renderSvg(diagramElementId);
        setSelection({ kind: "node", id: createdNode.id });
        setNewlyCreatedSelection({ diagramElementId, nodeId: createdNode.id });
        setEditorMode("navigate");
        setControllerMessageOverride({
          diagramElementId,
          message: `${getRelationshipRequirementMessage(graph.diagramType)} Created and linked ${createdNode.label}.`
        });
      } catch (error) {
        setControllerMessageOverride({
          diagramElementId,
          message: toEditorMessage(error, "Unable to travel or create in that direction.")
        });
      }
    },
    [applySemanticAction, defaultNodeType, diagramElementId, graph, renderSvg, selection, setEditorMode, setSelection, toEditorMessage]
  );

  const handleKeyDown = useCallback(
    async (event: KeyboardEvent<HTMLDivElement>) => {
      if (!graph) {
        return;
      }

      if (editorMode === "view") {
        if (event.key === "Enter") {
          event.preventDefault();
          setEditorMode("edit");
          setControllerMessageOverride({
            diagramElementId,
            message: "Edit mode enabled. Select a node and press Enter to type."
          });
        }
        return;
      }

      if (event.key === "Escape") {
        setDraftOverride(null);
        closeInlineEditor();
        setEditorMode("view");
        setNewlyCreatedSelection(null);
        setControllerMessageOverride({
          diagramElementId,
          message: "Edit mode closed."
        });
        return;
      }

      if (inlineEditor.isOpen && event.key === "Backspace") {
        event.preventDefault();
        setDraftOverride((currentValue) => {
          const nextValue = currentValue ?? inlineEditor.value;
          return nextValue.slice(0, Math.max(nextValue.length - 1, 0));
        });
        return;
      }

      if (inlineEditor.isOpen && isTextEntryKey(event)) {
        event.preventDefault();
        setDraftOverride((currentValue) => `${currentValue ?? inlineEditor.value}${event.key}`);
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (graph.validation.isValid) {
          try {
            pendingRenderHashRef.current = graph.graphHash;
            await renderSvg(diagramElementId);
            setControllerMessageOverride({
              diagramElementId,
              message: "Validated and refreshed the current semantic graph."
            });
          } catch (error) {
            setControllerMessageOverride({
              diagramElementId,
              message: toEditorMessage(error, "Unable to validate and refresh the current diagram.")
            });
          }
        }
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        if (inlineEditor.isOpen) {
          if (inlineEditor.targetId === null) {
            await handleCreateNode();
            return;
          }

          await commitInlineEdit(Boolean(event.ctrlKey || event.metaKey));
          return;
        }

        if (selection?.kind === "node") {
          const node = graph.nodes.find((item) => item.id === selection.id);
          if (!node) {
            return;
          }

          openInlineEditor({
            x: 0,
            y: 0,
            value: node.label,
            targetKind: "node",
            targetId: node.id
          });
          setDraftOverride(null);
          setEditorMode("edit");
          setControllerMessageOverride({
            diagramElementId,
            message: `Typing on ${node.label}. Enter commits, Escape cancels.`
          });
          return;
        }

        if (selection === null) {
          openInlineEditor({
            x: 0,
            y: 0,
            value: "",
            targetKind: "node",
            targetId: null
          });
          setDraftOverride(null);
          setEditorMode("edit");
          setControllerMessageOverride({
            diagramElementId,
            message: "Typing a new semantic node."
          });
        }
        return;
      }

      const currentIndex = orderedNodes.findIndex((node) => node.id === selection?.id);
      if (event.key.startsWith("Arrow")) {
        event.preventDefault();

        if (event.altKey && selection?.kind === "node") {
          const edge = graph.edges.find(
            (item) => item.sourceNodeId === selection.id || item.targetNodeId === selection.id
          );
          if (edge) {
            setSelection({ kind: "edge", id: edge.id });
            setEditorMode("navigate");
            setControllerMessageOverride({
              diagramElementId,
              message: `Selected connected edge ${edge.id}.`
            });
          }
          return;
        }

        if ((event.ctrlKey || event.metaKey) && selection?.kind === "node") {
          if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
            await handleControllerTravel("backward");
            return;
          }

          if (event.key === "ArrowDown" || event.key === "ArrowRight") {
            await handleControllerTravel("forward");
            return;
          }
        }

        if (orderedNodes.length === 0) {
          return;
        }

        const delta = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
        const nextIndex =
          currentIndex >= 0
            ? (currentIndex + delta + orderedNodes.length) % orderedNodes.length
            : 0;
        const nextNode = orderedNodes[nextIndex];

        if (nextNode) {
          setSelection({ kind: "node", id: nextNode.id });
          setEditorMode("navigate");
          setControllerMessageOverride({
            diagramElementId,
            message: `Moved focus to ${nextNode.label}.`
          });
        }
      }
    },
    [
      closeInlineEditor,
      commitInlineEdit,
      diagramElementId,
      editorMode,
      graph,
      handleControllerTravel,
      handleCreateNode,
      inlineEditor.isOpen,
      inlineEditor.value,
      inlineEditor.targetId,
      openInlineEditor,
      orderedNodes,
      renderSvg,
      selection,
      setEditorMode,
      setSelection,
      toEditorMessage
    ]
  );

  // ─── Form panel handlers ────────────────────────────────────────────────────

  const handleFormCreateNode = useCallback(async () => {
    const label = formState.nodeLabel.trim();
    if (!label) {
      setFormMessage("Enter a node label before creating.");
      return;
    }
    try {
      const createdGraph = await applySemanticAction({
        diagramElementId,
        actionType: "create",
        targetKind: "node",
        value: label,
        nodeType: formState.nodeType.trim() || defaultNodeType
      });
      const nextNode = createdGraph.nodes[createdGraph.nodes.length - 1] ?? null;
      if (nextNode) {
        setSelection({ kind: "node", id: nextNode.id });
        setNewlyCreatedSelection({ diagramElementId, nodeId: nextNode.id });
      }
      setFormState((prev) => ({ ...prev, nodeLabel: "", nodeType: "" }));
      setFormMessage(`Created node "${label}".`);
    } catch (error) {
      setFormMessage(toEditorMessage(error, "Failed to create node."));
    }
  }, [applySemanticAction, defaultNodeType, diagramElementId, formState.nodeLabel, formState.nodeType, setSelection, toEditorMessage]);

  const handleFormUpdateNode = useCallback(async () => {
    if (!selectedNode) {
      setFormMessage("Select a node in the diagram first.");
      return;
    }
    const label = formState.nodeLabel.trim();
    if (!label) {
      setFormMessage("Enter a new label before updating.");
      return;
    }
    try {
      await applySemanticAction({
        diagramElementId,
        actionType: "update",
        targetKind: "node",
        targetId: selectedNode.id,
        value: label,
        nodeType: formState.nodeType.trim() || selectedNode.nodeType
      });
      setFormMessage(`Updated node to "${label}".`);
    } catch (error) {
      setFormMessage(toEditorMessage(error, "Failed to update node."));
    }
  }, [applySemanticAction, diagramElementId, formState.nodeLabel, formState.nodeType, selectedNode, toEditorMessage]);

  const handleFormDeleteNode = useCallback(async () => {
    if (!selectedNode) {
      setFormMessage("Select a node in the diagram first.");
      return;
    }
    try {
      await applySemanticAction({
        diagramElementId,
        actionType: "delete",
        targetKind: "node",
        targetId: selectedNode.id
      });
      setSelection(null);
      setFormState(EMPTY_FORM);
      setFormMessage(`Deleted node "${selectedNode.label}".`);
    } catch (error) {
      setFormMessage(toEditorMessage(error, "Failed to delete node."));
    }
  }, [applySemanticAction, diagramElementId, selectedNode, setSelection, toEditorMessage]);

  const handleFormAddMember = useCallback(async () => {
    if (!selectedNode) {
      setFormMessage("Select a node in the diagram first.");
      return;
    }
    const sig = formState.memberSignature.trim();
    if (!sig) {
      setFormMessage("Enter a member signature before adding.");
      return;
    }
    try {
      await applySemanticAction({
        diagramElementId,
        actionType: "create",
        targetKind: "member",
        targetId: selectedNode.id,
        value: sig,
        memberKind: formState.memberKind
      });
      setFormState((prev) => ({ ...prev, memberSignature: "" }));
      setFormMessage(`Added ${formState.memberKind} "${sig}" to ${selectedNode.label}.`);
    } catch (error) {
      setFormMessage(toEditorMessage(error, "Failed to add member."));
    }
  }, [applySemanticAction, diagramElementId, formState.memberKind, formState.memberSignature, selectedNode, toEditorMessage]);

  const handleFormCreateEdge = useCallback(async () => {
    const sourceId = formState.edgeSourceId.trim();
    const targetId = formState.edgeTargetId.trim();
    if (!sourceId || !targetId) {
      setFormMessage("Select a source and target node ID before creating an edge.");
      return;
    }
    try {
      await applySemanticAction({
        diagramElementId,
        actionType: "create",
        targetKind: "edge",
        targetId: sourceId,
        relatedId: targetId,
        edgeType: formState.edgeType.trim() || (graph ? getDefaultEdgeType(graph.diagramType) : "association"),
        value: formState.edgeLabel.trim()
      });
      setFormState((prev) => ({ ...prev, edgeSourceId: "", edgeTargetId: "", edgeLabel: "", edgeType: "" }));
      setFormMessage("Edge created.");
    } catch (error) {
      setFormMessage(toEditorMessage(error, "Failed to create edge."));
    }
  }, [applySemanticAction, diagramElementId, formState.edgeLabel, formState.edgeSourceId, formState.edgeTargetId, formState.edgeType, graph, toEditorMessage]);

  const handleFormSave = useCallback(async () => {
    if (!graph?.validation.isValid) {
      setFormMessage("Fix validation errors before saving.");
      return;
    }
    try {
      pendingRenderHashRef.current = graph.graphHash;
      await renderSvg(diagramElementId);
      setFormMessage("Saved and rendered the diagram.");
    } catch (error) {
      setFormMessage(toEditorMessage(error, "Failed to save diagram."));
    }
  }, [diagramElementId, graph, renderSvg, toEditorMessage]);

  // ─── Enter / exit edit mode (shared by both tabs) ───────────────────────────

  const handleEnterEditMode = useCallback(() => {
    const initialNode =
      (selection?.kind === "node"
        ? orderedNodes.find((node) => node.id === selection.id) ?? null
        : null) ?? orderedNodes[0] ?? null;

    if (initialNode) {
      setSelection({ kind: "node", id: initialNode.id });
      openInlineEditor({
        x: 0,
        y: 0,
        value: initialNode.label,
        targetKind: "node",
        targetId: initialNode.id
      });
      setDraftOverride(initialNode.label);
      setFormState((prev) => ({ ...prev, nodeLabel: initialNode.label, nodeType: initialNode.nodeType ?? "" }));
    } else {
      setSelection(null);
      openInlineEditor({ x: 0, y: 0, value: "", targetKind: "node", targetId: null });
      setDraftOverride("");
    }

    setEditorMode("edit");
    setControllerMessageOverride({
      diagramElementId,
      message: initialNode
        ? `Edit mode enabled. ${initialNode.label} is open for editing.`
        : "Edit mode enabled. Type a label to create the first semantic node."
    });

    if (!sanitizedSvg && graph?.validation.isValid) {
      void renderSvg(diagramElementId).catch((error) => {
        setControllerMessageOverride({
          diagramElementId,
          message: toEditorMessage(error, "Unable to render the current diagram state.")
        });
      });
    }

    focusScene(sceneRef.current);
  }, [
    diagramElementId,
    graph,
    openInlineEditor,
    orderedNodes,
    renderSvg,
    sanitizedSvg,
    selection,
    setEditorMode,
    setSelection,
    toEditorMessage
  ]);

  const handleExitEditMode = useCallback(() => {
    closeInlineEditor();
    setDraftOverride(null);
    setEditorMode("view");
    setControllerMessageOverride({ diagramElementId, message: "Edit mode closed." });
  }, [closeInlineEditor, diagramElementId, setEditorMode]);

  const isEditMode = editorMode !== "view";

  return (
    <div className="semantic-diagram-shell">
      {/* ── Controls panel ─────────────────────────────────────────────────── */}
      <div className="semantic-diagram-controls semantic-diagram-panel">
        <div className="semantic-diagram-controls-header">
          <div>
            <span className="requirements-eyebrow">Controls</span>
            <h3>{title}</h3>
          </div>

          <div className="semantic-diagram-toolbar">
            {/* FIX: Two separate buttons — one always visible for each state.
                The original single button with a toggled CSS class caused it
                to visually disappear because "is-active-editor-button" blended
                into the panel background. Now both states are explicit. */}
            {isEditMode ? (
              <button
                type="button"
                className="requirements-action-button semantic-diagram-exit-button"
                onClick={handleExitEditMode}
              >
                Exit edit mode
              </button>
            ) : (
              <button
                type="button"
                className="requirements-action-button"
                onClick={handleEnterEditMode}
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {/* ── Tab switcher — only shown in edit mode ──────────────────────── */}
        {isEditMode && (
          <div className="semantic-diagram-tab-row" role="tablist" aria-label="Input method">
            <button
              role="tab"
              type="button"
              aria-selected={inputPanelTab === "controller"}
              className={`semantic-diagram-tab ${inputPanelTab === "controller" ? "is-active" : ""}`}
              onClick={() => setInputPanelTab("controller")}
            >
              Controller
            </button>
            <button
              role="tab"
              type="button"
              aria-selected={inputPanelTab === "form"}
              className={`semantic-diagram-tab ${inputPanelTab === "form" ? "is-active" : ""}`}
              onClick={openFormTab}
            >
              Form
            </button>
          </div>
        )}

        {/* ── Controller tab ──────────────────────────────────────────────── */}
        {(!isEditMode || inputPanelTab === "controller") && (
          <>
            {/* FIX: Instructions are always rendered as a visible section in
                edit mode — not inside a <details> that can be collapsed and
                forgotten. In view mode they stay collapsible to save space. */}
            {isEditMode ? (
              <div className="semantic-diagram-instructions semantic-diagram-instructions--always-open">
                <p className="semantic-diagram-instructions-heading">Keyboard shortcuts</p>
                <ul className="semantic-diagram-help-list">
                  <li><kbd>Arrow</kbd> Navigate selection</li>
                  <li><kbd>Ctrl</kbd> + <kbd>Arrow</kbd> Travel edges or create in direction</li>
                  <li><kbd>Alt</kbd> + <kbd>Arrow</kbd> Select relationships</li>
                  <li><kbd>Enter</kbd> Open or commit typing</li>
                  <li><kbd>Ctrl</kbd> + <kbd>Enter</kbd> Commit method/function</li>
                  <li><kbd>Ctrl</kbd> + <kbd>S</kbd> Validate and save</li>
                  <li><kbd>Esc</kbd> Cancel and exit edit mode</li>
                </ul>
              </div>
            ) : (
              <details className="semantic-diagram-instructions">
                <summary>Instructions</summary>
                <ul className="semantic-diagram-help-list">
                  <li>Edit - enable controller mode</li>
                  <li>Arrow keys - navigate selection</li>
                  <li>Ctrl + Arrow - travel directed edges or create in direction</li>
                  <li>Alt + Arrow - select relationships</li>
                  <li>Enter - open or commit typing</li>
                  <li>Ctrl + Enter - commit method/function</li>
                  <li>Ctrl + S - validate and save</li>
                  <li>Escape - cancel and exit edit mode</li>
                </ul>
              </details>
            )}

            <div className="semantic-diagram-status-area" aria-live="polite">
              <span className="semantic-diagram-indicator-label">
                {inlineEditor.isOpen
                  ? inlineEditor.targetId
                    ? "Editing target"
                    : "Creating node"
                  : selection
                    ? `Selected ${selection.kind}`
                    : "Controller ready"}
              </span>
              <strong>{controllerMessage}</strong>
              <p>
                {inlineEditor.isOpen
                  ? draftValue || "Type to define the semantic change"
                  : "Use the Edit button to enter semantic command mode."}
              </p>
            </div>
          </>
        )}

        {/* ── Form tab ────────────────────────────────────────────────────── */}
        {isEditMode && inputPanelTab === "form" && (
          <div className="semantic-diagram-form-panel">
            {formMessage && (
              <p className="semantic-diagram-form-message" aria-live="polite">
                {formMessage}
              </p>
            )}

            {/* Node section */}
            <section className="semantic-diagram-form-section">
              <h4 className="semantic-diagram-form-section-title">Node</h4>

              {selectedNode && (
                <p className="semantic-diagram-form-context">
                  Selected: <strong>{selectedNode.label}</strong>
                  <span className="semantic-diagram-form-context-type"> ({selectedNode.nodeType})</span>
                </p>
              )}

              <label className="semantic-diagram-form-field">
                <span>Label</span>
                <input
                  type="text"
                  value={formState.nodeLabel}
                  placeholder="e.g. Place Order"
                  onChange={(e) => setFormState((prev) => ({ ...prev, nodeLabel: e.target.value }))}
                />
              </label>

              <label className="semantic-diagram-form-field">
                <span>Type</span>
                <input
                  type="text"
                  value={formState.nodeType}
                  placeholder={defaultNodeType}
                  onChange={(e) => setFormState((prev) => ({ ...prev, nodeType: e.target.value }))}
                />
              </label>

              <div className="semantic-diagram-form-actions">
                <button
                  type="button"
                  className="semantic-diagram-form-button semantic-diagram-form-button--primary"
                  onClick={handleFormCreateNode}
                >
                  Create node
                </button>
                {selectedNode && (
                  <>
                    <button
                      type="button"
                      className="semantic-diagram-form-button"
                      onClick={handleFormUpdateNode}
                    >
                      Update selected
                    </button>
                    <button
                      type="button"
                      className="semantic-diagram-form-button semantic-diagram-form-button--danger"
                      onClick={handleFormDeleteNode}
                    >
                      Delete selected
                    </button>
                  </>
                )}
              </div>
            </section>

            {/* Member section — only for diagram types that allow members */}
            {allowMembers && (
              <section className="semantic-diagram-form-section">
                <h4 className="semantic-diagram-form-section-title">Member</h4>
                <p className="semantic-diagram-form-hint">
                  {selectedNode
                    ? `Adding member to "${selectedNode.label}"`
                    : "Select a node in the diagram first."}
                </p>

                <label className="semantic-diagram-form-field">
                  <span>Signature</span>
                  <input
                    type="text"
                    value={formState.memberSignature}
                    placeholder="e.g. orderId: string"
                    onChange={(e) => setFormState((prev) => ({ ...prev, memberSignature: e.target.value }))}
                  />
                </label>

                <label className="semantic-diagram-form-field">
                  <span>Kind</span>
                  <select
                    value={formState.memberKind}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        memberKind: e.target.value as "property" | "function"
                      }))
                    }
                  >
                    <option value="property">Property</option>
                    <option value="function">Function</option>
                  </select>
                </label>

                <div className="semantic-diagram-form-actions">
                  <button
                    type="button"
                    className="semantic-diagram-form-button semantic-diagram-form-button--primary"
                    onClick={handleFormAddMember}
                    disabled={!selectedNode}
                  >
                    Add member
                  </button>
                </div>
              </section>
            )}

            {/* Edge section */}
            <section className="semantic-diagram-form-section">
              <h4 className="semantic-diagram-form-section-title">Edge</h4>

              <label className="semantic-diagram-form-field">
                <span>Source node</span>
                <select
                  value={formState.edgeSourceId}
                  onChange={(e) => setFormState((prev) => ({ ...prev, edgeSourceId: e.target.value }))}
                >
                  <option value="">— select source —</option>
                  {orderedNodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="semantic-diagram-form-field">
                <span>Target node</span>
                <select
                  value={formState.edgeTargetId}
                  onChange={(e) => setFormState((prev) => ({ ...prev, edgeTargetId: e.target.value }))}
                >
                  <option value="">— select target —</option>
                  {orderedNodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="semantic-diagram-form-field">
                <span>Label</span>
                <input
                  type="text"
                  value={formState.edgeLabel}
                  placeholder="e.g. triggers"
                  onChange={(e) => setFormState((prev) => ({ ...prev, edgeLabel: e.target.value }))}
                />
              </label>

              <label className="semantic-diagram-form-field">
                <span>Type</span>
                <input
                  type="text"
                  value={formState.edgeType}
                  placeholder={graph ? getDefaultEdgeType(graph.diagramType) : "association"}
                  onChange={(e) => setFormState((prev) => ({ ...prev, edgeType: e.target.value }))}
                />
              </label>

              <div className="semantic-diagram-form-actions">
                <button
                  type="button"
                  className="semantic-diagram-form-button semantic-diagram-form-button--primary"
                  onClick={handleFormCreateEdge}
                >
                  Create edge
                </button>
              </div>
            </section>

            {/* Save */}
            <section className="semantic-diagram-form-section">
              <div className="semantic-diagram-form-actions">
                <button
                  type="button"
                  className="semantic-diagram-form-button semantic-diagram-form-button--save"
                  onClick={handleFormSave}
                  disabled={!graph?.validation.isValid}
                >
                  Save &amp; render
                </button>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* ── Scene ──────────────────────────────────────────────────────────── */}
      <div
        ref={sceneRef}
        className="semantic-diagram-scene semantic-diagram-panel"
        onClick={handleSceneClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="application"
        aria-label={title}
      >
        {inlineEditor.isOpen ? (
          <div className="semantic-inline-editor" role="dialog" aria-label="Semantic inline editor">
            <p className="semantic-inline-editor-hint">
              {inlineEditor.targetId === null
                ? "Type a label for the new semantic node."
                : `Editing ${inlineEditor.targetKind} ${inlineEditor.targetId}.`}
            </p>
            <label className="semantic-inline-editor-label">
              <span>Label</span>
              <input
                type="text"
                value={draftValue}
                onChange={(event) => {
                  setDraftOverride(event.target.value);
                }}
                autoFocus
              />
            </label>
          </div>
        ) : null}

        {sanitizedSvg ? (
          <div className="semantic-diagram-svg" dangerouslySetInnerHTML={{ __html: sanitizedSvg }} />
        ) : (
          <div className="semantic-diagram-empty">
            <strong>{editorMode === "view" ? "No rendered diagram yet." : "Edit mode is active."}</strong>
            <p>
              {isRendering
                ? "Rendering the latest valid graph..."
                : inlineEditor.isOpen
                  ? inlineEditor.targetId === null
                    ? "Type a label in the editor above to create the first semantic node."
                    : "Update the selected semantic target in the editor above, then press Enter to commit."
                  : editorMode === "view"
                    ? "Enable edit mode, then press Enter to create a semantic node."
                    : "Select a node or press Enter to begin typing a semantic change."}
            </p>
            {graph?.nodes.length ? (
              <div className="badge-row">
                {graph.nodes
                  .slice()
                  .sort((left, right) => left.label.localeCompare(right.label) || left.id.localeCompare(right.id))
                  .map((node) => (
                    <span key={node.id} className="badge">
                      {node.label}
                    </span>
                  ))}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* ── Status bar ─────────────────────────────────────────────────────── */}
      <div className="semantic-diagram-status">
        <div className="badge-row">
          <span className="badge">Mode: {editorMode}</span>
          <span className="badge">Selection: {selection ? `${selection.kind}:${selection.id}` : "none"}</span>
          <span className="badge">Graph: {graph?.graphHash ?? "pending"}</span>
        </div>
        {!validation?.isValid && validation?.errors.length ? (
          <div className="semantic-diagram-errors">
            {validation.errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

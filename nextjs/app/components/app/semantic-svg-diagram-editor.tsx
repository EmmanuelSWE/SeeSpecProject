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
  const [draftValue, setDraftValue] = useState("");
  const [displayedRender, setDisplayedRender] = useState<DisplayedRender | null>(null);
  const [newlyCreatedNodeId, setNewlyCreatedNodeId] = useState<string | null>(null);
  const [controllerMessage, setControllerMessage] = useState(
    "Enable edit mode to begin controller-style semantic editing."
  );

  const toEditorMessage = useCallback((error: unknown, fallback: string) => {
    return error instanceof Error ? error.message : fallback;
  }, []);

  const orderedNodes = useMemo(() => getOrderedNodes(graph), [graph]);
  const selectedNode = useMemo(
    () => orderedNodes.find((node) => selection?.kind === "node" && node.id === selection.id) ?? null,
    [orderedNodes, selection]
  );
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
    getDiagramGraph(diagramElementId).catch(() => {});
  }, [diagramElementId, getDiagramGraph]);

  useEffect(() => {
    lastRenderedHashRef.current = null;
    pendingRenderHashRef.current = null;
    setDisplayedRender(null);
    setNewlyCreatedNodeId(null);
  }, [diagramElementId]);

  useEffect(() => {
    setDraftValue(inlineEditor.value);
  }, [inlineEditor.value, inlineEditor.targetId]);

  useEffect(() => {
    if (editorMode === "view") {
      setControllerMessage("Enable edit mode to begin controller-style semantic editing.");
      return;
    }

    if (inlineEditor.isOpen) {
      setControllerMessage(inlineEditor.targetId ? "Step 2: typing for the selected semantic target." : "Step 2: typing a new semantic node.");
      return;
    }

    if (selection) {
      setControllerMessage(`Step 1: current graph location is ${selection.kind} ${selection.id}.`);
      return;
    }

    setControllerMessage("Step 1: edit mode is active. Use Arrow to navigate or Ctrl + Arrow to travel/create.");
  }, [editorMode, inlineEditor.isOpen, inlineEditor.targetId, selection]);

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

    setDisplayedRender({
      diagramElementId,
      svg: renderedDiagram.svg,
      graphHash: renderedDiagram.graphHash
    });
    renderedDiagramCache.set(renderedDiagram.graphHash, {
      diagramElementId,
      svg: renderedDiagram.svg,
      graphHash: renderedDiagram.graphHash
    });
    pendingRenderHashRef.current = null;
  }, [diagramElementId, graph, renderedDiagram]);

  useEffect(() => {
    if (!graph || !graph.validation.isValid) {
      return;
    }

    const cachedRender = renderedDiagramCache.get(graph.graphHash);
    if (cachedRender && cachedRender.diagramElementId === diagramElementId) {
      lastRenderedHashRef.current = cachedRender.graphHash;
      setDisplayedRender(cachedRender);
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
        .catch(() => {});
    }, 200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [diagramElementId, graph, renderSvg]);

  const commitInlineEdit = useCallback(
    async (memberCommit: boolean) => {
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
          setNewlyCreatedNodeId(null);
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
          setNewlyCreatedNodeId(null);
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
          setNewlyCreatedNodeId(null);
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
          setNewlyCreatedNodeId(null);
          closeInlineEditor();
          setEditorMode("navigate");
        }
      } catch (error) {
        setControllerMessage(toEditorMessage(error, "Unable to commit the semantic change."));
      }
    },
    [
      allowMembers,
      applySemanticAction,
      closeInlineEditor,
      defaultNodeType,
      diagramElementId,
      draftValue,
      inlineEditor.targetId,
      inlineEditor.targetKind,
      selectedNode?.nodeType,
      selection,
      setEditorMode,
      setSelection,
      toEditorMessage
    ]
  );

  const handleSceneClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (editorMode === "view") {
        event.preventDefault();
        setControllerMessage("Use the Edit button above the diagram before interacting with the semantic graph.");
        return;
      }

      const href = getHrefFromTarget(event.target);
      const target = parseSemanticTarget(href);

      if (!target) {
        setSelection(null);
        setControllerMessage("No semantic target selected. Press Enter to create a node.");
        return;
      }

      event.preventDefault();
      setSelection(target);
      setNewlyCreatedNodeId(null);
      setControllerMessage(`Selected ${target.kind}. Press Enter to type or Ctrl + Arrow to travel.`);
    },
    [editorMode, setSelection]
  );

  const handleCreateNode = useCallback(async () => {
    if (editorMode === "view") {
      setControllerMessage("Use Edit diagram before creating semantic nodes.");
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
      if (nextNode) {
        setSelection({ kind: "node", id: nextNode.id });
        setNewlyCreatedNodeId(nextNode.id);
        setControllerMessage(`Created node ${nextNode.label}. Controller focus stays here.`);
      }
      setEditorMode("navigate");
    } catch (error) {
      setControllerMessage(toEditorMessage(error, "Unable to create the semantic node."));
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
        setControllerMessage("Select a node before using controller travel.");
        return;
      }

      const currentTarget = getDirectionalTarget(graph, selection.id, direction);
      if (currentTarget) {
        setSelection({ kind: "node", id: currentTarget.nodeId });
        setNewlyCreatedNodeId(null);
        setEditorMode("navigate");
        setControllerMessage(`Moved ${direction} along the directed graph to ${currentTarget.nodeId}.`);
        return;
      }

      if (graph.diagramType === 2) {
        setControllerMessage(getRelationshipRequirementMessage(graph.diagramType));
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
        setNewlyCreatedNodeId(createdNode.id);
        setEditorMode("navigate");
        setControllerMessage(`${getRelationshipRequirementMessage(graph.diagramType)} Created and linked ${createdNode.label}.`);
      } catch (error) {
        setControllerMessage(toEditorMessage(error, "Unable to travel or create in that direction."));
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
          setControllerMessage("Edit mode enabled. Select a node and press Enter to type.");
        }
        return;
      }

      if (event.key === "Escape") {
        setDraftValue("");
        closeInlineEditor();
        setEditorMode("view");
        setNewlyCreatedNodeId(null);
        setControllerMessage("Edit mode closed.");
        return;
      }

      if (inlineEditor.isOpen && event.key === "Backspace") {
        event.preventDefault();
        setDraftValue((currentValue) => currentValue.slice(0, Math.max(currentValue.length - 1, 0)));
        return;
      }

      if (inlineEditor.isOpen && isTextEntryKey(event)) {
        event.preventDefault();
        setDraftValue((currentValue) => currentValue + event.key);
        return;
      }

        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
          event.preventDefault();
          if (graph.validation.isValid) {
            try {
              pendingRenderHashRef.current = graph.graphHash;
              await renderSvg(diagramElementId);
              setControllerMessage("Validated and refreshed the current semantic graph.");
            } catch (error) {
              setControllerMessage(toEditorMessage(error, "Unable to validate and refresh the current diagram."));
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
          setDraftValue(node.label);
          setEditorMode("edit");
          setControllerMessage(`Typing on ${node.label}. Enter commits, Escape cancels.`);
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
          setDraftValue("");
          setEditorMode("edit");
          setControllerMessage("Typing a new semantic node.");
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
            setControllerMessage(`Selected connected edge ${edge.id}.`);
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
          setControllerMessage(`Moved focus to ${nextNode.label}.`);
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
      inlineEditor.targetId,
      openInlineEditor,
      orderedNodes,
      renderSvg,
      selection,
      setEditorMode,
      setSelection
      ,
      toEditorMessage
    ]
  );

  return (
    <div className="semantic-diagram-shell">
      <div className="semantic-diagram-controls">
        <div>
          <span className="requirements-eyebrow">Controls</span>
          <h3>{title}</h3>
        </div>
        <div className="semantic-diagram-toolbar">
          <button
            type="button"
            className={`requirements-action-button ${editorMode === "view" ? "" : "is-active-editor-button"}`}
            onClick={() => {
              if (editorMode === "view") {
                setEditorMode("edit");
                setControllerMessage("Edit mode enabled. Select a node and press Enter to type.");
                return;
              }

              closeInlineEditor();
              setDraftValue("");
              setEditorMode("view");
              setControllerMessage("Edit mode closed.");
            }}
          >
            {editorMode === "view" ? "Edit" : "Exit edit mode"}
          </button>
        </div>
        <ul className="semantic-diagram-help-list">
          <li>Edit {"->"} enable controller mode</li>
          <li>Arrow keys {"->"} navigate selection</li>
          <li>Ctrl + Arrow {"->"} travel directed edges or create in direction</li>
          <li>Alt + Arrow {"->"} select relationships</li>
          <li>Enter {"->"} open or commit typing</li>
          <li>Ctrl + Enter {"->"} commit method/function</li>
          <li>Ctrl + S {"->"} validate and save</li>
          <li>Escape {"->"} cancel and exit edit mode</li>
        </ul>
      </div>

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
        <p>{inlineEditor.isOpen ? draftValue || "Type to define the semantic change" : "Use the Edit button to enter semantic command mode."}</p>
      </div>

      <div
        ref={sceneRef}
        className="semantic-diagram-scene"
        onClick={handleSceneClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={title}
      >
        {sanitizedSvg ? (
          // SVG is still a projection only; the backend-owned semantic graph remains the editable source of truth.
          <div className="semantic-diagram-svg" dangerouslySetInnerHTML={{ __html: sanitizedSvg }} />
        ) : (
          <div className="semantic-diagram-empty">
            <strong>No rendered diagram yet.</strong>
            <p>{isRendering ? "Rendering the latest valid graph..." : "Enable edit mode, then press Enter to create a semantic node."}</p>
          </div>
        )}
      </div>

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

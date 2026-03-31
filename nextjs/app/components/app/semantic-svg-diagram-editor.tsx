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

function sanitizeSvgMarkup(svg: string): string {
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

  return documentNode.documentElement.outerHTML;
}

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
  return [...(graph?.nodes ?? [])].sort((left, right) => left.label.localeCompare(right.label) || left.id.localeCompare(right.id));
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
  const [draftValue, setDraftValue] = useState("");

  const orderedNodes = useMemo(() => getOrderedNodes(graph), [graph]);
  const selectedNode = useMemo(
    () => orderedNodes.find((node) => selection?.kind === "node" && node.id === selection.id) ?? null,
    [orderedNodes, selection]
  );
  const sanitizedSvg = useMemo(
    () => (renderedDiagram?.svg ? sanitizeSvgMarkup(renderedDiagram.svg) : ""),
    [renderedDiagram?.svg]
  );

  useEffect(() => {
    getDiagramGraph(diagramElementId).catch(() => {});
  }, [diagramElementId, getDiagramGraph]);

  useEffect(() => {
    setDraftValue(inlineEditor.value);
  }, [inlineEditor.value, inlineEditor.targetId]);

  useEffect(() => {
    if (!graph || !graph.validation.isValid || graph.graphHash === lastRenderedHashRef.current) {
      return;
    }

    // Rendering is debounced so semantic edits can commit without causing backend churn on every key stroke.
    const timeoutId = window.setTimeout(() => {
      renderSvg(diagramElementId).then((result) => {
        lastRenderedHashRef.current = result.graphHash;
      }).catch(() => {});
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

      if (inlineEditor.targetKind === "node" && inlineEditor.targetId && !memberCommit) {
        await applySemanticAction({
          diagramElementId,
          actionType: "update",
          targetKind: "node",
          targetId: inlineEditor.targetId,
          value: draftValue,
          nodeType: selectedNode?.nodeType ?? defaultNodeType
        });
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
        closeInlineEditor();
        setEditorMode("navigate");
        return;
      }

      if (inlineEditor.targetKind === "member" && inlineEditor.targetId && selection?.kind === "node" && selection.id) {
        await applySemanticAction({
          diagramElementId,
          actionType: "update",
          targetKind: "member",
          targetId: selection.id,
          relatedId: inlineEditor.targetId,
          value: draftValue,
          memberKind: memberCommit ? "function" : "property"
        });
        closeInlineEditor();
        setEditorMode("navigate");
        return;
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
      setEditorMode
    ]
  );

  const handleSceneClick = useCallback(
    async (event: MouseEvent<HTMLDivElement>) => {
      const target = parseSemanticTarget(getHrefFromTarget(event.target));
      const sceneBounds = sceneRef.current?.getBoundingClientRect();
      const editorX = sceneBounds ? event.clientX - sceneBounds.left : event.clientX;
      const editorY = sceneBounds ? event.clientY - sceneBounds.top : event.clientY;

      if (target) {
        setSelection(target);
        setEditorMode("edit");
        const node = graph?.nodes.find((item) => item.id === target.id);
        openInlineEditor({
          x: editorX,
          y: editorY,
          value: node?.label ?? "",
          targetKind: target.kind,
          targetId: target.id
        });
        return;
      }

      setSelection(null);
      setEditorMode("edit");
      openInlineEditor({
        x: editorX,
        y: editorY,
        value: "",
        targetKind: "node",
        targetId: null
      });
    },
    [graph?.nodes, openInlineEditor, setEditorMode, setSelection]
  );

  const handleKeyDown = useCallback(
    async (event: KeyboardEvent<HTMLDivElement>) => {
      if (!graph) {
        return;
      }

      if (event.key === "Escape") {
        closeInlineEditor();
        setEditorMode("view");
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (graph.validation.isValid) {
          await renderSvg(diagramElementId);
        }
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        if (inlineEditor.isOpen) {
          await commitInlineEdit(Boolean(event.ctrlKey || event.metaKey));
          return;
        }

        if (selection?.kind === "node") {
          const node = graph.nodes.find((item) => item.id === selection.id);
          if (!node) {
            return;
          }

          openInlineEditor({
            x: 32,
            y: 32,
            value: node.label,
            targetKind: "node",
            targetId: node.id
          });
          setEditorMode("edit");
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
          }
          return;
        }

        if ((event.ctrlKey || event.metaKey) && selection?.kind === "node") {
          const delta = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
          const nextIndex =
            currentIndex >= 0
              ? (currentIndex + delta + orderedNodes.length) % orderedNodes.length
              : 0;
          const nextNode = orderedNodes[nextIndex];

          if (nextNode && nextNode.id !== selection.id) {
            const updatedGraph = await applySemanticAction({
              diagramElementId,
              actionType: "create",
              targetKind: "edge",
              targetId: selection.id,
              relatedId: nextNode.id,
              edgeType: graph.diagramType === 2 ? "association" : graph.diagramType === 3 ? "flow" : "dependency",
              value: ""
            });
            const nextEdge = [...updatedGraph.edges]
              .reverse()
              .find((edge) => edge.sourceNodeId === selection.id && edge.targetNodeId === nextNode.id);
            setSelection(nextEdge ? { kind: "edge", id: nextEdge.id } : { kind: "node", id: nextNode.id });
            setEditorMode("navigate");
          }
          return;
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
        }
      }
    },
    [
      applySemanticAction,
      closeInlineEditor,
      commitInlineEdit,
      diagramElementId,
      graph,
      inlineEditor.isOpen,
      openInlineEditor,
      orderedNodes,
      renderSvg,
      selection,
      setEditorMode,
      setSelection
    ]
  );

  const handleCreateNode = useCallback(async () => {
    if (!inlineEditor.isOpen || inlineEditor.targetId !== null) {
      return;
    }

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
    }
    setEditorMode("navigate");
  }, [applySemanticAction, closeInlineEditor, defaultNodeType, diagramElementId, draftValue, inlineEditor.isOpen, inlineEditor.targetId, setEditorMode, setSelection]);

  return (
    <div className="semantic-diagram-shell">
      <div className="semantic-diagram-controls">
        <div>
          <span className="requirements-eyebrow">Controls</span>
          <h3>{title}</h3>
        </div>
        <ul className="semantic-diagram-help-list">
          <li>Click SVG element {"->"} open edit block</li>
          <li>Arrow keys {"->"} navigate selection</li>
          <li>Ctrl + Arrow {"->"} create relationships</li>
          <li>Alt + Arrow {"->"} select relationships</li>
          <li>Enter {"->"} commit property or label</li>
          <li>Ctrl + Enter {"->"} commit method/function</li>
          <li>Ctrl + S {"->"} validate and save</li>
          <li>Escape {"->"} cancel edit mode</li>
        </ul>
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
          // SVG is projection-only; semantic state lives in the graph and is mutated through typed actions.
          <div className="semantic-diagram-svg" dangerouslySetInnerHTML={{ __html: sanitizedSvg }} />
        ) : (
          <div className="semantic-diagram-empty">
            <strong>No rendered diagram yet.</strong>
            <p>{isRendering ? "Rendering the latest valid graph..." : "Click the scene to create a semantic node."}</p>
          </div>
        )}

        {inlineEditor.isOpen ? (
          <div
            className="semantic-inline-editor"
            style={{
              left: `${inlineEditor.x}px`,
              top: `${inlineEditor.y}px`
            }}
          >
            <label className="semantic-inline-editor-label">
              <span>{inlineEditor.targetId ? "Edit target" : "Create node"}</span>
              <input
                value={draftValue}
                onChange={(event) => setDraftValue(event.target.value)}
                autoFocus
              />
            </label>
            <div className="semantic-inline-editor-actions">
              <button type="button" className="secondary-button small" onClick={() => closeInlineEditor()}>
                Cancel
              </button>
              <button
                type="button"
                className="primary-button small"
                onClick={() => {
                  if (inlineEditor.targetId === null) {
                    handleCreateNode().catch(() => {});
                    return;
                  }

                  commitInlineEdit(false).catch(() => {});
                }}
              >
                Save
              </button>
            </div>
          </div>
        ) : null}
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

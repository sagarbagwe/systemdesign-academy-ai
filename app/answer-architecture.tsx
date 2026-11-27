"use client";

import { Graph, layout, type EdgeLabel, type GraphLabel, type NodeLabel } from "@dagrejs/dagre";
import { CircleDot, Database, Layers3, Maximize2, Workflow } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { DesignConnection, DesignRecord, FlowStyle } from "./problems/types";

const flowLabels = {
  sync: "Request or data flow",
  async: "Asynchronous",
  reject: "Rejection or fallback",
} as const;

const componentIcons = {
  service: Layers3,
  storage: Database,
  queue: Workflow,
  outcome: CircleDot,
};

type ComponentKind = keyof typeof componentIcons;
type ComponentLayout = NodeLabel & { name: string; lines: string[]; notes: string[]; kind: ComponentKind };
type ConnectionLayout = EdgeLabel & { lines: string[]; style: FlowStyle; width: number; height: number };

function componentKind(name: string): ComponentKind {
  if (/^\d{3}\b|(?:response|rejection|rejected|error)$/i.test(name)) return "outcome";
  if (/(?:queue|stream|outbox|topic)$/i.test(name)) return "queue";
  if (/(?:database|\bdb|store|storage|index|cache|buckets|journal|log|ledger|postgresql|redis geo|opensearch)$/i.test(name) || /^S3\b/i.test(name)) return "storage";
  return "service";
}

function wrapLabel(label: string, limit: number) {
  const lines: string[] = [];
  for (const word of label.split(" ")) {
    const last = lines.length - 1;
    if (last < 0 || lines[last].length + word.length + 1 > limit) {
      lines.push(word);
    } else {
      lines[last] += " " + word;
    }
  }
  return lines;
}

function positionDiagram(connections: readonly DesignConnection[], vertical: boolean, annotations?: BoardProps["annotations"]) {
  const graph = new Graph<GraphLabel, ComponentLayout, ConnectionLayout>({ multigraph: true });
  graph.setGraph({
    rankdir: vertical ? "TB" : "LR",
    ranksep: vertical ? 38 : 48,
    nodesep: vertical ? 24 : 32,
    edgesep: 18,
    marginx: 25,
    marginy: 25,
  });

  const labels = new Set(connections.flatMap(([from, to]) => [from, to]));
  for (const name of labels) {
    const outgoing = connections.filter(([from]) => from === name);
    const actions = annotations && (annotations[name] ?? outgoing.slice(0, 2).map(([, , action]) => action));
    const lines = wrapLabel(name, annotations ? 21 : 17);
    const notes = actions ? actions.flatMap((action) => wrapLabel(action, 26)) : [];
    const width = Math.max(annotations ? 207 : 158, ...notes.map((line) => line.length * 6.7 + 34));
    const height = Math.max(58, 27 + lines.length * 16 + (notes.length ? 7 + notes.length * 16 : 0));
    graph.setNode(name, { width, height, name, lines, notes, kind: componentKind(name) });
  }
  connections.forEach(([from, to, action, style = "sync"], index) => {
    const lines = wrapLabel(action, 27);
    graph.setEdge(from, to, {
      width: Math.max(...lines.map((line) => line.length)) * 6.5 + 18,
      height: lines.length * 14 + 10,
      lines,
      style,
      labelpos: "r",
      labeloffset: vertical ? 5 : 7,
    }, String(index));
  });

  layout(graph);
  return {
    width: graph.graph().width ?? 0,
    height: graph.graph().height ?? 0,
    components: graph.nodes().map((id) => graph.node(id)),
    connections: graph.edges().map((edge) => graph.edge(edge)),
  };
}

type BoardProps = {
  title: string;
  label?: string;
  connections: readonly DesignConnection[];
  annotations?: Readonly<Record<string, readonly string[]>>;
  records?: readonly DesignRecord[];
  state?: string;
};

function DiagramBoard({ title, label = "high-level design", connections, annotations, records, state, onExpand }: BoardProps & { onExpand?: () => void }) {
  const id = useId().replace(/[^\w-]/g, "");
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [fitPreference, setFitPreference] = useState<boolean | null>(null);
  const vertical = width > 0 && width < 720;
  const graph = useMemo(() => positionDiagram(connections, vertical, annotations), [connections, vertical, annotations]);
  const styles = new Set(connections.map((edge) => edge[3] ?? "sync"));
  const minWidth = Math.ceil(graph.width * 0.86);
  const canScroll = width > 0 && width < minWidth;
  const fit = fitPreference ?? (width > 0 && width / graph.width >= 0.7);

  useEffect(() => {
    const element = container.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <figure className="answer-architecture">
        {(canScroll || (annotations && onExpand)) && (
          <div className="diagram-view-controls">
            {canScroll && <button type="button" className="filter" onClick={() => setFitPreference(!fit)}>
              {fit ? "Show larger labels" : "Fit diagram to screen"}
            </button>}
            {annotations && onExpand && <button type="button" className="filter" onClick={onExpand}>
              <Maximize2 size={14} aria-hidden="true" /> Expand diagram
            </button>}
          </div>
        )}
        <div className="diagram-board">
          <div ref={container} className="answer-diagram-scroll" role="region" aria-label="Scrollable architecture diagram" tabIndex={0}>
            <svg className="answer-diagram" role="img" aria-labelledby={`${id}-title`}
              viewBox={`0 0 ${graph.width} ${graph.height}`} style={{ width: graph.width, minWidth: fit ? undefined : minWidth }}>
              <title id={`${id}-title`}>{title} {label}</title>
              <defs>
                {Object.keys(flowLabels).map((style) => (
                  <marker key={style} id={`${id}-${style}`} viewBox="0 0 10 10" refX="8.5" refY="5"
                    markerWidth="7" markerHeight="7" orient="auto">
                    <path className={`diagram-arrow ${style}`} d="M 0 1 L 9 5 L 0 9 Z" />
                  </marker>
                ))}
              </defs>
              {graph.connections.map((edge, index) => (
                <path key={index} className={`diagram-connection ${edge.style}`}
                  d={edge.points?.map(({ x, y }, point) => `${point === 0 ? "M" : "L"}${x} ${y}`).join(" ")}
                  markerEnd={`url(#${id}-${edge.style})`} />
              ))}
              {graph.components.map(({ name, x, y, width, height, lines, notes, kind }) => {
                const Icon = componentIcons[kind];
                const headingY = notes.length ? 21 : (height - (lines.length - 1) * 16) / 2;
                return (
                  <g key={name} className={`diagram-component ${kind}`} transform={`translate(${(x ?? 0) - width / 2} ${(y ?? 0) - height / 2})`}>
                    <rect width={width} height={height} rx={10} />
                    <Icon x={13} y={headingY - 8} size={16} strokeWidth={1.8} aria-hidden="true" />
                    <text className="diagram-component-name" x={37} y={headingY} dominantBaseline="central">
                      {lines.map((line, index) => <tspan key={index} x={37} dy={index === 0 ? 0 : 16}>{line}</tspan>)}
                    </text>
                    {notes.length > 0 && <text className="diagram-component-notes" x={14} y={headingY + lines.length * 16 + 4} dominantBaseline="central">
                      {notes.map((line, index) => <tspan key={index} x={14} dy={index === 0 ? 0 : 16}>{line}</tspan>)}
                    </text>}
                  </g>
                );
              })}
              {graph.connections.map((edge, index) => (
                <g key={index} className={`diagram-note ${edge.style}`} transform={`translate(${edge.x} ${edge.y})`}>
                  <rect x={-edge.width / 2} y={-edge.height / 2} width={edge.width} height={edge.height} rx={6} />
                  <text textAnchor="middle" dominantBaseline="central" y={-(edge.lines.length - 1) * 7}>
                    {edge.lines.map((line, position) => <tspan key={position} x={0} dy={position === 0 ? 0 : 14}>{line}</tspan>)}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          {(state || !!records?.length) && (
            <section className="diagram-state" aria-label="Data model on the diagram">
              <h4>Data model</h4>
              {state && <p>{state}</p>}
              {!!records?.length && <dl className="diagram-records">
                {records.map(({ name, key, purpose, component, fields }) => (
                  <div key={name}>
                    <dt>{name}{component && <span>{component}</span>}</dt>
                    <dd><code>{key}</code></dd>
                    {fields && <dd><code>{fields.join(" · ")}</code></dd>}
                    <dd>{purpose}</dd>
                  </div>
                ))}
              </dl>}
            </section>
          )}
        </div>
        <figcaption className="diagram-caption">
          <ul className="diagram-legend" aria-label="Arrow types">
            {(Object.keys(flowLabels) as FlowStyle[]).filter((style) => styles.has(style)).map((style) =>
              <li key={style}><span className={style} aria-hidden="true" />{flowLabels[style]}</li>)}
          </ul>
          {canScroll && !fit && <span>Scroll to see the full diagram.</span>}
        </figcaption>
      </figure>
      <details className="diagram-text">
        <summary>Diagram connections</summary>
        <ul>
          {connections.map(([from, to, action], index) => (
            <li key={index}><strong>{from} → {to}</strong><span>{action}</span></li>
          ))}
        </ul>
        {annotations && Object.keys(annotations).length > 0 && <dl className="diagram-roles">
          {graph.components.filter(({ name }) => annotations[name]).map(({ name }) => (
            <div key={name}><dt>{name}</dt><dd>{annotations[name].join(". ")}.</dd></div>
          ))}
        </dl>}
      </details>
    </>
  );
}

export default function AnswerArchitecture(props: BoardProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [expanded, setExpanded] = useState(false);
  const titleId = useId();

  return (
    <>
      <DiagramBoard {...props} onExpand={() => {
        dialog.current?.showModal();
        setExpanded(true);
      }} />
      {props.annotations && <dialog ref={dialog} className="diagram-dialog" aria-labelledby={titleId} onClose={() => setExpanded(false)}>
        <header className="diagram-dialog-header">
          <h3 id={titleId}>{props.label ?? props.title}</h3>
          <button type="button" className="button neutral" onClick={() => dialog.current?.close()}>Close diagram</button>
        </header>
        {expanded && <DiagramBoard {...props} />}
      </dialog>}
    </>
  );
}

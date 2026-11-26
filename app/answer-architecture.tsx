"use client";

import { Graph, layout, type EdgeLabel, type GraphLabel, type NodeLabel } from "@dagrejs/dagre";
import { CircleDot, Database, Layers3, Workflow } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { DesignConnection, FlowStyle } from "./problems/types";

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
type ComponentLayout = NodeLabel & { name: string; lines: string[]; kind: ComponentKind };
type ConnectionLayout = EdgeLabel & { action: string; style: FlowStyle; width: number; height: number };

function componentKind(name: string): ComponentKind {
  if (/^\d{3}\b|(?:response|rejection|rejected|error)$/i.test(name)) return "outcome";
  if (/(?:queue|stream|outbox|topic)$/i.test(name)) return "queue";
  if (/(?:database|\bdb|store|storage|index|cache|buckets|journal|log|replicas|ledger)$/i.test(name)) return "storage";
  return "service";
}

function wrapComponent(name: string) {
  const lines: string[] = [];
  for (const word of name.split(" ")) {
    const last = lines.length - 1;
    if (last < 0 || lines[last].length + word.length + 1 > 17) {
      lines.push(word);
    } else {
      lines[last] += " " + word;
    }
  }
  return lines;
}

function positionDiagram(connections: readonly DesignConnection[], vertical: boolean) {
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
    const lines = wrapComponent(name);
    graph.setNode(name, { width: 158, height: Math.max(58, lines.length * 16 + 18), name, lines, kind: componentKind(name) });
  }
  connections.forEach(([from, to, action, style = "sync"], index) => {
    graph.setEdge(from, to, {
      width: action.length * 6.5 + 18,
      height: 24,
      action,
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

export default function AnswerArchitecture({ title, label = "high-level design", connections }: {
  title: string; label?: string; connections: readonly DesignConnection[];
}) {
  const id = useId().replace(/[^\w-]/g, "");
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [fit, setFit] = useState(false);
  const vertical = width > 0 && width < 720;
  const graph = useMemo(() => positionDiagram(connections, vertical), [connections, vertical]);
  const styles = new Set(connections.map((edge) => edge[3] ?? "sync"));
  const minWidth = Math.ceil(graph.width * 0.86);
  const canScroll = width > 0 && width < minWidth;

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
        {canScroll && (
          <div className="diagram-view-controls">
            <button type="button" className="filter" onClick={() => setFit(!fit)}>
              {fit ? "Show full-size labels" : "Fit diagram to screen"}
            </button>
          </div>
        )}
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
            {graph.components.map(({ name, x, y, width, height, lines, kind }) => {
              const Icon = componentIcons[kind];
              return (
                <g key={name} className={`diagram-component ${kind}`} transform={`translate(${(x ?? 0) - width / 2} ${(y ?? 0) - height / 2})`}>
                  <rect width={width} height={height} rx={10} />
                  <Icon x={13} y={height / 2 - 8} size={16} strokeWidth={1.8} aria-hidden="true" />
                  <text x={37} y={(height - (lines.length - 1) * 16) / 2} dominantBaseline="central">
                    {lines.map((line, index) => <tspan key={index} x={37} dy={index === 0 ? 0 : 16}>{line}</tspan>)}
                  </text>
                </g>
              );
            })}
            {graph.connections.map((edge, index) => (
              <g key={index} className={`diagram-note ${edge.style}`} transform={`translate(${edge.x} ${edge.y})`}>
                <rect x={-edge.width / 2} y={-edge.height / 2} width={edge.width} height={edge.height} rx={6} />
                <text textAnchor="middle" dominantBaseline="central">{edge.action}</text>
              </g>
            ))}
          </svg>
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
      </details>
    </>
  );
}

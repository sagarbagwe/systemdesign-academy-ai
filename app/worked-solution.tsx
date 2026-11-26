"use client";

import { GitBranch, Target } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { lessons, type Case } from "./catalog";
import { Heading } from "./learning";
import type { DesignConnection } from "./problems/types";

const AnswerArchitecture = dynamic(() => import("./answer-architecture"), {
  loading: () => <p role="status">Loading design diagram…</p>,
});

const steps = [
  { id: "requirements", label: "Requirements" },
  { id: "entities", label: "Core entities" },
  { id: "interface", label: "API or interface" },
  { id: "data-flow", label: "Data flow" },
  { id: "high-level-design", label: "High-level design" },
  { id: "deep-dives", label: "Deep dives" },
] as const;

type StepId = (typeof steps)[number]["id"];

function stepLink(caseId: string, stepId: StepId) {
  return `#answer/${caseId}/${stepId}`;
}

function Explain({ children }: { children: React.ReactNode }) {
  return (
    <aside className="interview-explanation">
      <h3>How to say it in an interview</h3>
      <p>{children}</p>
    </aside>
  );
}

function DataFlow({ item }: { item: Case }) {
  const [visible, setVisible] = useState(1);
  const { diagram, walkthrough } = item.answer;
  const selected = walkthrough.flow
    .map((action) => diagram.find((edge) => edge[2] === action))
    .filter((edge): edge is DesignConnection => edge !== undefined);
  const flow = selected.length ? selected : diagram;
  const [from, to] = flow[visible - 1];

  return (
    <>
      <p>Follow one representative path before adding the other branches.</p>
      <div className="flow-controls">
        <p role="status">Connection {visible} of {flow.length}</p>
        <button type="button" className="button neutral" onClick={() => setVisible(visible - 1)} disabled={visible === 1}>Previous connection</button>
        <button type="button" className="button primary" onClick={() => setVisible(visible + 1)} disabled={visible === flow.length}>Next connection</button>
      </div>
      <AnswerArchitecture title={item.title} label="data flow diagram" connections={flow.slice(0, visible)} />
      <ol className="walkthrough-flow">
        {flow.map(([origin, destination, action], index) => (
          <li key={action}>
            <button type="button" aria-current={visible === index + 1 ? "step" : undefined} onClick={() => setVisible(index + 1)}>
              <span>{index + 1}</span>
              <span><strong>{action}</strong><small>{origin} → {destination}</small></span>
            </button>
          </li>
        ))}
      </ol>
      <Explain>“At this point, I’d trace the arrow from {from} to {to}. I’d say what moves across it and whether we need to wait for a result.”</Explain>
    </>
  );
}

function StepContent({ item, step }: { item: Case; step: StepId }) {
  const { answer } = item;
  const { entities, qualityGoal, sayDesign } = answer.walkthrough;
  const goal = qualityGoal.charAt(0).toLowerCase() + qualityGoal.slice(1);
  const lesson = lessons.find((entry) => entry.id === item.lessonId);

  switch (step) {
    case "requirements":
      return (
        <>
          <p>{item.scenario}</p>
          <h3>What the system needs to do</h3>
          <ul>{item.requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul>
          <h3>Non-functional focus</h3>
          <p>{qualityGoal}</p>
          <Explain>“I’ll confirm what the system must do first. My main design goal is to {goal}”</Explain>
        </>
      );
    case "entities":
      return (
        <>
          <p>Name the key objects first. Fill in their fields when you decide where the system stores them.</p>
          <ul className="entity-list">{entities.map((entity) => <li key={entity}>{entity}</li>)}</ul>
          <Explain>“The first objects I’ll name are {entities.slice(0, 2).join(" and ")}. I’ll add other records as we trace writes and reads.”</Explain>
        </>
      );
    case "interface":
      return (
        <>
          <h3>Caller contract</h3>
          <p>{answer.api}</p>
          <Explain>“I’ll describe what the caller sends, what a successful call returns, and what happens when it fails. That gives us a contract to trace through the diagram.”</Explain>
        </>
      );
    case "data-flow":
      return <DataFlow item={item} />;
    case "high-level-design":
      return (
        <>
          <p>{answer.design}</p>
          <AnswerArchitecture title={item.title} connections={answer.diagram} />
          <h3>Storage and state</h3>
          <p>{answer.data}</p>
          <Explain>“{sayDesign ?? `I’ll trace the path from ${answer.diagram[0][0]} to ${answer.diagram[0][1]}, then show where we save state. The design needs to ${goal}`}”</Explain>
        </>
      );
    case "deep-dives":
      return (
        <>
          <h3>Capacity estimate</h3><p>{answer.capacity}</p>
          {answer.implementation && (
            <>
              <h3>Implementation details</h3>
              <dl className="solution-data">
                {answer.implementation.map(({ label, text }) => <div key={label}><dt>{label}</dt><dd>{text}</dd></div>)}
              </dl>
            </>
          )}
          <h3>Reliability and failure handling</h3><p>{answer.reliability}</p>
          <h3>Trade-offs</h3><p>{answer.tradeoff}</p>
          <h3>Practice follow-up</h3><p>{item.retry}</p>
          <Explain>“I’ll pick a failure that threatens this requirement. Here’s how I’d handle it. {answer.reliability}”</Explain>
          {lesson && <a className="text-link" href={`#lesson/${lesson.id}`}>Review {lesson.title.toLowerCase()}</a>}
        </>
      );
  }
}

export default function WorkedSolution({ item, stepId }: { item: Case; stepId?: string }) {
  const index = Math.max(0, steps.findIndex(({ id }) => id === stepId));
  const step = steps[index];
  const previous = steps[index - 1];
  const next = steps[index + 1];

  return (
    <>
      <a className="back-link" href="#practice">Practice Hub</a>
      <div className="solution-heading">
        <Heading title={item.title} description="Worked answer" />
        <div className="walkthrough-actions">
          {step.id !== "high-level-design" && (
            <a className="button neutral" href={stepLink(item.id, "high-level-design")}><GitBranch size={16} aria-hidden="true" />Open diagram</a>
          )}
          <a className="button primary" href={`#design/${item.id}`}><Target size={16} aria-hidden="true" />Practice this problem</a>
        </div>
      </div>
      <nav className="panel walkthrough-nav" aria-label="Answer steps">
        <ol>
          {steps.map(({ id, label }, position) => (
            <li key={id}>
              <a href={stepLink(item.id, id)} aria-current={step.id === id ? "step" : undefined}>
                <span>{position + 1}</span>{label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <article className={`panel reading-card walkthrough-panel ${step.id === "high-level-design" || step.id === "data-flow" ? "architecture-card" : ""}`}>
        <h2>{step.label}</h2>
        <StepContent key={step.id} item={item} step={step.id} />
      </article>
      <nav className="walkthrough-pagination" aria-label="Navigate answer steps">
        {previous && <a className="button neutral" href={stepLink(item.id, previous.id)}>Back to {previous.label.toLowerCase()}</a>}
        {next && <a className="button primary" href={stepLink(item.id, next.id)}>Next · {next.label}</a>}
      </nav>
      <p className="walkthrough-reference">
        Step order adapted from <a className="text-link" href="https://www.hellointerview.com/learn/system-design/in-a-hurry/delivery" target="_blank" rel="noreferrer">Hello Interview’s public delivery framework</a>.
      </p>
    </>
  );
}

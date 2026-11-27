"use client";

import { GitBranch, Target } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { lessons, type Case } from "./catalog";
import { Heading } from "./learning";
import type { DesignConnection, DesignSection, WorkedAnswer } from "./problems/types";

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
const inferredAnnotations = {};

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

function answerFlow({ diagram, walkthrough }: WorkedAnswer) {
  const selected = walkthrough.flow
    .map((action) => diagram.find((edge) => edge[2] === action))
    .filter((edge): edge is DesignConnection => edge !== undefined);
  return selected.length ? selected : diagram;
}

function DataFlow({ item }: { item: Case }) {
  const [visible, setVisible] = useState(1);
  const flow = answerFlow(item.answer);
  const [, to, action] = flow[visible - 1];

  return (
    <>
      <p>Follow one representative path before adding the other branches.</p>
      <div className="flow-controls">
        <p role="status">Connection {visible} of {flow.length}</p>
        <button type="button" className="button neutral" onClick={() => setVisible(visible - 1)} disabled={visible === 1}>Previous connection</button>
        <button type="button" className="button primary" onClick={() => setVisible(visible + 1)} disabled={visible === flow.length}>Next connection</button>
      </div>
      <AnswerArchitecture title={item.title} label="data flow diagram" connections={flow.slice(0, visible)}
        annotations={item.answer.details?.components ?? inferredAnnotations} />
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
      <p className="flow-current"><strong>{action}</strong> → {to}</p>
    </>
  );
}

function Architecture({ item }: { item: Case }) {
  const { answer, technology } = item;
  const { details } = answer;
  const [active, setActive] = useState<number | null>(details?.sections.length ? 0 : null);
  const primaryFlow = answerFlow(answer);
  const sections: readonly DesignSection[] = details?.sections ?? (primaryFlow.length < answer.diagram.length ? [{
    title: "Main request path",
    description: "Trace the actions the core request takes through the system, then use the full diagram to discuss other paths.",
    connections: primaryFlow.map((edge) => edge[2]),
  }] : []);
  const section = active === null ? undefined : sections[active];
  const connections = section
    ? answer.diagram.filter((edge) => section.connections.includes(edge[2]))
    : answer.diagram;
  const recordNames = new Set(section?.records);
  const records = details?.records.filter(({ name, component }) => {
    if (recordNames.size) return recordNames.has(name);
    return !component || connections.some(([from, to]) => from === component || to === component);
  });
  const choices = [
    { label: "Database and storage", ...technology.storage },
    { label: "Load balancing and routing", ...technology.routing },
    { label: "Supporting components", ...technology.support },
  ];

  return (
    <>
      <p>{answer.design}</p>
      {sections.length > 0 && (
        <>
          <h3>Architecture views</h3>
          <div className="design-view-controls" role="group" aria-label="Diagram views">
            {sections.map((view, index) => (
              <button type="button" key={view.title} className={`filter ${active === index ? "selected" : ""}`} aria-pressed={active === index} onClick={() => setActive(index)}>
                {index + 1}. {view.title}
              </button>
            ))}
            <button type="button" className={`filter ${active === null ? "selected" : ""}`} aria-pressed={active === null} onClick={() => setActive(null)}>Full system</button>
          </div>
          {section && <p>{section.description}</p>}
        </>
      )}
      <AnswerArchitecture title={item.title} label={section?.title} connections={connections}
        annotations={details?.components ?? inferredAnnotations} records={records} state={!section || !records?.length ? answer.data : undefined} />
      {section?.say && <Explain>“{section.say}”</Explain>}
      <h3>Which technologies to use and why</h3>
      <dl className="technology-choices">
        {choices.map(({ label, technology, reason }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd><strong>{technology}</strong><p>{reason}</p></dd>
          </div>
        ))}
      </dl>
    </>
  );
}

function StepContent({ item, step, full = false }: { item: Case; step: StepId; full?: boolean }) {
  const { answer } = item;
  const { entities, qualityGoal, sayDesign } = answer.walkthrough;
  const goal = qualityGoal.charAt(0).toLowerCase() + qualityGoal.slice(1);
  const lesson = lessons.find((entry) => entry.id === item.lessonId);

  switch (step) {
    case "requirements":
      return (
        <>
          <p>{item.scenario}</p>
          {answer.details?.assumptions && <p><strong>Assumptions.</strong> {answer.details.assumptions}</p>}
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
          {answer.details?.endpoints && (
            <dl className="design-records">
              {answer.details.endpoints.map(({ request, result }) => <div key={request}><dt><code>{request}</code></dt><dd>{result}</dd></div>)}
            </dl>
          )}
          <Explain>“I’ll describe what the caller sends, what a successful call returns, and what happens when it fails. That gives us a contract to trace through the diagram.”</Explain>
        </>
      );
    case "data-flow":
      return full ? (
        <>
          <ol className="written-flow">
            {answerFlow(answer).map(([from, to, action]) => (
              <li key={action}><strong>{action}.</strong> {from} → {to}</li>
            ))}
          </ol>
          <a className="button neutral" href={stepLink(item.id, "data-flow")}>Build this diagram step by step</a>
        </>
      ) : <DataFlow item={item} />;
    case "high-level-design":
      return (
        <>
          <Architecture item={item} />
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
          {answer.details?.deepDives.map(({ title, answer: response }) => <section key={title}><h3>{title}</h3><p>{response}</p></section>)}
          <h3>Practice follow-up</h3><p>{item.retry}</p>
          <Explain>“I’ll pick a failure that threatens this requirement. Here’s how I’d handle it. {answer.reliability}”</Explain>
          {lesson && <a className="text-link" href={`#lesson/${lesson.id}`}>Review {lesson.title.toLowerCase()}</a>}
        </>
      );
  }
}

export default function WorkedSolution({ item, stepId }: { item: Case; stepId?: string }) {
  const index = steps.findIndex(({ id }) => id === stepId);
  const step = index < 0 ? undefined : steps[index];
  const previous = steps[index - 1];
  const next = steps[index + 1];

  return (
    <>
      <a className="back-link" href="#practice">Practice Hub</a>
      <div className="solution-heading">
        <Heading title={item.title} description={step ? "Worked answer" : "Full design breakdown"} />
        <div className="walkthrough-actions">
          {step && <a className="button neutral" href={`#answer/${item.id}`}>Read full answer</a>}
          {step?.id !== "high-level-design" && (
            <a className="button neutral" href={stepLink(item.id, "high-level-design")}><GitBranch size={16} aria-hidden="true" />Open diagram</a>
          )}
          <a className="button primary" href={`#design/${item.id}`}><Target size={16} aria-hidden="true" />Practice this problem</a>
        </div>
      </div>
      <nav className="panel walkthrough-nav" aria-label="Answer steps">
        <ol>
          {steps.map(({ id, label }, position) => (
            <li key={id}>
              <a href={stepLink(item.id, id)} aria-current={step?.id === id ? "step" : undefined}>
                <span>{position + 1}</span>{label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      {step ? (
        <>
          <article className="panel reading-card walkthrough-panel">
            <h2>{step.label}</h2>
            <StepContent key={step.id} item={item} step={step.id} />
          </article>
          <nav className="walkthrough-pagination" aria-label="Navigate answer steps">
            {previous && <a className="button neutral" href={stepLink(item.id, previous.id)}>Back to {previous.label.toLowerCase()}</a>}
            {next && <a className="button primary" href={stepLink(item.id, next.id)}>Next · {next.label}</a>}
          </nav>
        </>
      ) : (
        <div className="full-answer">
          {steps.map(({ id, label }, position) => (
            <section className="panel reading-card walkthrough-panel" key={id} aria-labelledby={`answer-${id}`}>
              <h2 id={`answer-${id}`}><span className="section-step">{position + 1}.</span> {label}</h2>
              <StepContent item={item} step={id} full />
            </section>
          ))}
        </div>
      )}
      <p className="walkthrough-reference">
        {(item.answer.sources ?? [{
          label: "Hello Interview’s public delivery framework",
          href: "https://www.hellointerview.com/learn/system-design/in-a-hurry/delivery",
        }]).map(({ label, href }) => <a key={href} className="text-link" href={href} target="_blank" rel="noreferrer">{label}</a>)}
      </p>
    </>
  );
}

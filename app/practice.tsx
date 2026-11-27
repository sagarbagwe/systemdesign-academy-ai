"use client";

import { Check, Clock3, GitBranch, Layers3, Plus, Timer, Trash2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { lessons, type Case } from "./catalog";
import { cases } from "./problems";
import { Heading } from "./learning";
import {
  components, practiceDate, sections, totalReview, type Attempt, type Component, type Draft, type Mode, type Progress,
} from "./model";

function ArchitectureMap({ nodes, edges }: Pick<Draft, "nodes" | "edges">) {
  const markerId = useId();
  const positions = new Map(nodes.map((node, index) => [
    node.id,
    { x: index % 2 === 0 ? 72 : 216, y: 29 + 53 * Math.floor(index / 2) },
  ]));
  return (
    <svg className="architecture-map" viewBox={`0 0 288 ${Math.ceil(nodes.length / 2) * 53 + 6}`} role="img" aria-label="Architecture diagram showing components and directed connections">
      <defs><marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path className="sketch-arrow" d="M 0 0 L 10 5 L 0 10 z" />
      </marker></defs>
      {edges.map((edge) => {
        const start = positions.get(edge.from);
        const end = positions.get(edge.to);
        if (!start || !end || edge.from === edge.to) return null;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const scale = 1 / Math.max(Math.abs(dx) / 60, Math.abs(dy) / 17);
        const offsetX = dx * scale;
        const offsetY = dy * scale;
        return <path key={edge.from + edge.to} d={`M ${start.x + offsetX} ${start.y + offsetY} L ${end.x - offsetX} ${end.y - offsetY}`}
          className="sketch-line" strokeWidth="1.5" markerEnd={`url(#${markerId})`} />;
      })}
      {nodes.map((node) => {
        const point = positions.get(node.id)!;
        return <g key={node.id}>
          <rect className="sketch-node" x={point.x - 58} y={point.y - 15} width="116" height="30" rx="7" />
          <text className="sketch-label" x={point.x} y={point.y} textAnchor="middle" dominantBaseline="central" fontSize="12">{node.label}</text>
        </g>;
      })}
    </svg>
  );
}

function Diagram({ draft, update }: { draft: Draft; update: (draft: Draft) => void }) {
  const [component, setComponent] = useState<Component>("API service");
  const [fromId, setFrom] = useState("");
  const [toId, setTo] = useState("");
  const from = draft.nodes.find((node) => node.id === fromId)?.id || draft.nodes[0]?.id || "";
  const to = draft.nodes.find((node) => node.id === toId && node.id !== from)?.id
    || draft.nodes.find((node) => node.id !== from)?.id || "";
  const canConnect = from && to && !draft.edges.some((edge) => edge.from === from && edge.to === to);
  const labelFor = (id: string) => draft.nodes.find((node) => node.id === id)?.label;
  return (
    <section className="panel diagram">
      <div className="panel-title"><GitBranch size={18} /><h2>Architecture diagram</h2></div>
      <div className="diagram-grid">
        {draft.nodes.length ? <ArchitectureMap nodes={draft.nodes} edges={draft.edges} /> : <p>Add components to map the request path.</p>}
      </div>
      {draft.nodes.length > 0 && <div className="diagram-components">
        {draft.nodes.map((node) => (
          <div className="node" key={node.id}>
            <Layers3 size={15} /> <span>{node.label}</span>
            <button type="button" className="icon-button" title={`Remove ${node.label}`} aria-label={`Remove ${node.label}`}
              onClick={() => update({ ...draft, nodes: draft.nodes.filter((item) => item.id !== node.id), edges: draft.edges.filter((edge) => edge.from !== node.id && edge.to !== node.id) })}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>}
      <div className="diagram-control">
        <label className="sr-only" htmlFor="component">Component</label>
        <select id="component" value={component} onChange={(event) => setComponent(event.target.value as Component)}>
          {components.map((item) => <option key={item}>{item}</option>)}
        </select>
        <button type="button" className="button neutral" disabled={draft.nodes.some((node) => node.label === component)}
          onClick={() => update({ ...draft, nodes: [...draft.nodes, { id: crypto.randomUUID(), label: component }] })}><Plus size={15} /> Add</button>
      </div>
      {draft.nodes.length > 1 && <>
        <div className="diagram-control connections">
          <label><span>From</span><select value={from} onChange={(event) => setFrom(event.target.value)}>{draft.nodes.map((node) => <option value={node.id} key={node.id}>{node.label}</option>)}</select></label>
          <label><span>To</span><select value={to} onChange={(event) => setTo(event.target.value)}>{draft.nodes.filter((node) => node.id !== from).map((node) => <option value={node.id} key={node.id}>{node.label}</option>)}</select></label>
          <button type="button" className="button neutral" disabled={!canConnect} onClick={() => update({ ...draft, edges: [...draft.edges, { from, to }] })}>Connect</button>
        </div>
        <ul className="edge-list">
          {draft.edges.map((edge) => <li key={edge.from + edge.to}><span>{labelFor(edge.from)} <span className="edge-arrow">→</span> {labelFor(edge.to)}</span>
            <button type="button" className="icon-button" aria-label={`Remove connection from ${labelFor(edge.from)} to ${labelFor(edge.to)}`} onClick={() => update({ ...draft, edges: draft.edges.filter((item) => item !== edge) })}><Trash2 size={14} /></button>
          </li>)}
        </ul>
      </>}
    </section>
  );
}

function Countdown({ startedAt, minutes }: { startedAt: number; minutes: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const seconds = Math.max(0, Math.ceil((startedAt + minutes * 60_000 - now) / 1000));
  return <span className={`timer ${seconds === 0 ? "expired" : ""}`} aria-label={seconds === 0 ? "Time is up" : "Time remaining"}><Timer size={16} />{seconds === 0 ? "Time is up" : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`}</span>;
}

export function PracticeEditor({ item, mode, draft, update, submit, parent, saved }: {
  item: Case; mode: Mode; draft: Draft; update: (draft: Draft) => void; submit: () => void; parent?: Attempt; saved: boolean;
}) {
  const [step, setStep] = useState(() => {
    if (mode === "design") return 0;
    const nextBlank = draft.notes.findIndex((note) => !note.trim());
    return nextBlank < 0 ? sections.length - 1 : nextBlank;
  });
  const [showHint, setShowHint] = useState(false);
  const canSubmit = draft.notes.some((note) => note.trim().length > 0);
  const answered = draft.notes.filter((note) => note.trim() !== "").length;

  return (
    <>
      <a className="back-link" href={mode === "mock" ? "#mocks" : "#practice"}>{mode === "mock" ? "Mock interviews" : "Practice Hub"}</a>
      <Heading title={item.title} description={mode === "mock" ? "Timed mock interview" : "Guided design practice"} />
      <div className="practice-layout">
        <aside>
          <section className="panel reading-card scenario">
            <div className="inline-meta"><span className={`difficulty ${item.level.toLowerCase()}`}>{item.level}</span><Clock3 size={15} /> {item.time} min</div>
            <h2>Scenario</h2><p>{item.scenario}</p>
            <h3>Requirements</h3><ul>{item.requirements.map((value) => <li key={value}>{value}</li>)}</ul>
            {parent && <div className="callout"><div><h3>Retry constraint</h3><p>{item.retry}</p></div></div>}
            <div className="tags">{item.concepts.map((concept) => <span key={concept}>{concept}</span>)}</div>
            {mode === "design" && <a className="text-link practice-answer-link" href={`#answer/${item.id}`}>View worked answer</a>}
          </section>
          {mode === "design" && <Diagram draft={draft} update={update} />}
        </aside>
        <section className="panel editor">
          <div className="editor-heading"><h2>{mode === "mock" ? "Interview questions" : "Your design"}</h2>
            {mode === "mock" && draft.startedAt && <Countdown startedAt={draft.startedAt} minutes={item.time} />}
            {mode === "design" && saved && <span className="muted-status"><Check size={14} /> Saved on this device</span>}
          </div>
          {mode === "mock" && !draft.startedAt ? <div className="mock-start">
            <p>Answer five questions in order. The timer starts when you begin, and your notes are saved on this device.</p>
            <button className="button primary" onClick={() => update({ ...draft, startedAt: Date.now() })}>Start timed interview</button>
          </div> : <>
            {mode === "mock" && <div className="step-list" aria-label="Interview questions">{sections.map((section, index) =>
              <button key={section.title} className={step === index ? "selected" : ""} aria-current={step === index ? "step" : undefined} aria-label={section.title} onClick={() => { setStep(index); setShowHint(false); }}>
                {draft.notes[index]?.trim() ? <Check size={15} /> : index + 1}
              </button>)}</div>}
            {sections.map((section, index) => (mode === "design" || step === index) && (
              <div className="field note-field" key={section.title}>
                <label htmlFor={`notes-${index}`}>{section.title}</label>
                <p>{section.prompt}</p>
                <textarea id={`notes-${index}`} rows={mode === "mock" ? 8 : 3} maxLength={2800} placeholder="Write your reasoning…"
                  value={draft.notes[index] || ""} onChange={(event) => update({ ...draft, notes: draft.notes.map((note, at) => at === index ? event.target.value : note) })} />
              </div>
            ))}
            {mode === "mock" && <div className="mock-controls">
              <button type="button" className="button neutral" onClick={() => setShowHint(!showHint)}>{showHint ? "Hide hint" : "Show hint"}</button>
              {step < sections.length - 1 && <button type="button" className="button neutral" onClick={() => { setStep(step + 1); setShowHint(false); }}>Next question</button>}
            </div>}
            {mode === "mock" && showHint && <p className="hint">{sections[step].hint}</p>}
            <div className="editor-footer"><span>{answered} of {sections.length} sections answered</span><button className="button primary" disabled={!canSubmit} onClick={submit}>Get feedback</button></div>
          </>}
        </section>
      </div>
    </>
  );
}

export function Report({ attempt, previous, item }: { attempt: Attempt; previous?: Attempt; item: Case }) {
  const points = totalReview(attempt.review);
  const delta = previous ? points - totalReview(previous.review) : null;
  const lesson = lessons.find((value) => value.id === item.lessonId);
  return (
    <>
      <a className="back-link" href="#progress">Your progress</a>
      <Heading title="Practice feedback" description={item.title} />
      <div className="practice-layout">
        <aside>
          <div className="panel reading-card score-card">
            <h2>Design coverage</h2><div className="rating">{points}<span> / 15</span></div>
            <progress value={points} max={15} aria-label="Design coverage" />
            {delta !== null && <p>{delta >= 0 ? "+" : ""}{delta} points compared with your earlier attempt.</p>}
            <p>Coverage reflects case-specific topics mentioned in each section. Use it to guide revision and self-review.</p>
          </div>
          <div className="panel reading-card next-report">
            <h2>Try a new constraint</h2><p>{item.retry}</p>
            {lesson && <a className="text-link" href={`#lesson/${lesson.id}`}>Review {lesson.title.toLowerCase()}</a>}
            <div className="button-wrap">
              <a className="button primary" href={`#${attempt.mode}/${item.id}/${attempt.id}`}>Retry practice</a>
              <a className="button neutral" href={`#answer/${item.id}`}>View worked answer</a>
            </div>
          </div>
        </aside>
        <section className="panel editor review">
          {attempt.review.map((row, index) => <div className="review-row" key={row.title}>
            <div className="card-top"><h2>{row.title}</h2><span className="difficulty intermediate">{row.points}/3</span></div>
            {row.quote ? <blockquote>{row.quote}</blockquote> : <p className="muted">No matching evidence in this section.</p>}
            {previous?.review[index]?.quote && <p className="muted">Earlier attempt · {previous.review[index].quote}</p>}
            <p>{row.advice}</p>
          </div>)}
        </section>
      </div>
    </>
  );
}

export function ProjectPage({ item, done, toggle }: { item: Case; done: boolean; toggle: () => void }) {
  return (
    <>
      <a className="back-link" href="#projects">Build projects</a>
      <Heading title={item.title} description={item.summary} />
      <div className="panel reading-card project">
        <h2>Brief</h2><p>{item.scenario}</p>
        <h2>Requirements</h2><ul>{item.requirements.map((value) => <li key={value}>{value}</li>)}</ul>
        <h2>Build and verify</h2><ol>{item.project?.map((value) => <li key={value}>{value}</li>)}</ol>
        <div className="hero-actions"><button className="button primary" onClick={toggle}>{done ? "Mark as in progress" : "Mark project complete"}</button>
          <a className="button neutral" href={`#design/${item.id}`}>Practice the design</a></div>
      </div>
    </>
  );
}

export function ProgressPage({ progress }: { progress: Progress }) {
  return (
    <>
      <Heading title="Your progress" description="Revisit your designs and see what changed across attempts." />
      <div className="stats">
        <div className="panel stat"><div><span className="stat-label">Lessons completed</span><div className="stat-value">{progress.completed.length}<span> / {lessons.length}</span></div></div></div>
        <div className="panel stat"><div><span className="stat-label">Practice attempts</span><div className="stat-value">{progress.attempts.length}</div></div></div>
        <div className="panel stat"><div><span className="stat-label">Projects completed</span><div className="stat-value">{progress.profile.completedProjects.length}</div></div></div>
      </div>
      <div className="section-heading section-spaced"><h2>Practice history</h2></div>
      <div className="panel history">
        {progress.attempts.length ? progress.attempts.map((item) => <a href={`#report/${item.id}`} className="history-row" key={item.id}>
          <span><strong>{cases.find((value) => value.id === item.caseId)?.title || "Design practice"}</strong><small>{item.parentId ? "Retry" : item.mode === "mock" ? "Mock interview" : "Guided design"} · {practiceDate(item.submittedAt)}</small></span>
          <span className="difficulty intermediate">{totalReview(item.review)}/15</span>
        </a>) : <div className="empty"><p>Your submitted attempts will appear here.</p><a className="button neutral" href="#practice">Find a problem</a></div>}
      </div>
    </>
  );
}

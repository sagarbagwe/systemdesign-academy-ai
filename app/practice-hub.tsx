"use client";

import { BookOpen, Clock3, GitBranch, Search, Target } from "lucide-react";
import { useRef } from "react";
import dynamic from "next/dynamic";
import { lessons, type Case, type Level } from "./catalog";
import { Glyph, Heading } from "./learning";
import { cases, caseSearchText, matchesSearch } from "./problems";
import { topics, type Topic } from "./problems/types";

const AnswerArchitecture = dynamic(() => import("./answer-architecture"), {
  loading: () => <p role="status">Loading design diagram…</p>,
});

const PAGE_SIZE = 18;
const levels = ["All levels", "Beginner", "Intermediate", "Advanced"] as const;
export type HubFilters = { query: string; topic: Topic | ""; level: Level | "All levels"; page: number };
export const defaultHubFilters: HubFilters = { query: "", topic: "", level: "All levels", page: 1 };

export function PracticeHub({ filters, setFilters }: { filters: HubFilters; setFilters: (value: HubFilters) => void }) {
  const count = useRef<HTMLDivElement>(null);
  const { query, topic, level, page } = filters;
  const matched = cases.filter((item) => (!topic || item.topic === topic) && (level === "All levels" || item.level === level)
    && matchesSearch(caseSearchText(item), query));
  const filtered = Boolean(query.trim() || topic || level !== "All levels");
  const pages = Math.ceil(matched.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const visible = matched.slice(start, start + PAGE_SIZE);

  function change(changeSet: Partial<HubFilters>) {
    setFilters({ ...filters, page: 1, ...changeSet });
  }

  function showPage(next: number) {
    change({ page: next });
    count.current?.scrollIntoView({ block: "start" });
    count.current?.focus({ preventScroll: true });
  }

  return (
    <>
      <Heading title="Practice Hub" description={`Browse ${cases.length} system design problems. Try a design or study its worked answer.`} />
      <div className="panel hub-toolbar">
        <div className="hub-fields">
          <label className="hub-search">
            <span className="sr-only">Search problems</span>
            <Search size={18} />
            <input type="search" placeholder="Search problems or topics" value={query}
              onChange={(event) => change({ query: event.target.value })} />
          </label>
          <label className="hub-topic">
            <span className="sr-only">Topic</span>
            <select value={topic} onChange={(event) => change({ topic: event.target.value as HubFilters["topic"] })}>
              <option value="">All topics</option>
              {Object.entries(topics).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </label>
        </div>
        <div className="filters hub-levels" aria-label="Difficulty">
          {levels.map((value) => <button key={value} className={`filter ${level === value ? "selected" : ""}`}
            aria-pressed={level === value} onClick={() => change({ level: value })}>{value}</button>)}
        </div>
      </div>
      <div className="hub-summary">
        <div className="hub-count" role="status" ref={count} tabIndex={-1}>
          {matched.length === 0 ? "No matching problems" : matched.length === 1 ? "1 problem"
            : `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, matched.length)} of ${matched.length} problems`}
        </div>
        {filtered && <button className="filter" onClick={() => setFilters(defaultHubFilters)}>Clear filters</button>}
      </div>
      {visible.length ? <div className="case-grid">
        {visible.map((item) => (
          <article className="panel case-card hub-card" key={item.id}>
            <div className="card-top">
              <Glyph name={item.icon} color={item.color} />
              <span className={`difficulty ${item.level.toLowerCase()}`}>{item.level}</span>
            </div>
            <p className="hub-topic-label">{topics[item.topic]}</p>
            <h2><a href={`#design/${item.id}`}>{item.title}</a></h2>
            <p>{item.summary}</p>
            <div className="case-meta"><Clock3 size={14} /> {item.time} min</div>
            <div className="hub-actions">
              <a className="button neutral" aria-label={`Practice ${item.title}`} href={`#design/${item.id}`}>Practice</a>
              <a className="button answer-button" aria-label={`View answer for ${item.title}`} href={`#answer/${item.id}`}><BookOpen size={15} /> View answer</a>
            </div>
          </article>
        ))}
      </div> : (
        <div className="panel empty">Try another search or clear your filters.</div>
      )}
      {pages > 1 && <nav className="hub-pagination" aria-label="Problem pages">
        <button className="button neutral" disabled={page === 1} onClick={() => showPage(page - 1)}>Previous</button>
        <span>Page {page} of {pages}</span>
        <button className="button neutral" disabled={page === pages} onClick={() => showPage(page + 1)}>Next</button>
      </nav>}
    </>
  );
}

export function WorkedSolution({ item }: { item: Case }) {
  const { answer } = item;
  const lesson = lessons.find((entry) => entry.id === item.lessonId);

  return (
    <>
      <a className="back-link" href="#practice">Practice Hub</a>
      <div className="solution-heading">
        <Heading title={item.title} description="Worked answer" />
        <a className="button primary" href={`#design/${item.id}`}><Target size={16} /> Practice this problem</a>
      </div>
      <section className="panel reading-card architecture-card" aria-labelledby="high-level-design">
        <h2 id="high-level-design"><GitBranch size={19} aria-hidden="true" />High-level design</h2>
        <AnswerArchitecture title={item.title} connections={answer.diagram} />
        <p>{answer.design}</p>
      </section>
      <div className="solution-layout">
        <article className="panel reading-card solution">
          <section><h2>Capacity estimate</h2><p>{answer.capacity}</p></section>
          <section>
            <h2>API and data model</h2>
            <dl className="solution-data">
              <div><dt>Interface</dt><dd>{answer.api}</dd></div>
              <div><dt>Storage</dt><dd>{answer.data}</dd></div>
            </dl>
          </section>
          {answer.implementation && (
            <section>
              <h2>Token-bucket implementation</h2>
              <dl className="solution-data">
                {answer.implementation.map(({ label, text }) => <div key={label}><dt>{label}</dt><dd>{text}</dd></div>)}
              </dl>
            </section>
          )}
          <section><h2>Reliability and failure handling</h2><p>{answer.reliability}</p></section>
          <section><h2>Trade-offs</h2><p>{answer.tradeoff}</p></section>
        </article>
        <aside className="solution-side">
          <section className="panel reading-card">
            <h2>Problem statement</h2>
            <p>{item.scenario}</p>
            <ul>{item.requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul>
            <div className="tags">{item.concepts.map((concept) => <span key={concept}>{concept}</span>)}</div>
          </section>
          <section className="panel reading-card">
            <h2>Interview follow-up</h2>
            <p>{item.retry}</p>
            {lesson && <a className="text-link" href={`#lesson/${lesson.id}`}>Review {lesson.title.toLowerCase()}</a>}
          </section>
        </aside>
      </div>
    </>
  );
}

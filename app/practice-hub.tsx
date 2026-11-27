"use client";

import { BookOpen, Clock3, Search } from "lucide-react";
import { useRef } from "react";
import type { Level } from "./catalog";
import { Glyph, Heading } from "./learning";
import { cases, caseSearchText, matchesSearch } from "./problems";
import { topics, type Topic } from "./problems/types";

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
      <div className="hub-heading">
        <Heading title="Practice Hub" description={`Explore ${cases.length} system design problems and their worked answers.`} />
        <div className="hub-resources">
          <a className="text-link" href="#study/prachub">PracHub study topics</a>
          <a className="button neutral" href="#maang-hld">MAANG HLD course</a>
        </div>
      </div>
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
              <a className="button answer-button" aria-label={`View answer for ${item.title}`} href={`#answer/${item.id}`}><BookOpen size={15} /> View answer</a>
              <a className="button neutral" aria-label={`Practice ${item.title}`} href={`#design/${item.id}`}>Practice</a>
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

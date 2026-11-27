"use client";

import { BookOpen, Search } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Heading } from "./learning";
import { cases, matchesSearch } from "./problems";
import { pracHubCategory, pracHubProblems } from "./problems/prachub-problems";
import { courseQuestions, courseSource, studyTopics } from "./study";
import { pracHubCasebook, pracHubFoundations, pracHubStudyMap } from "./study/prachub";
import { studyGroups, type StudyGroup, type StudyTopic } from "./study/types";

const AnswerArchitecture = dynamic(() => import("./answer-architecture"), {
  loading: () => <p role="status">Loading topic diagram…</p>,
});

const plan = [
  { title: "Week 1 · Learn the basics", activity: "Study networking, APIs, data modeling, and caching. Draw the URL shortener from memory.", href: "#study/concepts", link: "Start with core concepts" },
  { title: "Week 2 · Learn when components help", activity: "Work through the patterns and technologies. For each one, explain the problem it solves and one cost it adds.", href: "#study/patterns", link: "Study design patterns" },
  { title: "Week 3 · Practice complete designs", activity: "Pick one question a day. Clarify scope, sketch the design, then compare your reasoning with the worked answer.", href: "#study/problems", link: "Choose a practice question" },
  { title: "Week 4 · Rehearse the follow-ups", activity: "Redo weak answers under time pressure. Explain a failure, a scale limit, and an alternative aloud.", href: "#study/advanced", link: "Review advanced topics" },
];

const entries = [
  ...studyTopics.map((item) => ({ name: item.title, summary: item.summary, group: item.group, href: `#study-topic/${item.id}` })),
  ...courseQuestions.map(({ name, problem }) => ({
    name, summary: cases.find((item) => item.id === problem)?.title ?? "",
    group: "problems" as const, href: `#answer/${problem}`,
  })),
  ...pracHubProblems.map(({ title, id, scenario }) => ({ name: title, summary: scenario, group: "problems" as const, href: `#answer/${id}` })),
  ...pracHubStudyMap.map((topic) => ({ ...topic, group: "prachub" as const })),
];

export function StudyGuide({ groupId }: { groupId?: string }) {
  const [query, setQuery] = useState("");
  const group = Object.keys(studyGroups).find((value) => value === groupId) as StudyGroup | undefined;
  const items = entries.filter((entry) => (!group || entry.group === group) && matchesSearch(`${entry.name} ${entry.summary}`, query));

  return (
    <>
      <Heading title="Interview study guide" description={`Learn ${studyTopics.length} topics and practice ${courseQuestions.length + pracHubProblems.length} questions mapped from Hello Interview and PracHub.`} />
      {!group && <section className="panel reading-card study-plan">
        <h2>How to study</h2>
        <p>For a 30-minute session, spend five minutes reviewing a topic, ten drawing a design, ten explaining it aloud, and five checking a mistake or trade-off.</p>
        <ol>
          {plan.map((step) => <li key={step.title}>
            <h3>{step.title}</h3><p>{step.activity}</p><a className="text-link" href={step.href}>{step.link}</a>
          </li>)}
        </ol>
      </section>}
      <section className="study-library" aria-labelledby="study-library-heading">
        <h2 id="study-library-heading">Topics and worked answers</h2>
        <nav aria-label="Study categories" className="filters">
          <a className={`filter ${!group ? "selected" : ""}`} aria-current={!group ? "page" : undefined} href="#study">All topics</a>
          {Object.entries(studyGroups).map(([id, label]) => (
            <a key={id} href={`#study/${id}`} aria-current={group === id ? "page" : undefined} className={`filter ${group === id ? "selected" : ""}`}>{label}</a>
          ))}
        </nav>
        <label className="hub-search study-search">
          <Search size={18} aria-hidden="true" /><span className="sr-only">Search study guide</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search topics or questions" />
        </label>
        <p className="hub-count study-count" role="status">{items.length} {items.length === 1 ? "result" : "results"}</p>
        {items.length === 0 && <p className="panel empty">No matches. Try another term or choose All topics.</p>}
        {(Object.keys(studyGroups) as StudyGroup[]).map((id) => {
          const section = items.filter((item) => item.group === id);
          if (!section.length) return null;
          return (
            <section className="study-category" key={id} aria-labelledby={`study-${id}`}>
              <h3 id={`study-${id}`}>{studyGroups[id]}</h3>
              <ul className="panel study-entries">
                {section.map((item) => (
                  <li key={item.href}><a href={item.href}><strong>{item.name}</strong><span>{item.summary}</span></a></li>
                ))}
              </ul>
            </section>
          );
        })}
      </section>
      <p className="walkthrough-reference">
        <a className="text-link" href={courseSource} target="_blank" rel="noreferrer">Hello Interview course outline</a>
        <a className="text-link" href={pracHubFoundations} target="_blank" rel="noreferrer">PracHub foundations outline</a>
        <a className="text-link" href={pracHubCasebook} target="_blank" rel="noreferrer">PracHub casebook outline</a>
        <a className="text-link" href={pracHubCategory} target="_blank" rel="noreferrer">PracHub system design questions</a>
      </p>
    </>
  );
}

export function StudyTopicPage({ item }: { item: StudyTopic }) {
  const practice = cases.find((entry) => entry.id === item.practice);
  return (
    <>
      <a className="back-link" href={`#study/${item.group}`}>{studyGroups[item.group]}</a>
      <Heading title={item.title} description={item.summary} />
      <article className="panel reading-card walkthrough-panel architecture-card">
        <h2>How it works</h2>
        <p>{item.method}</p>
        <AnswerArchitecture title={item.title} label="study diagram" connections={item.diagram} />
        <h3>Trade-off to explain</h3><p>{item.tradeoff}</p>
        <aside className="interview-explanation">
          <h3>How to say it in an interview</h3>
          <p>“{item.say}”</p>
        </aside>
        {practice && <a className="button primary" href={`#answer/${practice.id}`}><BookOpen size={16} aria-hidden="true" />Try it with {practice.title.toLowerCase().replace(/^design /, "")}</a>}
      </article>
    </>
  );
}

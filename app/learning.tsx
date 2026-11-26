"use client";

import {
  Activity, Bell, BookOpen, Check, ChevronRight, Circle, Clock3, Code2, Gauge,
  Layers3, Link2, ListChecks, MessagesSquare, Network, Play, Route, Sparkles, Target, Ticket, Video, Waypoints,
} from "lucide-react";
import { useState } from "react";
import { cases, lessons, tracks, type Case, type Lesson, type TrackId } from "./catalog";
import { elapsedMinutes, practiceDate, type Progress } from "./model";

const glyphs = {
  activity: Activity, bell: Bell, layers: Layers3, network: Network, sparkles: Sparkles,
  link: Link2, gauge: Gauge, ticket: Ticket, messages: MessagesSquare, video: Video, route: Route,
};

export function Glyph({ name, color, size = 21 }: { name: string; color: string; size?: number }) {
  const Icon = glyphs[name as keyof typeof glyphs] || Network;
  return <span className={`glyph tone-${color}`}><Icon size={size} strokeWidth={1.8} /></span>;
}

export function Heading({ title, description }: { title: string; description?: string }) {
  return <header className="page-heading"><h1>{title}</h1>{description && <p>{description}</p>}</header>;
}

export function CaseCard({ item, mode = "design" }: { item: Case; mode?: "design" | "mock" | "project" }) {
  const href = mode === "project" ? `#project/${item.id}` : `#${mode}/${item.id}`;
  return (
    <a className="panel case-card" href={href}>
      <div className="card-top">
        <Glyph name={item.icon} color={item.color} />
        <span className={`difficulty ${item.level.toLowerCase()}`}>{item.level}</span>
      </div>
      <h3>{item.title}</h3>
      <p>{item.summary}</p>
      <div className="case-meta"><Clock3 size={14} /> {mode === "project" ? "Build project" : `${item.time} min`} <ChevronRight size={16} className="case-chevron" /></div>
    </a>
  );
}

export function Dashboard({ progress }: { progress: Progress }) {
  const track = tracks.find((item) => item.id === progress.profile.track) || tracks[0];
  const path = lessons.filter((lesson) => lesson.track === track.id);
  const next = path.find((lesson) => !progress.completed.includes(lesson.id));
  const done = path.filter((lesson) => progress.completed.includes(lesson.id)).length;
  const study = elapsedMinutes(progress, lessons);
  const primary = next ? `#lesson/${next.id}` : "#learn";
  const remainingCases = cases.filter((item) => !progress.attempts.some((attempt) => attempt.caseId === item.id));
  const upcoming = (track.id === "ai" ? remainingCases.find((item) => item.id === "support-rag") : undefined)
    || remainingCases.find((item) => item.level === track.level) || remainingCases[0] || cases[0];
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekly = lessons.reduce((sum, lesson) => (progress.completedAt[lesson.id] || 0) >= cutoff ? sum + lesson.minutes : sum, 0);
  const interview = progress.profile.target ? Date.parse(progress.profile.target + "T00:00:00") : NaN;

  return (
    <>
      <section className="hero">
        <div className="hero-art" aria-hidden="true" />
        <div className="hero-copy">
          <div className="hero-kicker"><span /> SYSTEM DESIGN WORKSPACE</div>
          <h1>Think in systems.<br /><em>Design with confidence.</em></h1>
          <p>Learn the building blocks, practice real architecture problems, and get ready for your next interview.</p>
          <div className="hero-actions">
            <a href={primary} className="button primary"><Play size={15} fill="currentColor" /> {next ? (done ? "Continue learning" : "Start learning") : "Explore paths"}</a>
            <a href="#practice" className="button hero-secondary">Browse problems</a>
          </div>
        </div>
      </section>

      <section className="stats" aria-label="Your progress">
        <div className="panel stat">
          <span className="stat-icon purple"><BookOpen size={19} /></span>
          <div><span className="stat-label">Lessons completed</span><div className="stat-value">{progress.completed.length}<span> / {lessons.length}</span></div></div>
        </div>
        <div className="panel stat">
          <span className="stat-icon blue"><Waypoints size={19} /></span>
          <div><span className="stat-label">Practice attempts</span><div className="stat-value">{progress.attempts.length}</div></div>
        </div>
        <div className="panel stat">
          <span className="stat-icon green"><Clock3 size={19} /></span>
          <div><span className="stat-label">Study time</span><div className="stat-value">{study}<span> min</span></div></div>
        </div>
      </section>

      <section className="section-split">
        <div>
          <div className="section-heading"><h2>Your learning path</h2><a href="#learn">View paths</a></div>
          <div className="panel path-panel">
            <div className="path-panel-top">
              <Glyph name={track.icon} color={track.color} />
              <div><h3>{track.title}</h3><p>{done} of {path.length} lessons completed</p></div>
              <strong>{Math.round(done / path.length * 100)}%</strong>
            </div>
            <progress value={done} max={path.length} aria-label="Learning path completion" />
            {progress.profile.name && <p className="path-goal">{weekly} / {progress.profile.weeklyMinutes} min this week{Number.isFinite(interview) && ` · Interview ${practiceDate(interview)}`}</p>}
            <div className="lesson-list">
              {path.slice(Math.min(next ? path.indexOf(next) : 0, Math.max(0, path.length - 3))).slice(0, 3).map((lesson) => (
                <LessonRow key={lesson.id} lesson={lesson} complete={progress.completed.includes(lesson.id)} current={next?.id === lesson.id} />
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className="section-heading"><h2>Next up</h2></div>
          <div className="panel next-up">
            <div className="next-up-content"><span className="small-icon green"><Target size={18} /></span><div><h3>{upcoming.title}</h3><p>{upcoming.level} · {upcoming.time} min practice</p></div></div>
            <a className="button neutral" href={`#design/${upcoming.id}`}>Start practice</a>
          </div>
          <a className="panel coach-teaser" href="#tutor">
            <span className="small-icon purple"><Sparkles size={18} /></span><div><h3>Design tutor</h3><p>Ask about a concept or design decision.</p></div><ChevronRight size={17} />
          </a>
        </div>
      </section>

      <section className="section-tail">
        <div className="section-heading"><h2>Popular practice problems</h2><a href="#practice">View problem bank</a></div>
        <div className="case-grid">{cases.slice(0, 3).map((item) => <CaseCard key={item.id} item={item} />)}</div>
      </section>
    </>
  );
}

function LessonRow({ lesson, complete, current }: { lesson: Lesson; complete: boolean; current?: boolean }) {
  return (
    <a className={`lesson-row ${current ? "current" : ""}`} href={`#lesson/${lesson.id}`}>
      <span className={`lesson-status ${complete ? "done" : ""}`}>{complete ? <Check size={15} /> : current ? <Play size={12} fill="currentColor" /> : <Circle size={14} />}</span>
      <span>{lesson.title}</span><span className="lesson-time">{lesson.minutes} min</span><ChevronRight size={15} />
    </a>
  );
}

export function Learning({ progress, chooseTrack }: { progress: Progress; chooseTrack: (id: TrackId) => void }) {
  const selected = tracks.find((track) => track.id === progress.profile.track) || tracks[0];
  return (
    <>
      <Heading title="Learning paths" description="Study the concepts in order and check your understanding as you go." />
      <div className="track-grid">
        {tracks.map((track) => (
          <button key={track.id} className={`panel track-card ${track.id === selected.id ? "selected" : ""}`}
            onClick={() => chooseTrack(track.id)} aria-pressed={track.id === selected.id}>
            <Glyph name={track.icon} color={track.color} />
            <div><h3>{track.title}</h3><p>{track.description}</p><span className={`difficulty ${track.level.toLowerCase()}`}>{track.level}</span></div>
          </button>
        ))}
      </div>
      <div className="section-heading section-spaced"><h2>{selected.title}</h2></div>
      <div className="panel catalog-lessons">
        {lessons.filter((lesson) => lesson.track === selected.id).map((lesson) =>
          <LessonRow key={lesson.id} lesson={lesson} complete={progress.completed.includes(lesson.id)} />)}
      </div>
    </>
  );
}

export function LessonPage({ lesson, choice, completed, onCheck }: {
  lesson: Lesson; choice?: number; completed: boolean; onCheck: (choice: number) => void;
}) {
  const [selected, setSelected] = useState<number | undefined>(choice);
  const [checked, setChecked] = useState(choice !== undefined);
  const correct = checked && selected === lesson.quiz.correct;
  const trackLessons = lessons.filter((item) => item.track === lesson.track);
  const next = trackLessons[trackLessons.findIndex((item) => item.id === lesson.id) + 1];
  return (
    <div className="reading-layout">
      <article>
        <a className="back-link" href="#learn">Learning paths</a>
        <Heading title={lesson.title} description={lesson.summary} />
        <div className="inline-meta"><Clock3 size={16} /> {lesson.minutes} min {completed && <span className="difficulty beginner"><Check size={13} /> Completed</span>}</div>
        <section className="panel reading-card">
          <h2>How it works</h2>
          {lesson.principles.map((principle) => <p key={principle}>{principle}</p>)}
          <div className="callout"><Code2 size={19} /><div><h3>Engineering example</h3><p>{lesson.example}</p></div></div>
          <h2>Try it</h2><p>{lesson.exercise}</p>
          <a className="text-link" href={lesson.source.url} target="_blank" rel="noreferrer">{lesson.source.label}</a>
        </section>
      </article>
      <aside className="panel reading-card quiz">
        <span className="small-icon purple"><ListChecks size={19} /></span>
        <h2>Check your understanding</h2>
        <p>{lesson.quiz.question}</p>
        <fieldset className="quiz-options">
          <legend className="sr-only">Choose one answer</legend>
          {lesson.quiz.options.map((option, index) => (
            <label key={option} className={`quiz-option ${selected === index ? "selected" : ""}`}>
              <input type="radio" name="quiz" checked={selected === index} onChange={() => { setSelected(index); setChecked(false); }} />
              <span>{option}</span>
            </label>
          ))}
        </fieldset>
        <button className="button primary" disabled={selected === undefined} onClick={() => {
          if (selected === undefined) return;
          setChecked(true);
          onCheck(selected);
        }}>Check answer</button>
        {checked && <div className={`answer ${correct ? "correct" : ""}`} role="status"><strong>{correct ? "Correct" : "Try again"}</strong><p>{correct ? lesson.quiz.explanation : "Review the example and choose another answer."}</p></div>}
        {completed && <a className="button neutral" href={next ? `#lesson/${next.id}` : "#practice"}>{next ? "Next lesson" : "Practice a design"}</a>}
      </aside>
    </div>
  );
}

export function CaseLibrary({ mode }: { mode: "design" | "mock" | "project" }) {
  const [level, setLevel] = useState("All levels");
  const list = cases.filter((item) => (mode !== "project" || item.project) && (level === "All levels" || item.level === level));
  const copy = {
    design: ["Problem bank", "Work through original system design prompts and compare your attempts."],
    mock: ["Mock interviews", "Practice one question at a time in a timed, guided interview."],
    project: ["Build projects", "Turn architectural decisions into working services and verify the behavior under load."],
  }[mode];
  return (
    <>
      <Heading title={copy[0]} description={copy[1]} />
      <div className="filters" aria-label="Difficulty">
        {["All levels", "Beginner", "Intermediate", "Advanced"].map((value) =>
          <button key={value} className={`filter ${level === value ? "selected" : ""}`} aria-pressed={level === value} onClick={() => setLevel(value)}>{value}</button>)}
      </div>
      <div className="case-grid">{list.map((item) => <CaseCard key={item.id} item={item} mode={mode} />)}</div>
      {list.length === 0 && <div className="panel empty">There are no projects at this level yet.</div>}
    </>
  );
}

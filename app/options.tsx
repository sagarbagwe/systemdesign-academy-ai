"use client";

import { ArrowUp, BookOpen, Download, MessageSquare, Sparkles } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { api, hasAccountServer, type Account, type Capabilities, type TutorReply } from "./api";
import { lessons, tracks, type TrackId } from "./catalog";
import { Heading } from "./learning";
import type { Progress, Profile } from "./model";

const suggestedQuestions = ["How do I retry a failed write?", "When should I add a cache?", "How do I estimate peak load?"];
const tutorKeywords: Record<string, string[]> = {
  requirements: ["requirement", "constraint", "latency", "features", "scope"],
  capacity: ["capacity", "throughput", "estimate", "peak", "load", "storage"],
  retries: ["retry", "retries", "idempotency", "timeout", "request key", "failed write"],
  "data-model": ["schema", "database", "index", "sql", "unique"],
  caching: ["cache", "caching", "ttl", "redis", "stale"],
  "load-balancing": ["overload", "balancer", "backpressure", "saturation", "rate limit"],
  consistency: ["consistency", "replication", "failover", "primary", "partition"],
  messaging: ["queue", "outbox", "notification", "delivery", "message", "kafka"],
  slo: ["slo", "recovery", "backup", "rpo", "rto", "objective"],
  retrieval: ["retrieval", "rag", "llm", "vector", "embeddings", "ai"],
};

function localAnswer(question: string): TutorReply {
  const searchable = question.toLowerCase();
  const rankings = lessons.map((lesson) => ({
    lesson,
    matches: tutorKeywords[lesson.id].filter((term) => new RegExp(`\\b${term}\\b`).test(searchable)).length,
  })).sort((first, second) => second.matches - first.matches);
  const best = rankings[0];
  if (!best?.matches) {
    return { answer: "I couldn’t match that question to a lesson. Ask about a topic such as idempotency, replication, queues, caching, or retrieval.", lessonId: null };
  }
  return { answer: [best.lesson.principles[0], best.lesson.principles[1], best.lesson.example].join("\n\n"), lessonId: best.lesson.id };
}

export function Tutor({ live }: { live: boolean }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Array<{ question: string; reply?: TutorReply; error?: string }>>([]);
  const [pending, setPending] = useState(false);

  async function send(value: string) {
    const trimmed = value.trim();
    if (!trimmed || pending) return;
    setQuestion("");
    setPending(true);
    try {
      const reply = live ? await api<TutorReply>("/api/tutor", "POST", { question: trimmed }) : localAnswer(trimmed);
      setMessages((previous) => [...previous, { question: trimmed, reply }]);
    } catch (error) {
      setMessages((previous) => [...previous, {
        question: trimmed,
        reply: localAnswer(trimmed),
        error: error instanceof Error ? error.message : "The live tutor didn’t respond.",
      }]);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Heading title="Design tutor" description={live ? "Ask for help with a concept, trade-off, or system design decision." : "Get answers from the academy lesson library."} />
      <section className="panel chat">
        <div className="chat-top"><span className="small-icon purple"><Sparkles size={18} /></span><div><h2>Design tutor</h2><p>{live ? "AI tutor · curriculum sources" : "Curriculum guide"}</p></div></div>
        <div className="chat-content" aria-live="polite">
          {messages.length === 0 && <div className="chat-empty"><span className="small-icon purple"><MessageSquare size={22} /></span><h3>What are you designing?</h3><div className="suggestions">
            {suggestedQuestions.map((value) => <button key={value} className="filter" onClick={() => void send(value)} disabled={pending}>{value}</button>)}
          </div></div>}
          {messages.map((message, index) => {
            const lesson = lessons.find((item) => item.id === message.reply?.lessonId);
            return <div className="messages" key={index}>
              <p className="message-user">{message.question}</p>
              <div className="message-tutor">
                {message.error && <p className="muted">{message.error} Showing curriculum guidance.</p>}
                {message.reply?.answer.split("\n\n").map((part, at) => <p key={at}>{part}</p>)}
                {lesson && <a className="text-link" href={`#lesson/${lesson.id}`}><BookOpen size={15} /> {lesson.title}</a>}
              </div>
            </div>;
          })}
          {pending && <p className="muted">Preparing a response…</p>}
        </div>
        <form className="chat-form" onSubmit={(event) => { event.preventDefault(); void send(question); }}>
          <label className="sr-only" htmlFor="question">Ask a question</label>
          <input id="question" placeholder="Ask about a concept…" value={question} maxLength={1200} onChange={(event) => setQuestion(event.target.value)} />
          <button className="button primary" disabled={pending || !question.trim()} type="submit" aria-label="Send question"><ArrowUp size={19} /></button>
        </form>
      </section>
    </>
  );
}

export function Settings({ profile, changeProfile, account, capabilities, authenticate, logout, sync, restore, progress }: {
  profile: Profile; changeProfile: (profile: Profile) => void; account: Account | null; capabilities: Capabilities;
  authenticate: (mode: "login" | "register", email: string, password: string) => Promise<void>;
  logout: () => Promise<void>; sync: () => Promise<string>; restore: () => Promise<string>; progress: Progress;
}) {
  const [draft, setDraft] = useState(profile);
  const [message, setMessage] = useState("");
  const [accountMessage, setAccountMessage] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [pending, setPending] = useState(false);

  useEffect(() => { setDraft(profile); }, [profile]);

  async function enter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await accountAction(async () => { await authenticate(mode, String(form.get("email")), String(form.get("password"))); return "Signed in."; });
  }

  async function accountAction(action: () => Promise<string>) {
    setAccountMessage("");
    setPending(true);
    try { setAccountMessage(await action()); }
    catch (error) { setAccountMessage(error instanceof Error ? error.message : "The operation did not complete."); }
    finally { setPending(false); }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(progress, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url; link.download = "systemdesign-academy-progress.json"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function billing(path: "checkout" | "portal") {
    const { url } = await api<{ url: string }>(`/api/billing/${path}`, "POST");
    window.location.assign(url);
    return "Opening secure billing…";
  }

  return (
    <>
      <Heading title="Workspace settings" description="Personalize your study plan and manage your progress." />
      <div className="settings-grid">
        <form className="panel reading-card settings-card" onSubmit={(event) => {
          event.preventDefault();
          changeProfile({ ...draft, name: draft.name.trim(), target: draft.target.trim(), completedProjects: profile.completedProjects });
          setMessage("Study plan saved.");
        }}>
          <h2>Study plan</h2>
          <label className="field"><span>Display name</span><input value={draft.name} maxLength={60} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Your name" /></label>
          <label className="field"><span>Learning path</span><select value={draft.track} onChange={(event) => setDraft({ ...draft, track: event.target.value as TrackId })}>
            {tracks.map((value) => <option key={value.id} value={value.id}>{value.title}</option>)}</select></label>
          <label className="field"><span>Interview date</span><input type="date" value={draft.target} onChange={(event) => setDraft({ ...draft, target: event.target.value })} /></label>
          <label className="field"><span>Weekly study goal (minutes)</span><input type="number" min={15} max={2400} step={15} required value={draft.weeklyMinutes} onChange={(event) => setDraft({ ...draft, weeklyMinutes: Number(event.target.value) })} /></label>
          <button className="button primary" type="submit">Save study plan</button>
          {message && <p className="answer correct" role="status">{message}</p>}
        </form>
        <div>
          {hasAccountServer && <section className="panel reading-card settings-card">
            <h2>Account</h2>
            {account ? <>
              <p>{account.email} · {account.pro ? "Pro" : "Free"}</p>
              <p>Sync a copy of this workspace to use it on another device.</p>
              <div className="button-wrap">
                <button className="button primary" disabled={pending} onClick={() => void accountAction(sync)}>Sync workspace</button>
                <button className="button neutral" disabled={pending} onClick={() => void accountAction(restore)}>Restore cloud copy</button>
                <button className="button neutral" disabled={pending} onClick={() => void accountAction(async () => { await logout(); return "Signed out."; })}>Sign out</button>
              </div>
              {capabilities.billing && <div className="plan"><h3>{account.pro ? "Pro subscription" : "Academy Pro"}</h3><p>View current pricing and manage your plan through Stripe.</p>
                <button className="button neutral" disabled={pending} onClick={() => void accountAction(() => billing(account.pro ? "portal" : "checkout"))}>{account.pro ? "Manage subscription" : "View Pro checkout"}</button></div>}
            </> : <form onSubmit={enter}>
              <label className="field"><span>Email</span><input required type="email" name="email" autoComplete="email" maxLength={254} /></label>
              <label className="field"><span>Password</span><input required type="password" name="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "register" ? 12 : 1} maxLength={128} /></label>
              <div className="button-wrap">
                <button className="button primary" type="submit" disabled={pending}>{mode === "login" ? "Sign in" : "Create account"}</button>
                <button className="button neutral" type="button" disabled={pending} onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Create an account" : "Use an existing account"}</button>
              </div>
            </form>}
            {accountMessage && <p className="answer" role="status">{accountMessage}</p>}
          </section>}
          <section className="panel reading-card settings-card">
            <h2>Progress data</h2><p>Lessons, drafts and practice results are saved in this browser. Export a copy for your records.</p>
            <button className="button neutral" onClick={download}><Download size={16} /> Export progress</button>
          </section>
        </div>
      </div>
    </>
  );
}

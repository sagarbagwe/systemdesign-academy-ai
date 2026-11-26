"use client";

import {
  BookOpen, ChevronRight, ChevronsUpDown, CircleHelp, CodeXml, GraduationCap, Layers3, LayoutDashboard, Menu, Mic,
  Search, Settings2, Sparkles, Target, Waypoints, X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { api, ApiError, hasAccountServer, type Account, type Capabilities, type WorkspaceSnapshot } from "./api";
import { lessons, tracks, type TrackId } from "./catalog";
import { cases, caseSearchText, matchesSearch } from "./problems";
import { CaseLibrary, Dashboard, Heading, Learning, LessonPage } from "./learning";
import { blankDraft, draftId, emptyProgress, loadProgress, reviewDraft, storageKey, type Attempt, type Draft, type Mode, type Progress } from "./model";
import { Settings, Tutor } from "./options";
import { PracticeEditor, ProgressPage, ProjectPage, Report } from "./practice";
import { defaultHubFilters, PracticeHub } from "./practice-hub";
import WorkedSolution from "./worked-solution";
import { StudyGuide, StudyTopicPage } from "./study-guide";
import { studyTopics } from "./study";

const menus = [
  { title: "WORKSPACE", items: [
    { route: "overview", title: "Overview", icon: LayoutDashboard },
    { route: "learn", title: "Learning paths", icon: BookOpen },
    { route: "study", title: "Interview study guide", icon: GraduationCap },
    { route: "practice", title: "Practice Hub", icon: Target },
    { route: "projects", title: "Build projects", icon: CodeXml },
  ] },
  { title: "PRACTICE TOOLS", items: [
    { route: "mocks", title: "Mock interviews", icon: Mic },
    { route: "tutor", title: "Design tutor", icon: Sparkles },
    { route: "progress", title: "Your progress", icon: Waypoints },
  ] },
];

function navigate(route: string) {
  window.location.hash = route;
}

function readLocal(key: string) {
  try { return window.localStorage.getItem(key); }
  catch { return null; }
}

function accountDraft(accountId: string): { revision: number; data: Progress } | null {
  try {
    const raw = readLocal(`${storageKey}:${accountId}`);
    if (!raw) return null;
    const entry = JSON.parse(raw) as WorkspaceSnapshot;
    return { revision: entry.revision, data: loadProgress(JSON.stringify(entry.data)) };
  } catch {
    return null;
  }
}

function SearchDialog({ open, close }: { open: boolean; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  useEffect(() => {
    const dialog = ref.current;
    if (open && dialog && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog?.open) {
      dialog.close();
    }
  }, [open]);
  const matched = [
    ...lessons.map((lesson) => ({ href: `lesson/${lesson.id}`, title: lesson.title, description: lesson.summary, group: "Lesson", search: `${lesson.title} ${lesson.summary}` })),
    ...studyTopics.map((item) => ({ href: `study-topic/${item.id}`, title: item.title, description: item.summary, group: "Study topic", search: `${item.title} ${item.summary}` })),
    ...cases.map((item) => ({ href: `design/${item.id}`, title: item.title, description: item.summary, group: "Problem", search: caseSearchText(item) })),
  ].filter((item) => matchesSearch(item.search, query)).slice(0, 8);
  return (
    <dialog ref={ref} onClose={close} className="search-dialog">
      <div className="search-input-row">
        <Search size={20} /><input aria-label="Search lessons and problems" placeholder="Search lessons and problems" value={query} autoFocus onChange={(event) => setQuery(event.target.value)} />
        <button className="icon-button" aria-label="Close search" onClick={close}><X size={18} /></button>
      </div>
      <div className="search-results">
        {matched.map((item) => <a className="search-result" key={item.href} href={`#${item.href}`} onClick={close}>
          <div><strong>{item.title}</strong><small>{item.description}</small></div><span>{item.group}</span>
        </a>)}
        {matched.length === 0 && <p className="empty">No matching lessons or problems.</p>}
      </div>
    </dialog>
  );
}

export default function Workspace() {
  const [route, setRoute] = useState("overview");
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [ready, setReady] = useState(false);
  const [writable, setWritable] = useState(true);
  const [search, setSearch] = useState(false);
  const [hubFilters, setHubFilters] = useState(defaultHubFilters);
  const [drawer, setDrawer] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [revision, setRevision] = useState(0);
  const [capabilities, setCapabilities] = useState<Capabilities>({ tutor: false, billing: false });

  useEffect(() => {
    function readRoute() {
      setRoute(window.location.hash.slice(1) || "overview");
      setDrawer(false);
      window.scrollTo(0, 0);
    }
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawer(false);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearch(true);
      }
    }
    readRoute();
    setProgress(loadProgress(readLocal(storageKey)));
    setReady(true);
    window.addEventListener("hashchange", readRoute);
    document.addEventListener("keydown", keyboard);
    return () => {
      window.removeEventListener("hashchange", readRoute);
      document.removeEventListener("keydown", keyboard);
    };
  }, []);

  useEffect(() => {
    if (!hasAccountServer) return;
    let active = true;
    void api<Capabilities>("/api/capabilities").then((result) => { if (active) setCapabilities(result); }).catch(() => {});
    void api<Account>("/api/auth/me").then(async (user) => {
      const local = accountDraft(user.id);
      const snapshot = local ?? await api<WorkspaceSnapshot>("/api/workspace");
      if (!active) return;
      setProgress(snapshot.data ? loadProgress(JSON.stringify(snapshot.data)) : loadProgress(readLocal(storageKey)));
      setRevision(snapshot.revision);
      setAccount(user);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      if (account) window.localStorage.setItem(`${storageKey}:${account.id}`, JSON.stringify({ revision, data: progress }));
      else window.localStorage.setItem(storageKey, JSON.stringify(progress));
      setWritable(true);
    } catch {
      setWritable(false);
    }
  }, [progress, ready, account, revision]);

  function chooseTrack(track: TrackId) {
    setProgress((value) => ({ ...value, profile: { ...value.profile, track } }));
  }

  async function authenticate(mode: "login" | "register", email: string, password: string) {
    const user = await api<Account>(`/api/auth/${mode}`, "POST", { email, password });
    const local = accountDraft(user.id);
    const snapshot = local ?? await api<WorkspaceSnapshot>("/api/workspace");
    setProgress(snapshot.data ? loadProgress(JSON.stringify(snapshot.data)) : progress);
    setRevision(snapshot.revision);
    setAccount(user);
  }

  async function logout() {
    await api<void>("/api/auth/logout", "POST");
    setAccount(null);
    setRevision(0);
    setProgress(loadProgress(readLocal(storageKey)));
  }

  async function sync() {
    try {
      const snapshot = await api<WorkspaceSnapshot>("/api/workspace", "PUT", { revision, data: progress });
      setRevision(snapshot.revision);
      return "Workspace synced.";
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        throw new Error("A newer copy exists. Export this device’s progress before restoring the cloud copy.");
      }
      throw error;
    }
  }

  async function restore() {
    const snapshot = await api<WorkspaceSnapshot>("/api/workspace");
    if (!snapshot.data) return "No cloud copy has been saved.";
    if (!window.confirm("Replace this browser’s workspace with the cloud copy? Export first to keep the local version.")) return "Local progress kept.";
    setRevision(snapshot.revision);
    setProgress(loadProgress(JSON.stringify(snapshot.data)));
    return "Cloud copy restored.";
  }

  const [view, id, parentId] = route.split("/");
  const current = { lesson: "learn", "study-topic": "study", design: "practice", answer: "practice", mock: "mocks", project: "projects", report: "progress" }[view] || view;
  const currentTitle = menus.flatMap((menu) => menu.items).find((item) => item.route === current)?.title || "Settings";
  const activeTrack = tracks.find((item) => item.id === progress.profile.track) || tracks[0];
  const initials = progress.profile.name ? progress.profile.name.split(/\s+/).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") : "S";
  const item = cases.find((value) => value.id === id);
  const lesson = lessons.find((value) => value.id === id);
  const attempt = progress.attempts.find((value) => value.id === id);
  let content: ReactNode = <div className="panel empty"><Heading title="Page not found" /><a className="button neutral" href="#overview">Return to overview</a></div>;

  if (view === "overview") content = <Dashboard progress={progress} />;
  if (view === "learn") content = <Learning progress={progress} chooseTrack={chooseTrack} />;
  if (view === "study") content = <StudyGuide groupId={id} />;
  if (view === "study-topic") {
    const topic = studyTopics.find((entry) => entry.id === id);
    if (topic) content = <StudyTopicPage item={topic} />;
  }
  if (view === "practice") content = <PracticeHub filters={hubFilters} setFilters={setHubFilters} />;
  if (view === "answer" && item) content = <WorkedSolution key={item.id} item={item} stepId={parentId} />;
  if (view === "mocks") content = <CaseLibrary key="mock" mode="mock" />;
  if (view === "projects") content = <CaseLibrary key="project" mode="project" />;
  if (view === "progress") content = <ProgressPage progress={progress} />;
  if (view === "tutor") content = <Tutor live={Boolean(account && capabilities.tutor)} />;
  if (view === "settings") content = <Settings
    key={account?.id || "guest"} profile={progress.profile} changeProfile={(profile) => setProgress((value) => ({ ...value, profile }))}
    account={account} capabilities={capabilities} authenticate={authenticate} logout={logout} sync={sync} restore={restore} progress={progress} />;

  if (view === "lesson" && lesson) content = <LessonPage key={lesson.id} lesson={lesson}
    choice={progress.quizChoices[lesson.id]} completed={progress.completed.includes(lesson.id)}
    onCheck={(choice) => setProgress((value) => {
      const completesLesson = choice === lesson.quiz.correct && !value.completed.includes(lesson.id);
      return {
        ...value,
        quizChoices: { ...value.quizChoices, [lesson.id]: choice },
        completed: completesLesson ? [...value.completed, lesson.id] : value.completed,
        completedAt: completesLesson ? { ...value.completedAt, [lesson.id]: Date.now() } : value.completedAt,
      };
    })} />;

  if (view === "project" && item?.project) content = <ProjectPage item={item}
    done={progress.profile.completedProjects.includes(item.id)}
    toggle={() => setProgress((value) => ({
      ...value,
      profile: { ...value.profile, completedProjects: value.profile.completedProjects.includes(item.id)
        ? value.profile.completedProjects.filter((selected) => selected !== item.id) : [...value.profile.completedProjects, item.id] },
    }))} />;

  if ((view === "design" || view === "mock") && item) {
    const mode: Mode = view;
    const parent = progress.attempts.find((value) => value.id === parentId && value.caseId === item.id && value.mode === mode);
    const key = draftId(item.id, mode, parent?.id);
    const draft = progress.drafts[key] || blankDraft();
    const update = (value: Draft) => setProgress((previous) => ({ ...previous, drafts: { ...previous.drafts, [key]: value } }));
    content = <PracticeEditor key={key} item={item} mode={mode} draft={draft} update={update} parent={parent} saved={writable && Boolean(progress.drafts[key])} submit={() => {
      if (!draft.notes.some((note) => note.trim())) return;
      const result: Attempt = { ...draft, id: crypto.randomUUID(), caseId: item.id, mode, parentId: parent?.id, submittedAt: Date.now(), review: reviewDraft(item, draft) };
      setProgress((previous) => {
        const drafts = { ...previous.drafts };
        delete drafts[key];
        return { ...previous, drafts, attempts: [result, ...previous.attempts] };
      });
      navigate(`report/${result.id}`);
    }} />;
  }

  if (view === "report" && attempt) {
    const problem = cases.find((value) => value.id === attempt.caseId);
    const previous = progress.attempts.find((value) => value.id === attempt.parentId);
    if (problem) content = <Report attempt={attempt} previous={previous} item={problem} />;
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); document.getElementById("main-content")?.focus(); }}>Skip to content</a>
      {drawer && <button className="drawer-overlay" aria-label="Close navigation" onClick={() => setDrawer(false)} />}
      <aside className={`sidebar ${drawer ? "open" : ""}`}>
        <a className="brand" href="#overview" onClick={() => setDrawer(false)}>
          <span className="brand-mark"><Layers3 size={21} strokeWidth={2.3} /></span>
          <span>SystemDesign<small>ACADEMY AI</small></span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          {menus.map((group) => <div className="nav-group" key={group.title}>
            <p>{group.title}</p>
            {group.items.map((entry) => <a href={`#${entry.route}`} key={entry.route} aria-current={current === entry.route ? "page" : undefined} onClick={() => setDrawer(false)}>
              <entry.icon size={17} strokeWidth={1.8} />{entry.title}
            </a>)}
          </div>)}
        </nav>
        <div className="sidebar-footer">
          <a className="help-link" href="#settings" onClick={() => setDrawer(false)}><CircleHelp size={17} /> Workspace settings</a>
          <a className="study-tile" href="#settings" onClick={() => setDrawer(false)}><span className="small-icon purple"><BookOpen size={17} /></span>
            <span><strong>Study plan</strong><small>{activeTrack.level} path</small></span><ChevronsUpDown size={15} /></a>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <button className="icon-button menu-button" aria-label={drawer ? "Close menu" : "Open menu"} aria-expanded={drawer} onClick={() => setDrawer(!drawer)}>{drawer ? <X size={22} /> : <Menu size={22} />}</button>
          <div className="breadcrumbs"><a href="#overview">Workspace</a><ChevronRight size={15} /><span>{currentTitle}</span></div>
          <div className="top-actions">
            <button className="search-trigger" aria-label="Search workspace" onClick={() => setSearch(true)}><Search size={16} /><span>Search anything</span><kbd>⌘ K</kbd></button>
            <a className="icon-button settings-button" href="#settings" title="Workspace settings" aria-label="Workspace settings"><Settings2 size={19} /></a>
            <a className="avatar" href="#settings" title={progress.profile.name || "Your study profile"} aria-label="Your study profile">{initials}</a>
          </div>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
          {ready && !writable && <p className="storage-error" role="alert">Browser storage is unavailable. Export your progress before closing this page.</p>}
          {content}
        </main>
      </div>
      <SearchDialog open={search} close={() => setSearch(false)} />
    </div>
  );
}

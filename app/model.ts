import type { Case, Lesson, TrackId } from "./catalog";

export const sections = [
  { title: "Requirements", prompt: "Who uses the system, what must they do, and what success guarantees matter?", hint: "Name the primary actions and one measurable constraint." },
  { title: "API & data", prompt: "Define the main operations, durable data, and invariants.", hint: "Explain who can write, how records are identified, and what prevents a duplicate." },
  { title: "Architecture", prompt: "Trace a request through the components and describe where work is synchronous.", hint: "Trace one successful request from caller to storage and response." },
  { title: "Scale & reliability", prompt: "Estimate peak load and describe the behavior during a partial failure.", hint: "Include a numerical workload assumption and one failure or recovery path." },
  { title: "Trade-offs", prompt: "Compare two viable choices under the same requirements.", hint: "Name a real alternative and the cost of choosing it." },
] as const;

export const components = ["Client", "Load balancer", "API gateway", "API service", "Worker", "Cache", "Database", "Message queue", "Object storage", "CDN", "Vector index", "Model API"] as const;
export type Component = typeof components[number];
export type Mode = "design" | "mock";
export type Node = { id: string; label: Component };
export type Edge = { from: string; to: string };
export type Draft = { notes: string[]; nodes: Node[]; edges: Edge[]; startedAt: number | null };
export type Evidence = { title: string; points: number; quote: string; advice: string };
export type Attempt = Draft & {
  id: string;
  caseId: string;
  mode: Mode;
  parentId?: string;
  submittedAt: number;
  review: Evidence[];
};
export type Profile = {
  name: string;
  track: TrackId;
  target: string;
  weeklyMinutes: number;
  completedProjects: string[];
};
export type Progress = {
  version: 1;
  profile: Profile;
  completed: string[];
  completedAt: Record<string, number>;
  quizChoices: Record<string, number>;
  drafts: Record<string, Draft>;
  attempts: Attempt[];
};

export const storageKey = "systemdesign-academy:v1";
export const defaultProfile: Profile = {
  name: "", track: "foundations", target: "", weeklyMinutes: 120, completedProjects: [],
};
export const emptyProgress: Progress = {
  version: 1, profile: defaultProfile, completed: [], completedAt: {}, quizChoices: {}, drafts: {}, attempts: [],
};

export function blankDraft(): Draft {
  return { notes: sections.map(() => ""), nodes: [], edges: [], startedAt: null };
}

export function loadProgress(raw: string | null): Progress {
  if (!raw) return emptyProgress;
  try {
    const data = JSON.parse(raw) as Partial<Progress> | null;
    if (data?.version !== 1 || !data.profile || !Array.isArray(data.completed)
      || !Array.isArray(data.attempts) || !data.drafts || !data.quizChoices) return emptyProgress;
    return { ...emptyProgress, ...data, profile: { ...defaultProfile, ...data.profile } };
  } catch {
    return emptyProgress;
  }
}

export function draftId(caseId: string, mode: Mode, parentId?: string) {
  return [caseId, mode, parentId].filter(Boolean).join(":");
}

export function reviewDraft(problem: Case, draft: Draft): Evidence[] {
  return sections.map((section, index) => {
    const answer = draft.notes[index]?.trim() || "";
    const lowered = answer.toLowerCase();
    const signals = problem.terms[index].filter((term) => lowered.includes(term));
    const enoughDetail = answer.split(/\s+/).length >= 18;
    const points = Math.min(3, signals.length + (signals.length > 0 && enoughDetail ? 1 : 0));
    const sentence = answer.split(/(?<=[.!?])\s+|\n/).find((line) =>
      signals.some((term) => line.toLowerCase().includes(term)),
    );
    const advice = points < 3
      ? section.hint + " Consider " + problem.terms[index].join(", ") + "."
      : "Check that each decision protects the requirement it is meant to support.";
    return {
      title: section.title,
      points,
      quote: sentence?.slice(0, 220) || "",
      advice,
    };
  });
}

export function totalReview(review: Evidence[]) {
  return review.reduce((total, row) => total + row.points, 0);
}

export function elapsedMinutes(progress: Progress, lessons: readonly Lesson[]) {
  return lessons.reduce((sum, lesson) => progress.completed.includes(lesson.id) ? sum + lesson.minutes : sum, 0);
}

export function practiceDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(timestamp);
}

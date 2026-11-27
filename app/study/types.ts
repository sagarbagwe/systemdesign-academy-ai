import type { DesignConnection } from "../problems/types";

export const studyGroups = {
  concepts: "Core concepts",
  patterns: "Design patterns",
  technologies: "Key technologies",
  advanced: "Advanced topics",
  cases: "Engineering case studies",
  problems: "Interview questions",
  prachub: "PracHub topics",
} as const;

export type StudyGroup = keyof typeof studyGroups;

export type StudyTopic = {
  id: string;
  title: string;
  group: Exclude<StudyGroup, "problems" | "prachub">;
  summary: string;
  method: string;
  tradeoff: string;
  say: string;
  diagram: readonly DesignConnection[];
  practice: string;
};

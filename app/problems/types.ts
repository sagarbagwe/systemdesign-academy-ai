import type { Level } from "../catalog";

export const topics = {
  foundations: "Foundations & LLD",
  traffic: "Networking & caching",
  data: "Storage & search",
  distributed: "Distributed systems & reliability",
  social: "Social & media",
  commerce: "Commerce & finance",
  realtime: "Real-time & location",
  ai: "ML & AI systems",
} as const;

export type Topic = keyof typeof topics;

export type WorkedAnswer = {
  capacity: string;
  path: readonly string[];
  design: string;
  api: string;
  data: string;
  reliability: string;
  tradeoff: string;
};

export type Problem = WorkedAnswer & {
  id: string;
  title: string;
  level: Level;
  scenario: string;
  requirements: readonly [string, string, string];
  concepts: readonly [string, string, string];
  followUp: string;
  aliases?: readonly string[];
};

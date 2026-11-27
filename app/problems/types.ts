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

export type FlowStyle = "sync" | "async" | "reject";
export type DesignConnection = readonly [from: string, to: string, action: string, style?: FlowStyle];

export type AnswerWalkthrough = {
  entities: readonly string[];
  qualityGoal: string;
  flow: readonly string[];
  sayDesign?: string;
};

export type TechnologyChoice = { technology: string; reason: string };

export type TechnologyPlan = {
  storage: TechnologyChoice;
  routing: TechnologyChoice;
  support: TechnologyChoice;
  ingress?: readonly string[];
};

export type DesignSection = {
  title: string;
  description: string;
  connections: readonly string[];
};

export type DesignDetails = {
  assumptions: string;
  endpoints: readonly { request: string; result: string }[];
  records: readonly { name: string; key: string; purpose: string }[];
  sections: readonly DesignSection[];
  deepDives: readonly { title: string; answer: string }[];
};

export type WorkedAnswer = {
  details?: DesignDetails;
  walkthrough: AnswerWalkthrough;
  capacity: string;
  diagram: readonly DesignConnection[];
  implementation?: readonly { label: string; text: string }[];
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

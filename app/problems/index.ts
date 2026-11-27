import { starterCases, type Case, type Level } from "../catalog";
import { courseQuestions } from "../study/course-questions";
import { ai } from "./ai";
import { commerce } from "./commerce";
import { courseProblems } from "./course-problems";
import { data } from "./data";
import { distributed } from "./distributed";
import { eventTickets } from "./event-tickets";
import { foundations } from "./foundations";
import { realtime } from "./realtime";
import { social } from "./social";
import { starterAnswers } from "./starter";
import { traffic } from "./traffic";
import { technologyPlans } from "./technology-plans";
import { topics, type DesignConnection, type Problem, type TechnologyPlan, type Topic, type WorkedAnswer } from "./types";

const metadata: Record<Topic, { icon: string; color: string; lessonId: string; entries: Problem[] }> = {
  foundations: { icon: "layers", color: "purple", lessonId: "requirements", entries: foundations },
  traffic: { icon: "gauge", color: "green", lessonId: "load-balancing", entries: traffic },
  data: { icon: "database", color: "blue", lessonId: "data-model", entries: data },
  distributed: { icon: "network", color: "purple", lessonId: "consistency", entries: distributed },
  social: { icon: "messages", color: "blue", lessonId: "caching", entries: social },
  commerce: { icon: "ticket", color: "orange", lessonId: "retries", entries: commerce },
  realtime: { icon: "route", color: "green", lessonId: "capacity", entries: realtime },
  ai: { icon: "sparkles", color: "purple", lessonId: "retrieval", entries: ai },
};

const duration: Record<Level, number> = { Beginner: 25, Intermediate: 30, Advanced: 40 };

function toCase(problem: Problem, topic: Topic): Omit<Case, "technology"> {
  const { id, title, level, concepts, scenario, requirements, aliases = [], followUp, ...answer } = problem;
  const { lessonId, icon, color } = metadata[topic];
  return {
    id, title, level, topic, concepts, scenario, requirements, aliases, answer,
    icon, color, lessonId, summary: requirements[0], retry: followUp, time: duration[level],
    terms: [
      ["requirement", "latency", "target"],
      ["key", "version", "state"],
      [...concepts.map((concept) => concept.toLowerCase()), "request"],
      ["retry", "peak", "failure"],
      ["trade-off", "alternative", "cost"],
    ],
  };
}

function addLoadBalancer(answer: WorkedAnswer, technology: TechnologyPlan): WorkedAnswer {
  const routedActions = new Set(technology.ingress);
  if (routedActions.size === 0) return answer;

  const layerFour = technology.routing.technology.includes("Network Load Balancer");
  const balancer = layerFour ? "L4 load balancer" : "L7 load balancer";
  const protocol = layerFour ? "TCP" : "HTTPS";
  const ingressByAction = new Map<string, string>();
  const sources = new Set<string>();
  const diagram = answer.diagram.flatMap((edge): DesignConnection[] => {
    const [from, to, action, style] = edge;
    if (!routedActions.has(action)) return [edge];

    const ingress = `${protocol} from ${from}`;
    ingressByAction.set(action, ingress);
    const forwarded = [balancer, to, action, style] as const;
    if (sources.has(from)) return [forwarded];
    sources.add(from);
    return [[from, balancer, ingress], forwarded];
  });

  const flow = [...new Set(answer.walkthrough.flow.flatMap((action) => {
    const ingress = ingressByAction.get(action);
    return ingress ? [ingress, action] : [action];
  }))];

  return { ...answer, diagram, walkthrough: { ...answer.walkthrough, flow } };
}

function withTechnology(item: Omit<Case, "technology">): Case {
  const technology = technologyPlans[item.id];
  if (!technology) throw new Error(`Missing technology plan for ${item.id}`);
  return { ...item, technology, answer: addLoadBalancer(item.answer, technology) };
}

export const cases: Case[] = [
  ...starterCases.map((item) => {
    const { topic, aliases = [], ...answer } = starterAnswers[item.id];
    return { ...item, topic, aliases, answer };
  }),
  ...(Object.keys(topics) as Topic[]).flatMap((topic) => metadata[topic].entries.map((problem) => toCase(problem, topic))),
  ...courseProblems.map(({ topic, ...problem }) => toCase(problem, topic)),
  toCase(eventTickets, "commerce"),
].map(withTechnology);

const syllabusNames = new Map(courseQuestions.map(({ problem, name }) => [problem, name]));

export function caseSearchText(item: Case) {
  const designType = item.topic === "foundations" ? "low level design LLD" : "high level design HLD";
  return [item.title, syllabusNames.get(item.id), item.summary, item.scenario, topics[item.topic], designType, item.level, ...item.concepts, ...item.aliases].join(" ");
}

export function matchesSearch(haystack: string, query: string) {
  const terms = query.toLowerCase().match(/[a-z0-9]+/g) || [];
  const hay = haystack.toLowerCase().replaceAll(/[^a-z0-9]+/g, " ");
  return terms.every((term) => hay.includes(term));
}

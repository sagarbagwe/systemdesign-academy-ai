import { advancedTopics } from "./advanced";
import { engineeringTopics } from "./case-studies";
import { conceptTopics } from "./concepts";
import { patternTopics } from "./patterns";
import { pracHubTopics } from "./prachub";
import { technologyTopics } from "./technologies";

export const courseSource = "https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction";

export const studyTopics = [
  ...conceptTopics,
  ...patternTopics,
  ...technologyTopics,
  ...advancedTopics,
  ...engineeringTopics,
  ...pracHubTopics,
];

export { courseQuestions } from "./course-questions";

import type { Progress } from "./model";

const configuredBase = process.env.NEXT_PUBLIC_API_URL || "";
const apiBase = configuredBase === "same-origin" ? "" : configuredBase.replace(/\/$/, "");
export const hasAccountServer = configuredBase !== "";

export type Account = { id: string; email: string; pro: boolean };
export type Capabilities = { tutor: boolean; billing: boolean };
export type WorkspaceSnapshot = { revision: number; data: Progress | null };
export type TutorReply = { answer: string; lessonId: string | null };

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  try {
    const response = await fetch(apiBase + path, {
      method, credentials: "include", cache: "no-store",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
      const problem = await response.json().catch(() => ({})) as { detail?: string };
      throw new ApiError(response.status, problem.detail || "The request could not be completed.");
    }
    return (response.status === 204 ? undefined : await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, "The account server could not be reached.");
  }
}

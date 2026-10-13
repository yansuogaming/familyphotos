// AI drafts for the admin lesson studio. Endpoint: docs/api/lesson-ai.md.
// The backend calls the AI provider with the family's shared key and returns
// JSON in the LessonAiResult shape.
import { http } from "./core";
import type { LessonAiRequest, LessonAiResult } from "./lesson-ai-types";

export const lessonAiApi = {
  /** Admin only. Drafts are not saved anywhere until the admin adds them and saves the lesson. */
  generate: (req: LessonAiRequest): Promise<LessonAiResult> =>
    http("/admin/lessons/ai/generate", { method: "POST", body: JSON.stringify(req) }),
};

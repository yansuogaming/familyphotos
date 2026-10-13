// What the studio's areas (canvas, lists, inspector) can read and do on the open lesson.
import type { LessonAiKind } from "@/lib/api/lesson-ai-types";
import type { LessonBlock, LessonDetail, QuizQuestion, Video } from "@/lib/api/lesson-types";
import type { BlockType, Draft, ESection, Issue, Selection, Tab } from "./model";

/** AI draft markers: "o:<outcome key>", "b:<block key>", "q:<question id>". */
export const aiKey = {
  outcome: (key: string) => `o:${key}`,
  block: (key: string) => `b:${key}`,
  question: (id: string) => `q:${id}`,
};

export interface Ed {
  draft: Draft;
  base: LessonDetail;
  sel: Selection | null;
  /** `focus`: move keyboard focus into the inspector. */
  select: (s: Selection | null, opts?: { focus?: boolean }) => void;
  openTab: (t: Tab) => void;
  openAi: (kind: LessonAiKind) => void;

  isAi: (key: string) => boolean;
  approve: (key: string) => void;
  /** Validation shown after a save attempt. */
  issues: Issue[];
  err: (at: string) => string | undefined;

  patch: (p: Partial<Draft>) => void;

  setBlock: (key: string, b: LessonBlock) => void;
  canMoveBlock: (key: string, d: -1 | 1) => boolean;
  moveBlock: (key: string, d: -1 | 1) => void;
  duplicateBlock: (key: string) => void;
  removeBlock: (key: string) => void;
  insertBlock: (sectionKey: string, at: number, type: BlockType) => void;

  setSection: (key: string, fn: (s: ESection) => ESection) => void;
  moveSection: (key: string, d: -1 | 1) => void;
  duplicateSection: (key: string) => void;
  removeSection: (key: string) => void;
  addSection: (title?: string) => void;

  setVideo: (id: string, p: Partial<Video>) => void;
  reorderVideo: (from: number, to: number) => void;
  removeVideo: (id: string) => void;
  addVideo: () => void;

  setQuestion: (blockKey: string, q: QuizQuestion) => void;
  moveQuestion: (blockKey: string, id: string, d: -1 | 1) => void;
  removeQuestion: (blockKey: string, id: string) => void;
  /** Without a block: the last quiz block, or a new "Tự kiểm" part. */
  addQuestion: (blockKey?: string) => void;
}

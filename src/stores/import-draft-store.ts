import { ShareIntentFile } from "expo-share-intent";
import { create } from "zustand";

export type Confidence = "low" | "medium" | "high";

export type ImportMode = "share" | "link" | "photo" | "text" | "manual" | "web";

export type ImportSourceType =
  | "tiktok"
  | "instagram"
  | "youtube"
  | "whatsapp"
  | "photo"
  | "manual"
  | "web";

export type NeedsInputReason =
  | "NO_CAPTION_TEXT"
  | "ONLY_BARE_SOCIAL_URL"
  | "SOCIAL_PLATFORM_BLOCKED"
  | "NOT_RECIPE_LIKE"
  | "AI_PARSE_FAILED";

export type DebugExtraction = {
  source:
  | "share_text"
  | "tiktok_oembed"
  | "instagram_meta"
  | "instagram_embed"
  | "youtube_oembed"
  | "website_json_ld"
  | "website_meta"
  | "none";
  rawTextLength: number;
  resolvedUrl?: string;
  reason?: string;
};

export type ParsedRecipe = {
  title: string;
  description?: string;
  language: "sq" | "mk" | "en" | "de" | "tr" | "mixed" | "unknown";
  ingredients: {
    text: string;
    amount?: string;
    unit?: string;
    item?: string;
    note?: string;
    confidence: Confidence;
  }[];
  steps: string[];
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  tags: string[];
  cuisine?: string;
  ambiguityNotes: string[];
  needsUserReview: boolean;
  confidence: Confidence;
};

export type ImportDraft = {
  status:
  | "idle"
  | "receiving"
  | "extracting"
  | "needs_input"
  | "ready_for_review"
  | "failed";
  sourceType: ImportSourceType;
  mode?: ImportMode;
  sourceUrl?: string;
  sourceText?: string;
  imageUri?: string;
  rawContent?: {
    title?: string;
    caption?: string;
    description?: string;
    htmlText?: string;
    imageText?: string;
  };
  parsedRecipe?: ParsedRecipe;
  confidence: Confidence;
  warnings: string[];
  needsInputReason?: NeedsInputReason;
  debugExtraction?: DebugExtraction;
};

export type StoredImportDraft = ImportDraft & {
  id: string;
  receivedAt: number;
  files?: ShareIntentFile[];
};

type ImportDraftState = {
  draft?: StoredImportDraft;
  setDraft: (draft: ImportDraft & { files?: ShareIntentFile[] }) => void;
  patchDraft: (patch: Partial<ImportDraft>) => void;
  clearDraft: () => void;
};

function createDraftId() {
  return `import_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export const useImportDraftStore = create<ImportDraftState>()((set) => ({
  draft: undefined,
  setDraft: (draft) =>
    set({
      draft: {
        ...draft,
        id: createDraftId(),
        receivedAt: Date.now(),
        warnings: draft.warnings ?? [],
        confidence: draft.confidence ?? "low",
      },
    }),
  patchDraft: (patch) =>
    set((state) => ({
      draft: state.draft
        ? {
          ...state.draft,
          ...patch,
          rawContent: {
            ...state.draft.rawContent,
            ...patch.rawContent,
          },
          warnings: patch.warnings ?? state.draft.warnings,
        }
        : undefined,
    })),
  clearDraft: () => set({ draft: undefined }),
}));

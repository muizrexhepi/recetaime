import { ShareIntentFile } from "expo-share-intent";
import { create } from "zustand";

export type ImportMode = "link" | "photo" | "text" | "manual" | "share";

export type ImportSourceType =
  | "tiktok"
  | "instagram"
  | "youtube"
  | "whatsapp"
  | "photo"
  | "manual"
  | "web";

export type ImportDraft = {
  id: string;
  mode: ImportMode;
  sourceType: ImportSourceType;
  sourceUrl?: string;
  sourceText?: string;
  title?: string;
  imageUri?: string;
  files?: ShareIntentFile[];
  metaTitle?: string;
  receivedAt: number;
};

type ImportDraftState = {
  draft?: ImportDraft;
  setDraft: (draft: Omit<ImportDraft, "id" | "receivedAt">) => void;
  clearDraft: () => void;
};

export const useImportDraftStore = create<ImportDraftState>()((set) => ({
  draft: undefined,
  setDraft: (draft) =>
    set({
      draft: {
        ...draft,
        id: `import_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        receivedAt: Date.now(),
      },
    }),
  clearDraft: () => set({ draft: undefined }),
}));

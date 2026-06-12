import { GuestRecipe } from "@/stores/guest-store";
import {
  Confidence,
  ImportDraft,
  ImportMode,
  ImportSourceType,
  ParsedRecipe,
} from "@/stores/import-draft-store";

type RecipeInput = Omit<
  GuestRecipe,
  "localId" | "serverId" | "syncStatus" | "createdAt" | "updatedAt"
>;

const URL_REGEX = /(https?:\/\/[^\s]+)/i;

export function extractFirstUrl(value: string) {
  return value.match(URL_REGEX)?.[0]?.replace(/[),.]+$/, "");
}

export function detectSourceType(input?: string): ImportSourceType {
  if (!input?.trim()) return "manual";

  const normalized = input.toLowerCase();

  if (normalized.includes("tiktok.com")) return "tiktok";
  if (normalized.includes("instagram.com")) return "instagram";
  if (normalized.includes("youtu.be") || normalized.includes("youtube.com")) {
    return "youtube";
  }
  if (normalized.includes("wa.me") || normalized.includes("whatsapp")) {
    return "whatsapp";
  }
  if (normalized.startsWith("file:")) return "photo";
  if (normalized.startsWith("http")) return "web";

  return "manual";
}

export function normalizeRouteMode(mode?: string): ImportMode {
  switch (mode) {
    case "share":
    case "link":
    case "photo":
    case "text":
    case "manual":
    case "web":
      return mode;
    case "social":
      return "link";
    default:
      return "link";
  }
}

export function normalizeImportDraft(args: {
  mode?: ImportMode;
  value?: string;
  imageUri?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaCaption?: string;
  metaHtmlText?: string;
  status?: ImportDraft["status"];
}): ImportDraft {
  const value = args.value?.trim();
  const sourceUrl = value ? extractFirstUrl(value) : undefined;
  const sourceText = value && value.length > 0 ? value : undefined;
  const sourceType = args.imageUri
    ? "photo"
    : args.mode === "manual"
      ? "manual"
      : args.mode === "web"
        ? "web"
        : detectSourceType(sourceUrl ?? sourceText);

  return {
    status: args.status ?? (sourceText || args.imageUri ? "receiving" : "idle"),
    mode: args.mode,
    sourceType,
    ...(sourceUrl ? { sourceUrl } : {}),
    ...(sourceText ? { sourceText } : {}),
    ...(args.imageUri ? { imageUri: args.imageUri } : {}),
    ...(args.metaTitle
      ? {
          rawContent: {
            title: cleanTitle(args.metaTitle),
            caption: args.metaCaption ?? sourceText,
            ...(args.metaDescription ? { description: args.metaDescription } : {}),
            ...(args.metaHtmlText ? { htmlText: args.metaHtmlText } : {}),
          },
        }
      : sourceText || args.metaDescription || args.metaCaption || args.metaHtmlText
        ? {
            rawContent: {
              ...(sourceText || args.metaCaption
                ? { caption: args.metaCaption ?? sourceText }
                : {}),
              ...(args.metaDescription ? { description: args.metaDescription } : {}),
              ...(args.metaHtmlText ? { htmlText: args.metaHtmlText } : {}),
            },
          }
        : {}),
    confidence: "low",
    warnings: [],
  };
}

export function getDraftInputValue(draft?: ImportDraft) {
  return draft?.sourceUrl ?? draft?.sourceText ?? "";
}

export function getDisplayTitleForDraft(draft: ImportDraft) {
  const rawTitle = draft.rawContent?.title?.trim();
  if (rawTitle) return rawTitle;

  switch (draft.sourceType) {
    case "tiktok":
      return "Link nga TikTok";
    case "instagram":
      return "Link nga Instagram";
    case "youtube":
      return "Link nga YouTube";
    case "whatsapp":
      return "Tekst nga WhatsApp";
    case "photo":
      return "Foto për import";
    case "manual":
      return "Recetë manuale";
    case "web":
    default:
      return draft.sourceUrl ? domainFromUrl(draft.sourceUrl) : "Import i ri";
  }
}

export function buildRecipeFromParsed(args: {
  draft: ImportDraft;
  parsedRecipe: ParsedRecipe;
}): RecipeInput {
  const { draft, parsedRecipe } = args;

  return {
    title: cleanTitle(parsedRecipe.title),
    ...(parsedRecipe.description?.trim()
      ? { description: parsedRecipe.description.trim() }
      : {}),
    sourceType: draft.sourceType,
    ...(draft.sourceUrl ? { sourceUrl: draft.sourceUrl } : {}),
    ...(draft.sourceText ? { sourceText: draft.sourceText } : {}),
    ...(draft.imageUri ? { imageUrl: draft.imageUri } : {}),
    ingredients: parsedRecipe.ingredients.map((ingredient) => ({
      ...ingredient,
      text: ingredient.text.trim(),
    })),
    steps: parsedRecipe.steps.map((step) => step.trim()).filter(Boolean),
    ...(parsedRecipe.servings ? { servings: parsedRecipe.servings } : {}),
    ...(parsedRecipe.prepTimeMinutes
      ? { prepTimeMinutes: parsedRecipe.prepTimeMinutes }
      : {}),
    ...(parsedRecipe.cookTimeMinutes
      ? { cookTimeMinutes: parsedRecipe.cookTimeMinutes }
      : {}),
    collectionIds: [],
    isFavorite: false,
  };
}

export function createEditableParsedRecipe(parsed?: ParsedRecipe): ParsedRecipe {
  return (
    parsed ?? {
      title: "",
      language: "unknown",
      ingredients: [],
      steps: [],
      tags: [],
      ambiguityNotes: [],
      needsUserReview: true,
      confidence: "low",
    }
  );
}

export function normalizeConfidence(value?: string): Confidence {
  return value === "high" || value === "medium" || value === "low"
    ? value
    : "low";
}

export function hasEnoughRecipeContent(parsed: ParsedRecipe) {
  return (
    parsed.title.trim().length > 0 &&
    !isPlaceholderRecipeTitle(parsed.title) &&
    parsed.ingredients.some((ingredient) => ingredient.text.trim()) &&
    parsed.steps.some((step) => step.trim())
  );
}

export function isPlaceholderRecipeTitle(title: string) {
  const normalized = title.trim().toLowerCase();

  return (
    normalized.length === 0 ||
    normalized === "recetë e re" ||
    normalized === "recete e re" ||
    normalized === "link nga instagram" ||
    normalized === "link nga tiktok" ||
    normalized === "link nga youtube" ||
    normalized === "tiktok recipe" ||
    normalized === "instagram recipe" ||
    normalized === "import i ri" ||
    normalized.startsWith("recetë nga ") ||
    normalized.startsWith("recete nga ")
  );
}

function cleanTitle(title: string) {
  return (
    title
      .replace(URL_REGEX, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 100) || "Recetë e re"
  );
}

function domainFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Web";
  }
}

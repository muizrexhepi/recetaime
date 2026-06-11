import { GuestRecipe } from "@/stores/guest-store";
import {
  ImportDraft,
  ImportSourceType,
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
  if (!input) return "manual";

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

export function normalizeImportDraft(args: {
  mode: ImportDraft["mode"];
  value?: string;
  imageUri?: string;
  metaTitle?: string;
}): Omit<ImportDraft, "id" | "receivedAt"> {
  const sourceUrl = args.value ? extractFirstUrl(args.value) : undefined;
  const sourceText =
    args.value && args.value.trim().length > 0 ? args.value.trim() : undefined;
  const imageUri = args.imageUri;

  return {
    mode: args.mode,
    sourceType: imageUri
      ? "photo"
      : detectSourceType(sourceUrl ?? sourceText),
    ...(sourceUrl ? { sourceUrl } : {}),
    ...(sourceText ? { sourceText } : {}),
    ...(imageUri ? { imageUri } : {}),
    ...(args.metaTitle ? { metaTitle: args.metaTitle } : {}),
    title: inferTitle({
      sourceUrl,
      sourceText,
      metaTitle: args.metaTitle,
      sourceType: imageUri ? "photo" : detectSourceType(sourceUrl ?? sourceText),
    }),
  };
}

export function inferTitle(args: {
  sourceUrl?: string;
  sourceText?: string;
  metaTitle?: string;
  sourceType?: ImportSourceType;
}) {
  if (args.metaTitle?.trim()) return cleanTitle(args.metaTitle);

  if (args.sourceText && !args.sourceUrl) {
    const firstUsefulLine = args.sourceText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 2 && !/^(përbërës|ingredients|hapat|steps|udhëzime)/i.test(line));

    if (firstUsefulLine) return cleanTitle(firstUsefulLine);
  }

  switch (args.sourceType) {
    case "tiktok":
      return "Recetë nga TikTok";
    case "instagram":
      return "Recetë nga Instagram";
    case "youtube":
      return "Recetë nga YouTube";
    case "whatsapp":
      return "Recetë nga WhatsApp";
    case "photo":
      return "Recetë nga foto";
    case "web":
      return args.sourceUrl ? `Recetë nga ${domainFromUrl(args.sourceUrl)}` : "Recetë nga web";
    default:
      return "Recetë e re";
  }
}

export function buildRecipeFromDraft(draft: ImportDraft): RecipeInput {
  const parsed = parseRecipeText(draft.sourceText ?? "");

  return {
    title: cleanTitle(draft.title ?? inferTitle(draft)),
    description: getDescriptionForDraft(draft),
    sourceType: draft.sourceType,
    ...(draft.sourceUrl ? { sourceUrl: draft.sourceUrl } : {}),
    ...(draft.sourceText ? { sourceText: draft.sourceText } : {}),
    ...(draft.imageUri ? { imageUrl: draft.imageUri } : {}),
    ingredients: parsed.ingredients,
    steps: parsed.steps,
    collectionIds: [],
    isFavorite: false,
  };
}

export function parseRecipeText(text: string): {
  ingredients: RecipeInput["ingredients"];
  steps: string[];
} {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return {
      ingredients: [],
      steps: [],
    };
  }

  const ingredientHeadingIndex = lines.findIndex((line) =>
    /^(përbërës|perberes|ingredients)\b/i.test(line),
  );
  const stepHeadingIndex = lines.findIndex((line) =>
    /^(hapat|përgatitja|pergatitja|udhëzime|udhezime|steps|method)\b/i.test(line),
  );

  const ingredientLines =
    ingredientHeadingIndex >= 0
      ? lines.slice(
          ingredientHeadingIndex + 1,
          stepHeadingIndex > ingredientHeadingIndex ? stepHeadingIndex : undefined,
        )
      : lines.filter(isLikelyIngredient);

  const stepLines =
    stepHeadingIndex >= 0
      ? lines.slice(stepHeadingIndex + 1)
      : lines.filter((line) => !isLikelyIngredient(line)).slice(1);

  return {
    ingredients: ingredientLines.slice(0, 40).map((line) => ({
      text: stripListMarker(line),
      confidence: "medium" as const,
    })),
    steps: stepLines.slice(0, 30).map(stripListMarker),
  };
}

function isLikelyIngredient(line: string) {
  return (
    /^[-•*]\s+/.test(line) ||
    /^\d+([.,/]\d+)?\s*(g|kg|ml|l|lugë|luge|filxhan|thelb|kokrra|copë|cope)\b/i.test(line)
  );
}

function stripListMarker(line: string) {
  return line.replace(/^[-•*]\s+/, "").replace(/^\d+[.)]\s+/, "").trim();
}

function cleanTitle(title: string) {
  return title
    .replace(URL_REGEX, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "Recetë e re";
}

function domainFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "web";
  }
}

function getDescriptionForDraft(draft: ImportDraft) {
  if (draft.sourceUrl) {
    return "Importuar nga linku origjinal. Përbërësit dhe hapat mund t’i rregullosh më vonë.";
  }

  if (draft.imageUri) {
    return "Importuar nga foto. OCR/leximi i fotos do të lidhet në hapin tjetër.";
  }

  return "Importuar nga tekst i ngjitur.";
}

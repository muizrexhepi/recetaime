import { v } from "convex/values";
import { z } from "zod";

import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { action, ActionCtx, internalMutation, internalQuery } from "./_generated/server";

declare const process: {
    env: Record<string, string | undefined>;
};

type Confidence = "low" | "medium" | "high";
type ImportSourceType =
    | "tiktok"
    | "instagram"
    | "youtube"
    | "whatsapp"
    | "photo"
    | "text"
    | "manual"
    | "web"
    | "unknown";
type SourcePlatform = "tiktok" | "instagram" | "manual" | "photo" | "text" | "unknown";
type ImportMode = "share" | "link" | "photo" | "text" | "manual" | "web";
type Language = "sq" | "mk" | "en" | "de" | "tr" | "mixed" | "unknown";
type NeedsInputReason =
    | "NO_CAPTION_TEXT"
    | "ONLY_BARE_SOCIAL_URL"
    | "SOCIAL_PLATFORM_BLOCKED"
    | "SOCIAL_SCRAPER_NOT_CONFIGURED"
    | "SOCIAL_SCRAPER_FAILED"
    | "NOT_RECIPE_LIKE"
    | "AI_PARSE_FAILED"
    | "NO_IMAGE_AVAILABLE";
type DebugExtractionSource =
    | "share_text"
    | "tiktok_oembed"
    | "tiktok_meta"
    | "instagram_meta"
    | "instagram_embed"
    | "youtube_oembed"
    | "website_json_ld"
    | "website_meta"
    | "social_scraper"
    | "image_ocr"
    | "vision"
    | "none";

type ParsedRecipe = {
    title: string;
    description?: string;
    language: Language;
    ingredients: {
        text: string;
        amount?: string;
        unit?: string;
        item?: string;
        note?: string;
        confidence: Confidence;
    }[];
    steps: string[];
    tips?: string[];
    servings?: number;
    prepTimeMinutes?: number;
    cookTimeMinutes?: number;
    tags: string[];
    cuisine?: string;
    ambiguityNotes: string[];
    missingInfo?: string[];
    warnings?: string[];
    needsUserReview: boolean;
    confidence: Confidence;
};

type ImportResult = {
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
    imageStorageId?: Id<"_storage">;
    thumbnailStorageId?: Id<"_storage">;
    imageUrl?: string;
    imageThumbnailUrl?: string;
    sourcePlatform?: SourcePlatform;
    sourceTitle?: string;
    sourceAuthor?: string;
    sourceThumbnailUrl?: string;
    rawContent?: RawContent;
    parsedRecipe?: ParsedRecipe;
    confidence: Confidence;
    warnings: string[];
    needsInputReason?: NeedsInputReason;
    debugExtraction?: DebugExtraction;
};

type DebugExtraction = {
    source: DebugExtractionSource;
    provider?: string;
    rawTextLength: number;
    rawTextPreview?: string;
    resolvedUrl?: string;
    reason?: string;
};

type ExtractionContext = {
    originalUrl?: string;
    resolvedUrl?: string;
    normalizedUrl?: string;
};

type RawContent = {
    title?: string;
    caption?: string;
    description?: string;
    htmlText?: string;
    imageText?: string;
};

const aiIngredientSchema = z.object({
    text: z.string().trim().optional().nullable(),
    amount: z.string().trim().optional().nullable(),
    unit: z.string().trim().optional().nullable(),
    item: z.string().trim().optional().nullable(),
    note: z.string().trim().optional().nullable(),
    notes: z.string().trim().optional().nullable(),
    name: z.string().trim().optional().nullable(),
    quantity: z.string().trim().optional().nullable(),
    confidence: z.enum(["low", "medium", "high"]).optional().default("medium"),
});

const aiRecipeSchema = z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().optional().nullable(),
    language: z.enum(["sq", "mk", "en", "de", "tr", "mixed", "unknown"]).optional().default("sq"),
    ingredients: z.array(aiIngredientSchema).default([]),
    steps: z.array(
        z.union([
            z.string(),
            z.object({
                order: z.number().optional().nullable(),
                text: z.string(),
            }),
        ]),
    ).default([]),
    tips: z.array(z.string()).optional().default([]),
    servings: z.number().optional().nullable(),
    prepTimeMinutes: z.number().optional().nullable(),
    cookTimeMinutes: z.number().optional().nullable(),
    tags: z.array(z.string()).optional().default([]),
    cuisine: z.string().trim().optional().nullable(),
    ambiguityNotes: z.array(z.string()).optional().default([]),
    missingInfo: z.array(z.string()).optional().default([]),
    warnings: z.array(z.string()).optional().default([]),
    needsUserReview: z.boolean().optional().default(true),
    confidence: z.enum(["low", "medium", "high"]).optional().default("low"),
});

const confidence = v.union(
    v.literal("low"),
    v.literal("medium"),
    v.literal("high"),
);

const sourceType = v.union(
    v.literal("tiktok"),
    v.literal("instagram"),
    v.literal("youtube"),
    v.literal("whatsapp"),
    v.literal("photo"),
    v.literal("text"),
    v.literal("manual"),
    v.literal("web"),
    v.literal("unknown"),
);

const sourcePlatform = v.union(
    v.literal("tiktok"),
    v.literal("instagram"),
    v.literal("manual"),
    v.literal("photo"),
    v.literal("text"),
    v.literal("unknown"),
);

const mode = v.union(
    v.literal("share"),
    v.literal("link"),
    v.literal("photo"),
    v.literal("text"),
    v.literal("manual"),
    v.literal("web"),
);

const language = v.union(
    v.literal("sq"),
    v.literal("mk"),
    v.literal("en"),
    v.literal("de"),
    v.literal("tr"),
    v.literal("mixed"),
    v.literal("unknown"),
);

const ingredient = v.object({
    text: v.string(),
    amount: v.optional(v.string()),
    unit: v.optional(v.string()),
    item: v.optional(v.string()),
    note: v.optional(v.string()),
    confidence,
});

const parsedRecipe = v.object({
    title: v.string(),
    description: v.optional(v.string()),
    language,
    ingredients: v.array(ingredient),
    steps: v.array(v.string()),
    tips: v.optional(v.array(v.string())),
    servings: v.optional(v.number()),
    prepTimeMinutes: v.optional(v.number()),
    cookTimeMinutes: v.optional(v.number()),
    tags: v.array(v.string()),
    cuisine: v.optional(v.string()),
    ambiguityNotes: v.array(v.string()),
    missingInfo: v.optional(v.array(v.string())),
    warnings: v.optional(v.array(v.string())),
    needsUserReview: v.boolean(),
    confidence,
});

const rawContent = v.object({
    title: v.optional(v.string()),
    caption: v.optional(v.string()),
    description: v.optional(v.string()),
    htmlText: v.optional(v.string()),
    imageText: v.optional(v.string()),
});

const importResult = v.object({
    status: v.union(
        v.literal("idle"),
        v.literal("receiving"),
        v.literal("extracting"),
        v.literal("needs_input"),
        v.literal("ready_for_review"),
        v.literal("failed"),
    ),
    sourceType,
    mode: v.optional(mode),
    sourceUrl: v.optional(v.string()),
    sourceText: v.optional(v.string()),
    imageUri: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    thumbnailStorageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    imageThumbnailUrl: v.optional(v.string()),
    sourcePlatform: v.optional(sourcePlatform),
    sourceTitle: v.optional(v.string()),
    sourceAuthor: v.optional(v.string()),
    sourceThumbnailUrl: v.optional(v.string()),
    rawContent: v.optional(rawContent),
    parsedRecipe: v.optional(parsedRecipe),
    confidence,
    warnings: v.array(v.string()),
    needsInputReason: v.optional(
        v.union(
            v.literal("NO_CAPTION_TEXT"),
            v.literal("ONLY_BARE_SOCIAL_URL"),
            v.literal("SOCIAL_PLATFORM_BLOCKED"),
            v.literal("SOCIAL_SCRAPER_NOT_CONFIGURED"),
            v.literal("SOCIAL_SCRAPER_FAILED"),
            v.literal("NOT_RECIPE_LIKE"),
            v.literal("AI_PARSE_FAILED"),
            v.literal("NO_IMAGE_AVAILABLE"),
        ),
    ),
    debugExtraction: v.optional(
        v.object({
            source: v.union(
                v.literal("share_text"),
                v.literal("tiktok_oembed"),
                v.literal("tiktok_meta"),
                v.literal("instagram_meta"),
                v.literal("instagram_embed"),
                v.literal("youtube_oembed"),
                v.literal("website_json_ld"),
                v.literal("website_meta"),
                v.literal("social_scraper"),
                v.literal("image_ocr"),
                v.literal("vision"),
                v.literal("none"),
            ),
            provider: v.optional(v.string()),
            rawTextLength: v.number(),
            rawTextPreview: v.optional(v.string()),
            resolvedUrl: v.optional(v.string()),
            reason: v.optional(v.string()),
        }),
    ),
});

export const parseDraft = action({
    args: {
        token: v.optional(v.string()),
        guestId: v.optional(v.string()),
        sourceType,
        mode: v.optional(mode),
        sourceUrl: v.optional(v.string()),
        sourceText: v.optional(v.string()),
        imageUri: v.optional(v.string()),
        imageStorageId: v.optional(v.id("_storage")),
        thumbnailStorageId: v.optional(v.id("_storage")),
        rawContent: v.optional(rawContent),
    },
    handler: async (ctx, args): Promise<ImportResult> => {
        const urlContext = args.sourceUrl
            ? await resolveImportUrl(args.sourceUrl)
            : {};
        const resolvedSourceType = detectSourceTypeFromUrl(
            urlContext.normalizedUrl ?? urlContext.resolvedUrl ?? args.sourceUrl,
            args.sourceType,
        );
        const normalizedArgs = {
            ...args,
            sourceType: resolvedSourceType,
        };
        const allowance = await ctx.runQuery(internal.importUsage.checkAllowance, {
            ...(args.token ? { token: args.token } : {}),
            ...(args.guestId ? { guestId: args.guestId } : {}),
            sourceType: resolvedSourceType,
            isImage: Boolean(args.imageStorageId || resolvedSourceType === "photo"),
        });

        if (!allowance.allowed) {
            return {
                sourceType: resolvedSourceType,
                ...(args.mode ? { mode: args.mode } : {}),
                ...(args.sourceUrl ? { sourceUrl: args.sourceUrl } : {}),
                ...(args.sourceText ? { sourceText: args.sourceText } : {}),
                status: "failed",
                confidence: "low",
                warnings: [
                    allowance.reason === "IMAGE_LIMIT_REACHED"
                        ? "Ke arritur 2 importet nga foto për këtë javë. Mund të përdorësh ende import nga link ose tekst."
                        : "Ke arritur 5 importet falas për këtë javë. Zhblloko Pro për importe pa limit.",
                ],
            };
        }
        const sourceHash = args.sourceUrl
            ? `url:v8:${urlContext.normalizedUrl ?? args.sourceUrl}`
            : await hashImportInput(normalizedArgs);
        const cached: ImportResult | null = await ctx.runQuery(
            internal.imports.getCachedImport,
            { sourceHash },
        );

        if (cached) {
            await ctx.runMutation(internal.importUsage.recordImport, {
                ...(args.token ? { token: args.token } : {}),
                ...(args.guestId ? { guestId: args.guestId } : {}),
                sourceType: resolvedSourceType,
                isImage: Boolean(args.imageStorageId || resolvedSourceType === "photo"),
            });

            return {
                ...cached,
                ...(args.sourceUrl ? { sourceUrl: args.sourceUrl } : {}),
                warnings: [...cached.warnings, "U përdor rezultati i ruajtur."],
            };
        }

        const result = await parseWithoutCache(ctx, normalizedArgs, urlContext);

        if (result.status === "ready_for_review") {
            await ctx.runMutation(internal.imports.cacheImportResult, {
                sourceHash,
                sourceType: resolvedSourceType,
                ...(urlContext.normalizedUrl ? { sourceUrl: urlContext.normalizedUrl } : {}),
                result,
            });
        }

        if (result.status === "ready_for_review" || result.parsedRecipe) {
            await ctx.runMutation(internal.importUsage.recordImport, {
                ...(args.token ? { token: args.token } : {}),
                ...(args.guestId ? { guestId: args.guestId } : {}),
                sourceType: resolvedSourceType,
                isImage: Boolean(args.imageStorageId || resolvedSourceType === "photo"),
            });
        }

        return result;
    },
});

export const getCachedImport = internalQuery({
    args: {
        sourceHash: v.string(),
    },
    handler: async (ctx, args) => {
        const rows = await ctx.db
            .query("importCache")
            .withIndex("by_source_hash", (q) => q.eq("sourceHash", args.sourceHash))
            .order("desc")
            .take(1);

        return rows[0]?.result ?? null;
    },
});

export const cacheImportResult = internalMutation({
    args: {
        sourceHash: v.string(),
        sourceType,
        sourceUrl: v.optional(v.string()),
        result: importResult,
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const existing = (
            await ctx.db
                .query("importCache")
                .withIndex("by_source_hash", (q) => q.eq("sourceHash", args.sourceHash))
                .take(1)
        )[0];

        if (existing) {
            await ctx.db.patch(existing._id, {
                result: args.result,
                updatedAt: now,
            });
            return existing._id;
        }

        return await ctx.db.insert("importCache", {
            sourceHash: args.sourceHash,
            sourceType: args.sourceType,
            ...(args.sourceUrl ? { sourceUrl: args.sourceUrl } : {}),
            result: args.result,
            createdAt: now,
            updatedAt: now,
        });
    },
});

async function parseWithoutCache(ctx: ActionCtx, args: {
    sourceType: ImportSourceType;
    mode?: ImportMode;
    sourceUrl?: string;
    sourceText?: string;
    imageUri?: string;
    imageStorageId?: Id<"_storage">;
    thumbnailStorageId?: Id<"_storage">;
    rawContent?: RawContent;
}, urlContext: ExtractionContext = {}): Promise<ImportResult> {
    const extractionUrl = urlContext.normalizedUrl ?? urlContext.resolvedUrl ?? args.sourceUrl;
    const storedImage = args.imageStorageId
        ? await getStoredImageInput(ctx, args.imageStorageId)
        : null;
    const storedThumbnailUrl = args.thumbnailStorageId
        ? await ctx.storage.getUrl(args.thumbnailStorageId)
        : null;
    const base = {
        sourceType: args.sourceType,
        sourcePlatform: platformFromSource(args.sourceType, args.mode),
        ...(args.mode ? { mode: args.mode } : {}),
        ...(args.sourceUrl ? { sourceUrl: args.sourceUrl } : {}),
        ...(args.sourceText ? { sourceText: args.sourceText } : {}),
        ...(args.imageUri ? { imageUri: args.imageUri } : {}),
        ...(args.imageStorageId ? { imageStorageId: args.imageStorageId } : {}),
        ...(args.thumbnailStorageId ? { thumbnailStorageId: args.thumbnailStorageId } : {}),
        ...(storedImage?.url ? { imageUrl: storedImage.url } : {}),
        ...(storedThumbnailUrl ? { imageThumbnailUrl: storedThumbnailUrl } : {}),
    };

    const raw: RawContent = compactRawContent(args.rawContent ?? {});

    if (args.sourceType === "photo") {
        const imageText = raw.imageText?.trim();

        if (!imageText && !storedImage?.dataUrl) {
            return needsInput({
                ...base,
                rawContent: raw,
                warning:
                    "Nuk arritëm ta lexojmë mirë recetën. Provo një screenshot më të qartë ose shkruaje recetën vetë.",
                reason: "NO_CAPTION_TEXT",
                debugExtraction: makeDebug("none", "", urlContext, "NO_CAPTION_TEXT"),
            });
        }

        return parseTextWithFallback(ctx, {
            ...base,
            rawContent: raw,
            text: imageText ?? "",
            imageDataUrl: storedImage?.dataUrl,
            deterministicFirst: true,
            debugExtraction: makeDebug(storedImage?.dataUrl ? "vision" : "share_text", imageText ?? "", urlContext),
        });
    }

    if (args.sourceText?.trim() && !args.sourceUrl) {
        return parseTextWithFallback(ctx, {
            ...base,
            rawContent: { ...raw, caption: args.sourceText.trim() },
            text: args.sourceText.trim(),
            imageDataUrl: storedImage?.dataUrl,
            deterministicFirst: true,
            debugExtraction: makeDebug("share_text", args.sourceText, urlContext),
        });
    }

    if (args.sourceUrl) {
        const socialText = usefulSocialText(args.sourceText, raw);

        if (socialText) {
            return parseTextWithFallback(ctx, {
                ...base,
                rawContent: { ...raw, caption: socialText },
                text: socialText,
                imageDataUrl: storedImage?.dataUrl,
                deterministicFirst: true,
                debugExtraction: makeDebug("share_text", socialText, urlContext),
            });
        }
    }

    if (args.sourceUrl && args.sourceType === "tiktok" && extractionUrl) {
        const tiktok = await extractTikTokContent(extractionUrl, raw, urlContext);

        if (tiktok.blocked) {
            return needsInput({
                ...base,
                rawContent: tiktok.rawContent,
                warning: "Platforma nuk lejoi leximin e plotë. Ngjit përshkrimin ose ngarko screenshot.",
                warnings: tiktok.warnings,
                reason: "SOCIAL_PLATFORM_BLOCKED",
                debugExtraction: makeDebug("tiktok_oembed", tiktok.text, urlContext, "SOCIAL_PLATFORM_BLOCKED"),
            });
        }

        if (!tiktok.text) {
            return needsInput({
                ...base,
                rawContent: tiktok.rawContent,
                warning: "Ky link nuk dha mjaft tekst. Ngjit përshkrimin e videos ose ngarko screenshot.",
                warnings: tiktok.warnings,
                reason: "ONLY_BARE_SOCIAL_URL",
                debugExtraction: makeDebug("tiktok_oembed", "", urlContext, "ONLY_BARE_SOCIAL_URL"),
            });
        }

        const media = await storeRemoteImageFromUrl(ctx, tiktok.thumbnailUrl);
        const parsed = await parseTextWithFallback(ctx, {
            ...base,
            rawContent: tiktok.rawContent,
            sourceTitle: tiktok.rawContent.title,
            sourceAuthor: tiktok.sourceAuthor,
            ...(tiktok.thumbnailUrl ? { sourceThumbnailUrl: tiktok.thumbnailUrl } : {}),
            ...(media?.storageId ? { thumbnailStorageId: media.storageId } : {}),
            ...(media?.url ? { imageUrl: media.url } : {}),
            ...(media?.url ? { imageThumbnailUrl: media.url } : {}),
            text: withSourceUrl(tiktok.text, extractionUrl),
            imageDataUrl: storedImage?.dataUrl,
            deterministicFirst: true,
            warnings: [...tiktok.warnings, ...(media?.warning ? [media.warning] : [])],
            debugExtraction: makeDebug("tiktok_oembed", tiktok.text, urlContext),
        });

        return ensureSocialImageOrAsk(parsed);
    }

    if (args.sourceUrl && args.sourceType === "instagram" && extractionUrl) {
        const instagram = await extractInstagramContent(extractionUrl, raw, urlContext);

        if (instagram.blocked) {
            return needsInput({
                ...base,
                rawContent: instagram.rawContent,
                warning: "Platforma nuk lejoi leximin e plotë. Ngjit përshkrimin ose ngarko screenshot.",
                warnings: instagram.warnings,
                reason: "SOCIAL_PLATFORM_BLOCKED",
                debugExtraction: {
                    ...(instagram.debugExtraction ?? makeDebug("instagram_meta", instagram.text, urlContext)),
                    reason: "SOCIAL_PLATFORM_BLOCKED",
                },
            });
        }

        if (!instagram.text) {
            return needsInput({
                ...base,
                rawContent: instagram.rawContent,
                warning: "Ky link nuk dha mjaft tekst. Ngjit përshkrimin e videos ose ngarko screenshot.",
                warnings: instagram.warnings,
                reason: "ONLY_BARE_SOCIAL_URL",
                debugExtraction: {
                    ...(instagram.debugExtraction ?? makeDebug("instagram_meta", "", urlContext)),
                    reason: "ONLY_BARE_SOCIAL_URL",
                },
            });
        }

        const media = await storeRemoteImageFromUrl(ctx, instagram.thumbnailUrl);
        const parsed = await parseTextWithFallback(ctx, {
            ...base,
            rawContent: instagram.rawContent,
            sourceTitle: instagram.rawContent.title,
            sourceAuthor: instagram.sourceAuthor,
            ...(instagram.thumbnailUrl ? { sourceThumbnailUrl: instagram.thumbnailUrl } : {}),
            ...(media?.storageId ? { thumbnailStorageId: media.storageId } : {}),
            ...(media?.url ? { imageUrl: media.url } : {}),
            ...(media?.url ? { imageThumbnailUrl: media.url } : {}),
            text: withSourceUrl(instagram.text, extractionUrl),
            imageDataUrl: storedImage?.dataUrl,
            deterministicFirst: true,
            warnings: [...instagram.warnings, ...(media?.warning ? [media.warning] : [])],
            debugExtraction: instagram.debugExtraction ?? makeDebug("instagram_meta", instagram.text, urlContext),
        });

        return ensureSocialImageOrAsk(parsed);
    }

    if (args.sourceUrl && args.sourceType === "youtube" && extractionUrl) {
        const youtube = await extractYouTubeContent(extractionUrl, raw, urlContext);
        const text = joinContent([youtube.rawContent.title, youtube.rawContent.description]);

        if (!hasUsefulRecipeText(text)) {
            return needsInput({
                ...base,
                rawContent: youtube.rawContent,
                warning: "E lexuam linkun, por nuk gjetëm përbërës apo hapa. Ngjit përshkrimin ose screenshot-in.",
                warnings: youtube.warnings,
                reason: text ? "NOT_RECIPE_LIKE" : "NO_CAPTION_TEXT",
                debugExtraction: makeDebug("youtube_oembed", text, urlContext, text ? "NOT_RECIPE_LIKE" : "NO_CAPTION_TEXT"),
            });
        }

        return parseTextWithFallback(ctx, {
            ...base,
            rawContent: youtube.rawContent,
            text: withSourceUrl(text, extractionUrl),
            imageDataUrl: storedImage?.dataUrl,
            deterministicFirst: true,
            warnings: youtube.warnings,
            debugExtraction: makeDebug("youtube_oembed", text, urlContext),
        });
    }

    if (args.sourceUrl && extractionUrl) {
        const website = await extractWebsiteContent(extractionUrl, raw);

        if (website.recipe && hasRecipeCore(website.recipe)) {
            return {
                ...base,
                rawContent: website.rawContent,
                parsedRecipe: website.recipe,
                status: "ready_for_review",
                confidence: website.recipe.confidence,
                warnings: website.warnings,
                debugExtraction: makeDebug("website_json_ld", website.rawContent.htmlText ?? website.rawContent.description ?? "", urlContext),
            };
        }

        const text = joinContent([
            website.rawContent.title,
            website.rawContent.description,
            website.rawContent.htmlText,
            args.sourceText,
        ]);

        if (!hasUsefulRecipeText(text)) {
            return needsInput({
                ...base,
                rawContent: website.rawContent,
                warning:
                    "Nuk gjetëm mjaft tekst recete në këtë link. Ngjit përbërësit dhe hapat nga faqja.",
                reason: text ? "NOT_RECIPE_LIKE" : "NO_CAPTION_TEXT",
                debugExtraction: makeDebug("website_meta", text, urlContext, text ? "NOT_RECIPE_LIKE" : "NO_CAPTION_TEXT"),
            });
        }

        return parseTextWithFallback(ctx, {
            ...base,
            rawContent: website.rawContent,
            text: withSourceUrl(text, extractionUrl),
            imageDataUrl: storedImage?.dataUrl,
            deterministicFirst: true,
            warnings: website.warnings,
            debugExtraction: makeDebug("website_meta", text, urlContext),
        });
    }

    return needsInput({
        ...base,
        rawContent: raw,
        warning: "Ngjit tekst, link ose zgjidh foto që ta analizojmë recetën.",
        reason: "NO_CAPTION_TEXT",
        debugExtraction: makeDebug("none", "", urlContext, "NO_CAPTION_TEXT"),
    });
}

async function parseTextWithFallback(ctx: ActionCtx, args: {
    sourceType: ImportSourceType;
    mode?: ImportMode;
    sourceUrl?: string;
    sourceText?: string;
    imageUri?: string;
    imageStorageId?: Id<"_storage">;
    thumbnailStorageId?: Id<"_storage">;
    imageUrl?: string;
    imageThumbnailUrl?: string;
    sourcePlatform?: SourcePlatform;
    sourceTitle?: string;
    sourceAuthor?: string;
    sourceThumbnailUrl?: string;
    rawContent?: RawContent;
    text: string;
    imageDataUrl?: string;
    deterministicFirst: boolean;
    warnings?: string[];
    debugExtraction?: DebugExtraction;
}): Promise<ImportResult> {
    const textHash = `text:v10:${await hashText(normalizeWhitespace([args.text, args.imageStorageId].filter(Boolean).join("|")))}`;
    const cached: ImportResult | null = await ctx.runQuery(
        internal.imports.getCachedImport,
        { sourceHash: textHash },
    );

    if (cached?.parsedRecipe) {
        return {
            ...withoutText(args),
            rawContent: args.rawContent,
            parsedRecipe: cached.parsedRecipe,
            status: "ready_for_review",
            confidence: cached.parsedRecipe.confidence,
            warnings: args.warnings ?? [],
            debugExtraction: args.debugExtraction,
        };
    }

    // Always go straight to AI — deterministic parser can't handle Balkan social captions
    const aiRecipe = await parseRecipeWithAi({
        text: args.text,
        imageDataUrl: args.imageDataUrl,
        fallbackTitle: args.rawContent?.title,
    });

    if (aiRecipe && hasRecipeCore(aiRecipe)) {
        const result: ImportResult = {
            ...withoutText(args),
            rawContent: args.rawContent,
            parsedRecipe: aiRecipe,
            status: "ready_for_review",
            confidence: aiRecipe.confidence,
            warnings: args.warnings ?? [],
            debugExtraction: args.debugExtraction,
        };
        await cacheTextResult(ctx, textHash, result);
        return result;
    }

    // Fallback to deterministic only if AI completely failed
    const deterministic = parseStructuredRecipeText(args.text, args.rawContent?.title);

    if (deterministic && hasRecipeCore(deterministic) && deterministic.confidence !== "low") {
        const result: ImportResult = {
            ...withoutText(args),
            rawContent: args.rawContent,
            parsedRecipe: deterministic,
            status: "ready_for_review",
            confidence: deterministic.confidence,
            warnings: args.warnings ?? [],
            debugExtraction: args.debugExtraction,
        };
        await cacheTextResult(ctx, textHash, result);
        return result;
    }

    if (!isRecipeLikeText(args.text)) {
        return needsInput({
            ...withoutText(args),
            rawContent: args.rawContent,
            parsedRecipe: deterministic ?? undefined,
            warning:
                "E lexuam linkun, por nuk gjetëm përbërës apo hapa. Ngjit përshkrimin ose screenshot-in.",
            warnings: args.warnings,
            reason: "NOT_RECIPE_LIKE",
            debugExtraction: {
                ...(args.debugExtraction ?? makeDebug("none", args.text)),
                reason: "NOT_RECIPE_LIKE",
            },
        });
    }

    if (!aiRecipe) {
        return needsInput({
            ...withoutText(args),
            rawContent: args.rawContent,
            parsedRecipe: deterministic ?? undefined,
            warning:
                "Nuk mundëm ta ndajmë recetën automatikisht. Ngjit tekst me përbërës dhe hapa më të plotë.",
            warnings: args.warnings,
            reason: "AI_PARSE_FAILED",
            debugExtraction: {
                ...(args.debugExtraction ?? makeDebug("none", args.text)),
                reason: "AI_PARSE_FAILED",
            },
        });
    }

    return needsInput({
        ...withoutText(args),
        rawContent: args.rawContent,
        parsedRecipe: aiRecipe,
        warning:
            "Importi duket i paplotë. Shto përbërësit dhe hapat para ruajtjes.",
        warnings: args.warnings,
        reason: "AI_PARSE_FAILED",
        debugExtraction: {
            ...(args.debugExtraction ?? makeDebug("none", args.text)),
            reason: "AI_PARSE_FAILED",
        },
    });
}

function withoutText(args: {
    sourceType: ImportSourceType;
    mode?: ImportMode;
    sourceUrl?: string;
    sourceText?: string;
    imageUri?: string;
    imageStorageId?: Id<"_storage">;
    thumbnailStorageId?: Id<"_storage">;
    imageUrl?: string;
    imageThumbnailUrl?: string;
    sourcePlatform?: SourcePlatform;
    sourceTitle?: string;
    sourceAuthor?: string;
    sourceThumbnailUrl?: string;
}) {
    return {
        sourceType: args.sourceType,
        ...(args.mode ? { mode: args.mode } : {}),
        ...(args.sourceUrl ? { sourceUrl: args.sourceUrl } : {}),
        ...(args.sourceText ? { sourceText: args.sourceText } : {}),
        ...(args.imageUri ? { imageUri: args.imageUri } : {}),
        ...(args.imageStorageId ? { imageStorageId: args.imageStorageId } : {}),
        ...(args.thumbnailStorageId ? { thumbnailStorageId: args.thumbnailStorageId } : {}),
        ...(args.imageUrl ? { imageUrl: args.imageUrl } : {}),
        ...(args.imageThumbnailUrl ? { imageThumbnailUrl: args.imageThumbnailUrl } : {}),
        ...(args.sourcePlatform ? { sourcePlatform: args.sourcePlatform } : {}),
        ...(args.sourceTitle ? { sourceTitle: args.sourceTitle } : {}),
        ...(args.sourceAuthor ? { sourceAuthor: args.sourceAuthor } : {}),
        ...(args.sourceThumbnailUrl ? { sourceThumbnailUrl: args.sourceThumbnailUrl } : {}),
    };
}

async function cacheTextResult(
    ctx: ActionCtx,
    sourceHash: string,
    result: ImportResult,
) {
    await ctx.runMutation(internal.imports.cacheImportResult, {
        sourceHash,
        sourceType: result.sourceType,
        ...(result.sourceUrl ? { sourceUrl: result.sourceUrl } : {}),
        result,
    });
}

async function resolveImportUrl(sourceUrl: string): Promise<ExtractionContext> {
    const stripped = stripTrackingParams(sourceUrl);
    const normalizedBeforeResolve = normalizePlatformUrl(stripped);

    try {
        const response = await fetchWithTimeout(normalizedBeforeResolve, {
            method: "GET",
            headers: realisticHeaders("text/html,application/xhtml+xml"),
            redirect: "follow",
        });
        const resolvedUrl = response.url ? stripTrackingParams(response.url) : normalizedBeforeResolve;

        return {
            originalUrl: sourceUrl,
            resolvedUrl,
            normalizedUrl: normalizePlatformUrl(resolvedUrl),
        };
    } catch {
        return {
            originalUrl: sourceUrl,
            resolvedUrl: normalizedBeforeResolve,
            normalizedUrl: normalizedBeforeResolve,
        };
    }
}

function detectSourceTypeFromUrl(
    value: string | undefined,
    fallback: ImportSourceType,
): ImportSourceType {
    if (!value) return fallback;
    const normalized = value.toLowerCase();

    if (normalized.includes("tiktok.com")) return "tiktok";
    if (normalized.includes("instagram.com")) return "instagram";
    if (normalized.includes("youtu.be") || normalized.includes("youtube.com")) return "youtube";
    if (normalized.startsWith("http")) return "web";

    return fallback;
}

function platformFromSource(sourceType: ImportSourceType, mode?: ImportMode): SourcePlatform {
    if (sourceType === "tiktok" || sourceType === "instagram") return sourceType;
    if (sourceType === "photo") return "photo";
    if (sourceType === "manual") return "manual";
    if (sourceType === "text" || mode === "text") return "text";
    return "unknown";
}

function stripTrackingParams(value: string) {
    try {
        const url = new URL(value);
        const allowed = new Set(["v"]);

        for (const key of [...url.searchParams.keys()]) {
            if (!allowed.has(key)) url.searchParams.delete(key);
        }

        url.hash = "";
        return url.toString();
    } catch {
        return value;
    }
}

function normalizePlatformUrl(value: string) {
    try {
        const url = new URL(value);
        const host = url.hostname.replace(/^m\./, "www.");

        url.hostname = host;

        if (host === "youtu.be") {
            const id = url.pathname.split("/").filter(Boolean)[0];
            if (id) {
                return `https://www.youtube.com/watch?v=${id}`;
            }
        }

        if (host.endsWith("youtube.com") && url.pathname.startsWith("/shorts/")) {
            const id = url.pathname.split("/").filter(Boolean)[1];
            if (id) {
                return `https://www.youtube.com/watch?v=${id}`;
            }
        }

        if (host.endsWith("instagram.com")) {
            url.search = "";
            url.hash = "";
        }

        return url.toString();
    } catch {
        return value;
    }
}

function realisticHeaders(accept: string) {
    return {
        accept,
        "accept-language": "en-US,en;q=0.9,sq;q=0.8",
        "cache-control": "no-cache",
        pragma: "no-cache",
        "user-agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    };
}

function instagramHeaders(accept: string) {
    return {
        ...realisticHeaders(accept),
        "accept-language": "en-US,en;q=0.9,sq;q=0.8,mk;q=0.7,tr;q=0.6",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "upgrade-insecure-requests": "1",
        "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
        "x-ig-app-id": "936619743392459",
    };
}

async function fetchWithTimeout(
    url: string,
    init: RequestInit = {},
    timeoutMs = 4500,
    retries = 1,
) {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                ...init,
                signal: controller.signal,
            });
            clearTimeout(timer);
            return response;
        } catch (error) {
            clearTimeout(timer);
            lastError = error;
        }
    }

    throw lastError;
}

async function getStoredImageInput(ctx: ActionCtx, storageId: Id<"_storage">) {
    const blob = await ctx.storage.get(storageId);
    const url = await ctx.storage.getUrl(storageId);

    if (!blob) return null;

    const contentType = blob.type || "image/jpeg";
    if (!contentType.startsWith("image/")) return null;

    const dataUrl = await blobToDataUrl(blob, contentType);

    return {
        dataUrl,
        url: url ?? undefined,
    };
}

async function storeRemoteImageFromUrl(ctx: ActionCtx, imageUrl?: string) {
    if (!imageUrl) return null;

    try {
        const response = await fetchWithTimeout(
            imageUrl,
            {
                headers: realisticHeaders("image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"),
                redirect: "follow",
            },
            6500,
            1,
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const blob = await response.blob();
        const contentType =
            blob.type ||
            response.headers.get("content-type")?.split(";")[0] ||
            "image/jpeg";

        if (!contentType.startsWith("image/")) {
            throw new Error("Not an image");
        }

        const storageId = await ctx.storage.store(blob);
        const url = await ctx.storage.getUrl(storageId);

        return {
            storageId,
            url: url ?? undefined,
        };
    } catch {
        return {
            warning: "Nuk arritëm ta marrim foton nga ky link.",
        };
    }
}

async function blobToDataUrl(blob: Blob, contentType: string) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    const chunkSize = 0x8000;

    for (let index = 0; index < bytes.length; index += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }

    return `data:${contentType};base64,${btoa(binary)}`;
}

async function extractWebsiteContent(sourceUrl: string, raw: RawContent) {
    const warnings: string[] = [];

    try {
        const response = await fetchWithTimeout(sourceUrl, {
            headers: realisticHeaders("text/html,application/xhtml+xml"),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();
        const jsonLdRecipe = extractJsonLdRecipe(html);
        const microdataRecipe = jsonLdRecipe ? null : extractMicrodataRecipe(html);
        const rawContent = compactRawContent({
            ...raw,
            title: raw.title ?? extractTitle(html),
            description: raw.description ?? extractMetaDescription(html),
            htmlText: extractVisibleText(html),
        });

        return {
            rawContent,
            recipe: jsonLdRecipe ?? microdataRecipe,
            warnings,
        };
    } catch {
        warnings.push(
            "Nuk mundëm ta lexojmë faqen direkt. Do provojmë tekstin që është ndarë me linkun.",
        );

        return {
            rawContent: raw,
            recipe: null,
            warnings,
        };
    }
}

async function extractTikTokContent(
    sourceUrl: string,
    raw: RawContent,
    context: ExtractionContext,
) {
    const warnings: string[] = [];
    const candidates: {
        source: DebugExtractionSource;
        text: string;
        title?: string;
        description?: string;
        htmlText?: string;
        thumbnailUrl?: string;
        sourceAuthor?: string;
    }[] = [];
    let blocked = false;

    for (const candidateUrl of uniqueStrings([
        sourceUrl,
        context.normalizedUrl,
        context.resolvedUrl,
        context.originalUrl,
    ])) {
        try {
            const response = await fetchWithTimeout(
                `https://www.tiktok.com/oembed?url=${encodeURIComponent(candidateUrl)}`,
                {
                    headers: realisticHeaders("application/json,text/plain,*/*"),
                },
                4500,
                1,
            );

            if (!response.ok) {
                warnings.push(`TikTok oEmbed returned ${response.status}.`);
                blocked = blocked || response.status === 403 || response.status === 429;
                continue;
            }

            const data = (await response.json()) as {
                title?: string;
                author_name?: string;
                thumbnail_url?: string;
                html?: string;
            };
            const htmlText = extractParagraphText(data.html ?? "");
            const text = cleanTikTokText(
                joinContent([data.title, htmlText]),
                data.author_name,
            );

            candidates.push({
                source: "tiktok_oembed",
                text,
                title: cleanTikTokText(data.title ?? "", data.author_name),
                description: data.author_name ? `TikTok nga ${data.author_name}` : undefined,
                htmlText,
                thumbnailUrl: data.thumbnail_url,
                sourceAuthor: data.author_name,
            });

            if (hasUsefulRecipeText(text)) break;
        } catch {
            warnings.push("TikTok oEmbed nuk u lexua.");
            blocked = true;
        }
    }

    try {
        const response = await fetchWithTimeout(
            sourceUrl,
            {
                headers: realisticHeaders("text/html,application/xhtml+xml"),
                redirect: "follow",
            },
            5500,
            1,
        );

        if (!response.ok) {
            warnings.push(`TikTok metadata returned ${response.status}.`);
            blocked = blocked || response.status === 403 || response.status === 429;
        } else {
            const extracted = extractTikTokTextFromHtml(await response.text());
            const text = bestTikTokCandidate([
                extracted.caption,
                extracted.jsonText,
                extracted.description,
                extracted.visibleText,
                extracted.title,
            ]);

            candidates.push({
                source: "tiktok_meta",
                text,
                title: extracted.title,
                description: extracted.description,
                htmlText: extracted.visibleText,
                thumbnailUrl: extracted.thumbnailUrl,
            });
        }
    } catch {
        warnings.push("TikTok metadata nuk u lexua.");
        blocked = true;
    }

    const itemId = uniqueStrings([
        sourceUrl,
        context.normalizedUrl,
        context.resolvedUrl,
        context.originalUrl,
    ])
        .map(extractTikTokItemId)
        .find(isNonEmptyString);

    if (itemId) {
        try {
            const response = await fetchWithTimeout(
                `https://www.tiktok.com/api/item/detail/?itemId=${encodeURIComponent(itemId)}&aid=1988`,
                {
                    headers: {
                        ...realisticHeaders("application/json,text/plain,*/*"),
                        referer: sourceUrl,
                    },
                },
                5500,
                1,
            );

            if (!response.ok) {
                warnings.push(`TikTok item detail returned ${response.status}.`);
                blocked = blocked || response.status === 403 || response.status === 429;
            } else {
                const detailCandidates: string[] = [];
                collectTikTokJsonCandidates(await response.json(), detailCandidates);
                const text = bestTikTokCandidate(detailCandidates);

                candidates.push({
                    source: "tiktok_meta",
                    text,
                    title: titleFromSocialCaption(text),
                    description: text ? "TikTok video metadata" : undefined,
                    htmlText: text,
                });
            }
        } catch {
            warnings.push("TikTok video metadata nuk u lexua.");
        }
    }

    const best = candidates
        .filter((candidate) => candidate.text.trim())
        .sort((a, b) => scoreTikTokCandidate(b.text) - scoreTikTokCandidate(a.text))[0];
    const text = best ? cleanTikTokText(best.text) : "";
    const derivedTitle = titleFromSocialCaption(text) ?? best?.title ?? raw.title;

    return {
        rawContent: compactRawContent({
            ...raw,
            title: derivedTitle,
            description: best?.description ?? raw.description,
            caption: text || undefined,
            htmlText: best?.htmlText ?? raw.htmlText,
        }),
        text,
        thumbnailUrl: best?.thumbnailUrl,
        sourceAuthor: best?.sourceAuthor,
        warnings,
        blocked: blocked && !text,
        debugExtraction: makeDebug(best?.source ?? "tiktok_oembed", text, context),
    };
}

async function extractInstagramContent(
    sourceUrl: string,
    raw: RawContent,
    context: ExtractionContext,
) {
    const warnings: string[] = [];
    const htmlDocuments: { source: DebugExtractionSource; html: string }[] = [];
    let blocked = false;

    try {
        const response = await fetchWithTimeout(
            sourceUrl,
            {
                headers: instagramHeaders("text/html,application/xhtml+xml"),
                redirect: "follow",
            },
            5500,
            1,
        );

        if (!response.ok) {
            warnings.push(`Instagram returned ${response.status}.`);
            blocked = response.status === 401 || response.status === 403 || response.status === 429;
        } else {
            htmlDocuments.push({
                source: "instagram_meta",
                html: await response.text(),
            });
        }
    } catch {
        warnings.push("Instagram metadata nuk u lexua.");
        blocked = true;
    }

    const embedUrl = buildInstagramEmbedUrl(sourceUrl);
    if (embedUrl) {
        try {
            const response = await fetchWithTimeout(
                embedUrl,
                {
                    headers: instagramHeaders("text/html,application/xhtml+xml"),
                    redirect: "follow",
                },
                5500,
                1,
            );

            if (!response.ok) {
                warnings.push(`Instagram embed returned ${response.status}.`);
                blocked = blocked || response.status === 401 || response.status === 403 || response.status === 429;
            } else {
                htmlDocuments.push({
                    source: "instagram_embed",
                    html: await response.text(),
                });
            }
        } catch {
            warnings.push("Instagram embed nuk u lexua.");
        }
    }

    let best = {
        source: "instagram_meta" as DebugExtractionSource,
        text: "",
        title: raw.title,
        description: raw.description,
        thumbnailUrl: undefined as string | undefined,
        sourceAuthor: undefined as string | undefined,
    };

    for (const document of htmlDocuments) {
        const extracted = extractInstagramTextFromHtml(document.html);
        const text = bestInstagramCandidate([
            extracted.caption,
            extracted.quotedDescription,
            extracted.jsonText,
            extracted.description,
            extracted.visibleText,
            extracted.title,
        ]);

        if (scoreInstagramCandidate(text) > scoreInstagramCandidate(best.text)) {
            best = {
                source: document.source,
                text,
                title: extracted.title ?? best.title,
                description: extracted.description ?? best.description,
                thumbnailUrl: extracted.thumbnailUrl ?? best.thumbnailUrl,
                sourceAuthor: extracted.sourceAuthor ?? best.sourceAuthor,
            };
        }
    }

    const textIsGeneric = isGenericInstagramText(best.text);
    const derivedTitle = titleFromSocialCaption(best.text) ?? best.title;

    return {
        rawContent: compactRawContent({
            ...raw,
            title: derivedTitle,
            description: best.description,
            caption: textIsGeneric ? undefined : best.text,
        }),
        text: textIsGeneric ? "" : best.text,
        thumbnailUrl: best.thumbnailUrl,
        sourceAuthor: best.sourceAuthor,
        warnings,
        blocked: blocked && !best.text,
        debugExtraction: makeDebug(best.source, best.text, context),
    };
}

function extractParagraphText(html: string) {
    const paragraphs = html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/gi) ?? [];
    return paragraphs
        .map((paragraph) =>
            decodeHtml(paragraph.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim(),
        )
        .filter(Boolean)
        .join("\n");
}

function buildInstagramEmbedUrl(sourceUrl: string) {
    try {
        const url = new URL(sourceUrl);
        const segments = url.pathname.split("/").filter(Boolean);
        const type = segments[0];
        const shortcode = segments[1];

        if (!shortcode || !["p", "reel", "tv"].includes(type)) return null;

        return `https://www.instagram.com/${type}/${shortcode}/embed/captioned/`;
    } catch {
        return null;
    }
}

function extractInstagramTextFromHtml(html: string) {
    const title = extractTitle(html);
    const description =
        extractMetaContent(html, "og:description") ??
        extractMetaContent(html, "description") ??
        extractMetaContent(html, "twitter:description");
    const quotedDescription = extractInstagramCaptionFromDescription(description);
    const jsonText = extractInstagramJsonCaption(html);
    const visibleText = extractInstagramVisibleText(html);
    const thumbnailUrl =
        extractMetaContent(html, "og:image") ??
        extractMetaContent(html, "twitter:image");
    const sourceAuthor =
        extractMetaContent(html, "instapp:owner_user_id") ??
        title?.match(/^([^(@|]+)(?:\(| on Instagram| •)/i)?.[1]?.trim();

    return {
        title,
        description: description ? decodeHtml(description).replace(/\s+/g, " ").trim() : undefined,
        quotedDescription,
        caption: quotedDescription ?? jsonText,
        jsonText,
        visibleText,
        thumbnailUrl,
        sourceAuthor,
    };
}

function extractTikTokTextFromHtml(html: string) {
    const title = extractTitle(html);
    const description =
        extractMetaContent(html, "og:description") ??
        extractMetaContent(html, "description") ??
        extractMetaContent(html, "twitter:description");
    const caption = extractTikTokCaptionFromDescription(description);
    const jsonText = extractTikTokJsonCaption(html);
    const visibleText = extractTikTokVisibleText(html);
    const thumbnailUrl =
        extractMetaContent(html, "og:image") ??
        extractMetaContent(html, "twitter:image");

    return {
        title: title ? cleanTikTokText(title) : undefined,
        description: description ? cleanTikTokText(description) : undefined,
        caption,
        jsonText,
        visibleText,
        thumbnailUrl,
    };
}

function extractTikTokItemId(sourceUrl: string | undefined) {
    if (!sourceUrl) return undefined;

    try {
        const url = new URL(sourceUrl);
        const segments = url.pathname.split("/").filter(Boolean);
        const videoIndex = segments.findIndex((segment) => segment === "video");
        const photoIndex = segments.findIndex((segment) => segment === "photo");
        const id =
            (videoIndex >= 0 ? segments[videoIndex + 1] : undefined) ??
            (photoIndex >= 0 ? segments[photoIndex + 1] : undefined);

        return id && /^\d{8,}$/.test(id) ? id : undefined;
    } catch {
        return sourceUrl.match(/(?:video|photo)\/(\d{8,})/)?.[1];
    }
}

function extractInstagramCaptionFromDescription(description?: string) {
    if (!description) return undefined;

    const decoded = decodeHtml(description).replace(/\s+/g, " ").trim();
    const quoted =
        decoded.match(/[""]([^""]{25,5000})[""]/)?.[1] ??
        decoded.match(/:\s*([^:]{35,5000})$/)?.[1];

    return quoted ? cleanInstagramText(quoted) : undefined;
}

function extractTikTokCaptionFromDescription(description?: string) {
    if (!description) return undefined;

    const decoded = decodeHtml(description).replace(/\s+/g, " ").trim();
    const quoted =
        decoded.match(/[""]([^""]{20,5000})[""]/)?.[1] ??
        decoded.match(/:\s*([^:]{35,5000})$/)?.[1] ??
        decoded;
    const cleaned = cleanTikTokText(quoted);

    return cleaned.length > 20 && !isGenericTikTokText(cleaned) ? cleaned : undefined;
}

function extractInstagramVisibleText(html: string) {
    const candidates = [
        ...extractTaggedText(html, "blockquote"),
        ...extractTaggedText(html, "figcaption"),
        ...extractTaggedText(html, "article"),
    ]
        .map(cleanInstagramText)
        .filter((candidate) => candidate.length > 25 && !isGenericInstagramText(candidate));

    return candidates.sort((a, b) => scoreInstagramCandidate(b) - scoreInstagramCandidate(a))[0];
}

function extractTikTokVisibleText(html: string) {
    const candidates = [
        ...extractTaggedText(html, "h1"),
        ...extractTaggedText(html, "h2"),
        ...extractTaggedText(html, "p"),
        ...extractTaggedText(html, "span"),
    ]
        .map((candidate) => cleanTikTokText(candidate))
        .filter((candidate) => candidate.length > 20 && !isGenericTikTokText(candidate));

    return candidates.sort((a, b) => scoreTikTokCandidate(b) - scoreTikTokCandidate(a))[0];
}

function extractTaggedText(html: string, tagName: string) {
    const values: string[] = [];
    const regex = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi");

    for (const match of html.matchAll(regex)) {
        const value = decodeHtml((match[1] ?? "").replace(/<[^>]+>/g, "\n"))
            .replace(/[ \t]{2,}/g, " ")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
        if (value) values.push(value);
    }

    return values;
}

function extractTikTokJsonCaption(html: string) {
    const candidates: string[] = [];
    const ldJsonBlocks = html.matchAll(
        /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    );

    for (const block of ldJsonBlocks) {
        const payload = decodeHtml(block[1] ?? "").trim();

        try {
            collectTikTokJsonCandidates(JSON.parse(payload), candidates);
        } catch {
            continue;
        }
    }

    const scripts = html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/gi) ?? [];

    for (const script of scripts) {
        const text = decodeHtml(script.replace(/<script\b[^>]*>/i, "").replace(/<\/script>/i, ""));
        if (!/(desc|description|caption|shareMeta|videoData|itemStruct)/i.test(text)) {
            continue;
        }

        for (const match of text.matchAll(/"(?:desc|description|caption|title)"\s*:\s*"((?:\\.|[^"\\]){20,5000})"/g)) {
            const value = safeJsonString(match[1]);
            if (value) candidates.push(value);
        }

        for (const match of text.matchAll(/\\+"(?:desc|description|caption|title)\\+"\s*:\s*\\+"((?:\\\\.|[^"\\]){20,5000})\\+"/g)) {
            const value = safeJsonString(match[1].replace(/\\"/g, '"'));
            if (value) candidates.push(value);
        }
    }

    return candidates
        .map((candidate) => cleanTikTokText(candidate))
        .filter((candidate) => candidate.length > 20 && !isGenericTikTokText(candidate))
        .sort((a, b) => scoreTikTokCandidate(b) - scoreTikTokCandidate(a))[0];
}

function cleanTikTokText(text: string, authorName?: string) {
    return cleanSocialText(text)
        .replace(/\bTikTok video from [^:]{1,140}:\s*/gi, " ")
        .replace(/\b\d+(?:[.,]\d+)?[kmb]?\s+likes?,?\s*\d*(?:[.,]\d+)?[kmb]?\s*comments?\.?/gi, " ")
        .replace(/\boriginal sound\s*[-:].*$/gim, " ")
        .replace(/^TikTok\s*[-:]\s*/gi, " ")
        .split(/\n+/)
        .map((line) => line.trim())
        .filter((line) => {
            const normalized = line.toLowerCase();
            if (!line) return false;
            if (authorName && normalized === authorName.toLowerCase()) return false;
            if (/^@[\w.-]+$/.test(line)) return false;
            if (/original sound/i.test(line)) return false;
            if (/^watch more trending videos/i.test(line)) return false;
            if (isHashtagsOnly(line)) return false;
            return true;
        })
        .join("\n")
        .trim();
}

function bestTikTokCandidate(candidates: (string | undefined)[]) {
    return candidates
        .map((candidate) => cleanTikTokText(candidate ?? ""))
        .filter((candidate) => candidate.length > 20 && !isGenericTikTokText(candidate))
        .sort((a, b) => scoreTikTokCandidate(b) - scoreTikTokCandidate(a))[0] ?? "";
}

function cleanInstagramText(text: string) {
    return cleanSocialText(text)
        .replace(/\bon instagram\b/gi, " ")
        .replace(/\binstagram\b/gi, " ")
        .replace(/\b[\d,.]+\s+likes?,?\s*[\d,.]*\s*comments?\b/gi, " ")
        .replace(/^[\w.\-]+\s+on\s+[A-Z][a-z]+\s+\d{1,2},\s+\d{4}:\s*/i, " ")
        .replace(/\bview all [\d,.]+ comments\b/gi, " ")
        .replace(/\b[\w.\-]+ posted (?:a )?(?:photo|video|reel)\b/gi, " ")
        .replace(/\bshared a post\b/gi, " ")
        .replace(/\bsee photos and videos from\b/gi, " ")
        .replace(/\blog in to like or comment\b/gi, " ")
        .split(/\n+/)
        .map((line) => line.trim())
        .filter((line) => line && !isHashtagsOnly(line) && !/^@[\w.-]+$/.test(line))
        .join("\n")
        .replace(/\s{2,}/g, " ")
        .trim();
}

function cleanSocialText(text: string) {
    return decodeHtml(text)
        .replace(/https?:\/\/[^\s]+/gi, " ")
        .replace(/\s+#/g, "\n#")
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function isHashtagsOnly(text: string) {
    const tokens = text.split(/\s+/).filter(Boolean);
    return tokens.length > 0 && tokens.every((token) => /^#[\p{L}\p{N}_-]+$/u.test(token));
}

function isGenericInstagramText(text: string) {
    const normalized = text.toLowerCase().trim();
    return (
        !normalized ||
        normalized === "instagram" ||
        normalized === "photos and videos" ||
        normalized.includes("create an account or log in") ||
        normalized.includes("see instagram photos and videos")
    );
}

function isGenericTikTokText(text: string) {
    const normalized = text.toLowerCase().trim();
    return (
        !normalized ||
        normalized === "tiktok" ||
        normalized === "make your day" ||
        normalized.includes("watch more trending videos") ||
        normalized.includes("discover videos related to") ||
        normalized.includes("log in to follow creators") ||
        normalized.includes("download the app")
    );
}

function extractInstagramJsonCaption(html: string) {
    const candidates: string[] = [];
    const ldJsonBlocks = html.matchAll(
        /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    );

    for (const block of ldJsonBlocks) {
        const payload = decodeHtml(block[1] ?? "").trim();

        try {
            collectInstagramJsonCandidates(JSON.parse(payload), candidates);
        } catch {
            continue;
        }
    }

    const scripts = html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/gi) ?? [];

    for (const script of scripts) {
        const text = decodeHtml(script.replace(/<script\b[^>]*>/i, "").replace(/<\/script>/i, ""));
        if (!/(caption|edge_media_to_caption|accessibility_caption|shortcode_media)/i.test(text)) {
            continue;
        }

        for (const match of text.matchAll(/"(?:text|caption|accessibility_caption|description)"\s*:\s*"((?:\\.|[^"\\]){20,5000})"/g)) {
            const value = safeJsonString(match[1]);
            if (value) candidates.push(value);
        }

        for (const match of text.matchAll(/\\+"(?:text|caption|accessibility_caption|description)\\+"\s*:\s*\\+"((?:\\\\.|[^"\\]){20,5000})\\+"/g)) {
            const value = safeJsonString(match[1].replace(/\\"/g, '"'));
            if (value) candidates.push(value);
        }
    }

    return candidates
        .map(cleanInstagramText)
        .filter((candidate) => candidate.length > 20)
        .sort((a, b) => b.length - a.length)[0];
}

function bestInstagramCandidate(candidates: (string | undefined)[]) {
    return candidates
        .map((candidate) => cleanInstagramText(candidate ?? ""))
        .filter((candidate) => candidate.length > 20 && !isGenericInstagramText(candidate))
        .sort((a, b) => scoreInstagramCandidate(b) - scoreInstagramCandidate(a))[0] ?? "";
}

function titleFromSocialCaption(text: string) {
    const line = text
        .split(/\r?\n/)
        .map((item) =>
            item
                .replace(/^[^\p{L}\p{N}]+/u, "")
                .replace(/\s+[—-]\s+.*$/, "")
                .trim(),
        )
        .find(
            (item) =>
                item.length >= 8 &&
                item.length <= 120 &&
                !isLikelyIngredient(item) &&
                !/\b(save|send this|comment|follow|like)\b/i.test(item),
        );

    return line;
}

function collectTikTokJsonCandidates(value: unknown, candidates: string[]) {
    if (Array.isArray(value)) {
        for (const item of value) collectTikTokJsonCandidates(item, candidates);
        return;
    }

    if (!isRecord(value)) return;

    for (const [key, nested] of Object.entries(value)) {
        if (
            typeof nested === "string" &&
            /^(caption|desc|description|text|title|name)$/i.test(key) &&
            nested.trim().length >= 20
        ) {
            candidates.push(nested);
        }

        if (Array.isArray(nested) || isRecord(nested)) {
            collectTikTokJsonCandidates(nested, candidates);
        }
    }
}

function collectInstagramJsonCandidates(value: unknown, candidates: string[]) {
    if (Array.isArray(value)) {
        for (const item of value) collectInstagramJsonCandidates(item, candidates);
        return;
    }

    if (!isRecord(value)) return;

    for (const [key, nested] of Object.entries(value)) {
        if (
            typeof nested === "string" &&
            /^(caption|description|text|articleBody|accessibility_caption|name)$/i.test(key) &&
            nested.trim().length >= 20
        ) {
            candidates.push(nested);
        }

        if (Array.isArray(nested) || isRecord(nested)) {
            collectInstagramJsonCandidates(nested, candidates);
        }
    }
}

function scoreInstagramCandidate(text: string) {
    if (!text || isGenericInstagramText(text)) return 0;

    const normalized = text.replace(/https?:\/\/[^\s]+/gi, " ").trim();
    let score = Math.min(normalized.length, 1200);

    if (isRecipeLikeText(normalized)) score += 1600;
    if (/\n/.test(normalized)) score += 200;
    if (/\b(p[eë]rb[eë]r[eë]s|ingredients|hapat|p[eë]rgatitja|method|instructions)\b/i.test(normalized)) {
        score += 600;
    }
    if (isHashtagsOnly(normalized)) score = 0;

    return score;
}

function scoreTikTokCandidate(text: string) {
    if (!text || isGenericTikTokText(text)) return 0;

    const normalized = text.replace(/https?:\/\/[^\s]+/gi, " ").trim();
    let score = Math.min(normalized.length, 1200);

    if (isRecipeLikeText(normalized)) score += 1600;
    if (/\n/.test(normalized)) score += 200;
    if (/\b(p[eë]rb[eë]r[eë]s|ingredients|hapat|p[eë]rgatitja|method|instructions)\b/i.test(normalized)) {
        score += 600;
    }
    if (/\b(follow|like|share|comment|viral|fyp|foryou)\b/i.test(normalized)) score -= 250;
    if (isHashtagsOnly(normalized)) score = 0;

    return score;
}

function safeJsonString(value: string) {
    try {
        return JSON.parse(`"${value}"`) as string;
    } catch {
        return value
            .replace(/\\"/g, '"')
            .replace(/\\n/g, "\n")
            .replace(/\\u([\dA-Fa-f]{4})/g, (_, hex: string) =>
                String.fromCharCode(Number.parseInt(hex, 16)),
            );
    }
}

async function extractWebsiteMetadata(sourceUrl: string, raw: RawContent) {
    const warnings: string[] = [];

    try {
        const response = await fetchWithTimeout(sourceUrl, {
            headers: realisticHeaders("text/html,application/xhtml+xml"),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();

        return {
            rawContent: compactRawContent({
                ...raw,
                title: raw.title ?? extractTitle(html),
                description: raw.description ?? extractMetaDescription(html),
            }),
            warnings,
        };
    } catch {
        warnings.push("Nuk mundëm të lexojmë metadata nga linku.");

        return {
            rawContent: raw,
            warnings,
        };
    }
}

async function extractYouTubeContent(
    sourceUrl: string,
    raw: RawContent,
    context: ExtractionContext,
) {
    let title = raw.title;
    const warnings: string[] = [];

    try {
        const response = await fetchWithTimeout(
            `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(
                sourceUrl,
            )}`,
            {
                headers: realisticHeaders("application/json,text/plain,*/*"),
            },
            4500,
            1,
        );

        if (response.ok) {
            const data = (await response.json()) as { title?: string; author_name?: string };
            title = title ?? data.title;
        } else {
            warnings.push(`YouTube oEmbed returned ${response.status}.`);
        }
    } catch {
        warnings.push("YouTube oEmbed nuk u lexua.");
    }

    const metadata = await extractWebsiteMetadata(sourceUrl, {
        ...raw,
        ...(title ? { title } : {}),
    });

    return {
        rawContent: compactRawContent(metadata.rawContent),
        warnings: [...warnings, ...metadata.warnings],
        debugExtraction: makeDebug(
            "youtube_oembed",
            joinContent([metadata.rawContent.title, metadata.rawContent.description]),
            context,
        ),
    };
}

function extractJsonLdRecipe(html: string): ParsedRecipe | null {
    const blocks = html.matchAll(
        /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    );

    for (const block of blocks) {
        const payload = decodeHtml(block[1] ?? "").trim();

        try {
            const parsed = JSON.parse(payload) as unknown;
            const recipe = findRecipeNode(parsed);
            if (recipe) return normalizeJsonLdRecipe(recipe);
        } catch {
            continue;
        }
    }

    return null;
}

function findRecipeNode(value: unknown): Record<string, unknown> | null {
    if (Array.isArray(value)) {
        for (const item of value) {
            const found = findRecipeNode(item);
            if (found) return found;
        }
        return null;
    }

    if (!isRecord(value)) return null;

    if (isRecipeType(value["@type"])) return value;

    const graph = value["@graph"];
    if (Array.isArray(graph)) {
        for (const item of graph) {
            const found = findRecipeNode(item);
            if (found) return found;
        }
    }

    return null;
}

function normalizeJsonLdRecipe(node: Record<string, unknown>): ParsedRecipe | null {
    const title = textFromUnknown(node.name) ?? textFromUnknown(node.headline);
    const ingredients = arrayFromUnknown(node.recipeIngredient)
        .map(textFromUnknown)
        .filter(isNonEmptyString)
        .slice(0, 80)
        .map((text) => ({
            text,
            confidence: "high" as const,
        }));
    const steps = normalizeInstructions(node.recipeInstructions).slice(0, 80);

    if (!title || ingredients.length === 0 || steps.length === 0) return null;

    return compactParsedRecipe({
        title,
        ...(textFromUnknown(node.description)
            ? { description: textFromUnknown(node.description) }
            : {}),
        language: "unknown",
        ingredients,
        steps,
        ...(numberFromUnknown(node.recipeYield)
            ? { servings: numberFromUnknown(node.recipeYield) }
            : {}),
        ...(minutesFromDuration(node.prepTime)
            ? { prepTimeMinutes: minutesFromDuration(node.prepTime) }
            : {}),
        ...(minutesFromDuration(node.cookTime)
            ? { cookTimeMinutes: minutesFromDuration(node.cookTime) }
            : {}),
        tags: arrayFromUnknown(node.keywords)
            .flatMap((item) => String(item).split(","))
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 12),
        ...(textFromUnknown(node.recipeCuisine)
            ? { cuisine: textFromUnknown(node.recipeCuisine) }
            : {}),
        ambiguityNotes: [],
        needsUserReview: false,
        confidence: "high",
    });
}

function extractMicrodataRecipe(html: string): ParsedRecipe | null {
    if (!/schema\.org\/Recipe/i.test(html)) return null;

    const title =
        extractItempropContent(html, "name") ??
        extractItempropText(html, "name") ??
        extractTitle(html);
    const description =
        extractItempropContent(html, "description") ??
        extractItempropText(html, "description") ??
        extractMetaDescription(html);
    const ingredients = extractAllItempropValues(html, "recipeIngredient")
        .concat(extractAllItempropValues(html, "ingredients"))
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 80)
        .map((text) => ({ text, confidence: "medium" as const }));
    const steps = extractAllItempropValues(html, "recipeInstructions")
        .flatMap(splitInstructionText)
        .slice(0, 80);

    if (!title || ingredients.length === 0 || steps.length === 0) return null;

    return compactParsedRecipe({
        title,
        ...(description ? { description } : {}),
        language: "unknown",
        ingredients,
        steps,
        tags: [],
        ambiguityNotes: [],
        needsUserReview: true,
        confidence: "medium",
    });
}

function extractItempropContent(html: string, prop: string) {
    const tag = html.match(
        new RegExp(`<[^>]+itemprop=["']${prop}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    )?.[1];
    return tag ? decodeHtml(tag).replace(/\s+/g, " ").trim() : undefined;
}

function extractItempropText(html: string, prop: string) {
    const match = html.match(
        new RegExp(`<[^>]+itemprop=["']${prop}["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, "i"),
    )?.[1];
    return match
        ? decodeHtml(match.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim()
        : undefined;
}

function extractAllItempropValues(html: string, prop: string) {
    const values: string[] = [];
    const regex = new RegExp(
        `<[^>]+itemprop=["']${prop}["'][^>]*(?:content=["']([^"']+)["'][^>]*)?>([\\s\\S]*?)<\\/[^>]+>`,
        "gi",
    );

    for (const match of html.matchAll(regex)) {
        const value = match[1] ?? match[2];
        const cleaned = decodeHtml((value ?? "").replace(/<[^>]+>/g, " "))
            .replace(/\s+/g, " ")
            .trim();
        if (cleaned) values.push(cleaned);
    }

    return values;
}

function parseStructuredRecipeText(
    text: string,
    fallbackTitle?: string,
): ParsedRecipe | null {
    const lines = text
        .split(/\r?\n/)
        .map((line) => stripListMarker(line.trim()))
        .filter(Boolean)
        .slice(0, 220);

    if (lines.length === 0) return null;

    const ingredientHeadingIndex = lines.findIndex((line) =>
        /^(p[eë]rb[eë]r[eë]s|ingredients|sastojci|состојки|malzemeler)\b/i.test(
            line,
        ),
    );
    const stepHeadingIndex = lines.findIndex((line) =>
        /^(hapat|p[eë]rgatitja|udh[eë]zime|steps|method|instructions|hazırlanışı|подготовка|начин)\b/i.test(
            line,
        ),
    );

    // Only run deterministic parser if there are clear section headings
    // Otherwise social captions get garbled — let AI handle those
    if (ingredientHeadingIndex < 0 && stepHeadingIndex < 0) {
        return null;
    }

    const title =
        fallbackTitle ??
        lines.find(
            (line) =>
                !/^https?:\/\//i.test(line) &&
                !/^(p[eë]rb[eë]r[eë]s|ingredients|hapat|steps|method)\b/i.test(line),
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
            : lines.filter((line) => !isLikelyIngredient(line)).slice(title ? 1 : 0);

    if (!title || ingredientLines.length === 0 || stepLines.length === 0) {
        return null;
    }

    return compactParsedRecipe({
        title,
        language: detectLanguage(text),
        ingredients: ingredientLines.slice(0, 80).map((line) => ({
            text: line,
            confidence: "medium" as const,
        })),
        steps: stepLines.slice(0, 80),
        tags: [],
        ambiguityNotes: [],
        needsUserReview: ingredientLines.length < 3 || stepLines.length < 2,
        confidence: ingredientLines.length >= 3 && stepLines.length >= 2 ? "medium" : "low",
    });
}

async function parseRecipeWithAi(args: {
    text: string;
    imageDataUrl?: string;
    fallbackTitle?: string;
}): Promise<ParsedRecipe | null> {
    const api = getAiConfigForProvider({ requiresVision: Boolean(args.imageDataUrl) });
    if (!api) return null;

    const prompt = [
        "You are a recipe extraction expert for Receta Ime, an Albanian recipe saving app.",
        "",
        "TASK: Extract ONE clean recipe from the provided text and/or image and return it fully in Albanian.",
        "",
        "CRITICAL LANGUAGE RULE:",
        "1. ALWAYS translate all user-facing recipe content to Albanian.",
        "2. This includes title, description, ingredient lines, steps, tags, cuisine, and ambiguity notes.",
        "3. The source may be French, English, Turkish, Macedonian, Albanian, or mixed. The output must still be natural Albanian.",
        "4. Set language to 'sq' because the saved recipe content is Albanian.",
        "",
        "DESCRIPTION RULE:",
        "Generate a short subtle Albanian description, 1 sentence only, max 140 characters.",
        "Example style:",
        "'Një tiramisu kremoz me fëstëk, biskota të njomura në kafe dhe krem mascarpone.'",
        "Do not mention Instagram, TikTok, captions, creators, or social media.",
        "",
        "INGREDIENT RULES:",
        "1. Ingredients must be clean Albanian lines.",
        "2. Keep quantities faithful.",
        "3. Translate ingredient names naturally.",
        "4. Do not put instructions inside ingredients.",
        "5. Do not put section headers as ingredients unless needed.",
        "6. Keep vague Balkan measurements natural:",
        "- 'miell sa të merr' → 'miell sipas nevojës'",
        "- 'pak kripë' → 'pak kripë'",
        "- 'me sy' → 'sipas dëshirës'",
        "- '1 gotë' → '1 gotë'",
        "- '1 filxhan' → '1 filxhan kafeje'",
        "",
        "French translation hints:",
        "- sucre → sheqer",
        "- sucre glace → sheqer pluhur",
        "- lait → qumësht",
        "- beurre → gjalpë",
        "- crème liquide entière → ajkë/krem qumështi",
        "- crème à fouetter → krem për rrahje",
        "- fraises → luleshtrydhe",
        "- oeufs / œufs → vezë",
        "- farine → miell",
        "- maïzena → niseshte misri",
        "- café → kafe",
        "- biscuits à la cuillère / savoiardi → biskota savoiardi",
        "- pâte de pistache → pastë fëstëku",
        "- pistaches concassées → fëstëkë të grimcuar",
        "- càs / c.à.s / cas → lugë gjelle",
        "",
        "STEP RULES:",
        "1. Steps must be individual cooking/preparation instructions in Albanian.",
        "2. Each step should be one clear action sentence.",
        "3. Do NOT dump the whole caption into steps.",
        "4. Do NOT include ingredients as steps.",
        "5. Do NOT include hashtags, links, emojis, creator text, follow/like/share text, or promo text.",
        "6. If the source mixes ingredients and instructions together, separate them properly.",
        "7. If component sections exist, combine them into a clean ordered recipe.",
        "",
        "CONFIDENCE RULES:",
        "Set confidence high if full ingredients and steps are found.",
        "Set confidence medium if usable but some details are unclear.",
        "Set confidence low if incomplete.",
        "If the image is not a recipe, set confidence low and explain why in warnings.",
        "If something is vague, set needsUserReview:true and add an ambiguity note in Albanian.",
        "Do not invent missing ingredients, timing, or servings. If timing/servings are missing, return null or omit them.",
        "",
        "OUTPUT:",
        "Strict JSON only. No markdown. No explanation.",
        "",
        "Return exactly this TypeScript-compatible shape:",
        '{"title":"string","description":"string","language":"sq","ingredients":[{"text":"string","name":"string optional","quantity":"string optional","unit":"string optional","notes":"string optional","confidence":"low|medium|high"}],"steps":[{"order":number,"text":"string"}],"tips":["string"],"servings":number|null,"prepTimeMinutes":number|null,"cookTimeMinutes":number|null,"tags":["string"],"cuisine":"string optional","missingInfo":["string"],"warnings":["string"],"ambiguityNotes":["string"],"needsUserReview":boolean,"confidence":"low|medium|high"}',
        "",
        args.fallbackTitle
            ? `Fallback title, translate to Albanian if useful: ${args.fallbackTitle}`
            : "",
        "",
        args.text.trim() ? "SOURCE TEXT:" : "SOURCE TEXT: none",
        args.text.slice(0, 12000),
    ]
        .filter(Boolean)
        .join("\n");
    const content: (
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
    )[] = [{ type: "text", text: prompt }];

    if (args.imageDataUrl) {
        content.push({
            type: "image_url",
            image_url: { url: args.imageDataUrl },
        });
    }

    for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
            const response = await fetch(`${api.baseUrl}/chat/completions`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    authorization: `Bearer ${api.apiKey}`,
                },
                body: JSON.stringify({
                    model: api.model,
                    temperature: 0.1,
                    response_format: { type: "json_object" },
                    messages: [
                        {
                            role: "system",
                            content:
                                "You are Receta Ime's recipe parser. Extract recipes from any language and return one clean recipe fully translated into natural Albanian as valid JSON only. Output only the JSON object.",
                        },
                        { role: "user", content },
                    ],
                }),
            });

            if (!response.ok) continue;

            const payload = (await response.json()) as {
                choices?: { message?: { content?: string } }[];
            };

            const aiContent = payload.choices?.[0]?.message?.content;
            const recipe = aiContent
                ? sanitizeParsedRecipe(JSON.parse(stripJson(aiContent)))
                : null;

            if (recipe) {
                return {
                    ...recipe,
                    language: "sq",
                    title: recipe.title?.trim() || "Recetë e importuar",
                    description: recipe.description?.trim() || undefined,
                    ingredients: recipe.ingredients ?? [],
                    steps: recipe.steps ?? [],
                    tags: recipe.tags ?? [],
                    ambiguityNotes: recipe.ambiguityNotes ?? [],
                    needsUserReview: true,
                };
            }
        } catch {
            continue;
        }
    }

    return null;
}

function getAiConfig() {
    return getAiConfigForProvider({});
}

function getAiConfigForProvider(options: { requiresVision?: boolean }) {
    if (options.requiresVision) {
        const openAiKey = process.env.OPENAI_API_KEY;
        if (openAiKey) {
            return {
                apiKey: openAiKey,
                baseUrl: "https://api.openai.com/v1",
                model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
            };
        }

        return null;
    }

    const deepSeekKey = process.env.DEEPSEEK_API_KEY;
    if (deepSeekKey) {
        return {
            apiKey: deepSeekKey,
            baseUrl: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
            model: process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash",
        };
    }

    const openAiKey = process.env.OPENAI_API_KEY;
    if (openAiKey) {
        return {
            apiKey: openAiKey,
            baseUrl: "https://api.openai.com/v1",
            model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
        };
    }

    return null;
}

function sanitizeParsedRecipe(value: unknown): ParsedRecipe | null {
    if (!isRecord(value)) return null;

    const validated = aiRecipeSchema.safeParse(value);
    const normalizedValue = validated.success ? validated.data : value;
    const title = textFromUnknown(normalizedValue.title);
    if (!title) return null;

    const ingredients = arrayFromUnknown(normalizedValue.ingredients)
        .map((item) => {
            if (typeof item === "string") {
                return { text: item, confidence: "low" as const };
            }
            if (!isRecord(item)) return null;
            const name = textFromUnknown(item.name) ?? textFromUnknown(item.item);
            const quantity = textFromUnknown(item.quantity) ?? textFromUnknown(item.amount);
            const unit = textFromUnknown(item.unit);
            const text =
                textFromUnknown(item.text) ??
                [quantity, unit, name].filter(Boolean).join(" ").trim();
            if (!text) return null;
            return {
                text,
                ...(quantity
                    ? { amount: quantity }
                    : {}),
                ...(unit ? { unit } : {}),
                ...(name ? { item: name } : {}),
                ...(textFromUnknown(item.note) ?? textFromUnknown(item.notes)
                    ? { note: textFromUnknown(item.note) ?? textFromUnknown(item.notes) }
                    : {}),
                confidence: normalizeConfidence(item.confidence),
            };
        })
        .filter((item): item is ParsedRecipe["ingredients"][number] => item !== null)
        .slice(0, 80);

    const steps = arrayFromUnknown(normalizedValue.steps)
        .map((step) => {
            if (isRecord(step)) return textFromUnknown(step.text);
            return textFromUnknown(step);
        })
        .filter(isNonEmptyString)
        // Filter out steps that look like ingredients or are too short to be real steps
        .filter((step) => step.length > 10 && !isLikelyIngredientLine(step))
        .slice(0, 80);

    return compactParsedRecipe({
        title,
        ...(textFromUnknown(normalizedValue.description)
            ? { description: textFromUnknown(normalizedValue.description) }
            : {}),
        language: normalizeLanguage(normalizedValue.language),
        ingredients,
        steps,
        ...(numberFromUnknown(normalizedValue.servings)
            ? { servings: numberFromUnknown(normalizedValue.servings) }
            : {}),
        ...(numberFromUnknown(normalizedValue.prepTimeMinutes)
            ? { prepTimeMinutes: numberFromUnknown(normalizedValue.prepTimeMinutes) }
            : {}),
        ...(numberFromUnknown(normalizedValue.cookTimeMinutes)
            ? { cookTimeMinutes: numberFromUnknown(normalizedValue.cookTimeMinutes) }
            : {}),
        tags: arrayFromUnknown(normalizedValue.tags)
            .map(textFromUnknown)
            .filter(isNonEmptyString)
            .slice(0, 12),
        ...(textFromUnknown(normalizedValue.cuisine)
            ? { cuisine: textFromUnknown(normalizedValue.cuisine) }
            : {}),
        ambiguityNotes: [
            ...arrayFromUnknown(normalizedValue.ambiguityNotes),
            ...arrayFromUnknown(normalizedValue.missingInfo),
            ...arrayFromUnknown(normalizedValue.warnings),
        ]
            .map(textFromUnknown)
            .filter(isNonEmptyString)
            .slice(0, 12),
        missingInfo: arrayFromUnknown(normalizedValue.missingInfo)
            .map(textFromUnknown)
            .filter(isNonEmptyString)
            .slice(0, 12),
        warnings: arrayFromUnknown(normalizedValue.warnings)
            .map(textFromUnknown)
            .filter(isNonEmptyString)
            .slice(0, 12),
        tips: arrayFromUnknown(normalizedValue.tips)
            .map(textFromUnknown)
            .filter(isNonEmptyString)
            .slice(0, 12),
        needsUserReview: Boolean(normalizedValue.needsUserReview),
        confidence: normalizeConfidence(normalizedValue.confidence),
    });
}

// Extra guard: reject lines that are clearly ingredients, not instructions
function isLikelyIngredientLine(line: string): boolean {
    // Matches "200g flour", "2 eggs", "1 tbsp butter" etc. — NOT action sentences
    return /^\d+/.test(line.trim()) && line.length < 60 && !/\b(mix|add|bake|cook|heat|stir|pour|combine|whisk|fold|place|let|remove|serve|transfer|season|bring|reduce|cover|rest|chill|refrigerate|freeze|blend|process|chop|dice|slice|grate|peel|melt|dissolve)\b/i.test(line);
}

function compactParsedRecipe(recipe: ParsedRecipe): ParsedRecipe {
    return {
        title: recipe.title.trim().slice(0, 140),
        ...(recipe.description?.trim()
            ? { description: recipe.description.trim().slice(0, 1000) }
            : {}),
        language: recipe.language,
        ingredients: recipe.ingredients
            .map((item) => ({
                text: item.text.trim(),
                ...(item.amount?.trim() ? { amount: item.amount.trim() } : {}),
                ...(item.unit?.trim() ? { unit: item.unit.trim() } : {}),
                ...(item.item?.trim() ? { item: item.item.trim() } : {}),
                ...(item.note?.trim() ? { note: item.note.trim() } : {}),
                confidence: item.confidence,
            }))
            .filter((item) => item.text.length > 0),
        steps: recipe.steps.map((step) => step.trim()).filter(Boolean),
        ...(recipe.tips?.length
            ? { tips: recipe.tips.map((tip) => tip.trim()).filter(Boolean).slice(0, 12) }
            : {}),
        ...(recipe.servings ? { servings: recipe.servings } : {}),
        ...(recipe.prepTimeMinutes ? { prepTimeMinutes: recipe.prepTimeMinutes } : {}),
        ...(recipe.cookTimeMinutes ? { cookTimeMinutes: recipe.cookTimeMinutes } : {}),
        tags: recipe.tags.map((tag) => tag.trim()).filter(Boolean).slice(0, 12),
        ...(recipe.cuisine?.trim() ? { cuisine: recipe.cuisine.trim() } : {}),
        ambiguityNotes: recipe.ambiguityNotes
            .map((note) => note.trim())
            .filter(Boolean)
            .slice(0, 12),
        ...(recipe.missingInfo?.length
            ? {
                missingInfo: recipe.missingInfo
                    .map((note) => note.trim())
                    .filter(Boolean)
                    .slice(0, 12),
            }
            : {}),
        ...(recipe.warnings?.length
            ? {
                warnings: recipe.warnings
                    .map((note) => note.trim())
                    .filter(Boolean)
                    .slice(0, 12),
            }
            : {}),
        needsUserReview: recipe.needsUserReview,
        confidence: recipe.confidence,
    };
}

function needsInput(args: {
    sourceType: ImportSourceType;
    mode?: ImportMode;
    sourceUrl?: string;
    sourceText?: string;
    imageUri?: string;
    imageStorageId?: Id<"_storage">;
    thumbnailStorageId?: Id<"_storage">;
    imageUrl?: string;
    imageThumbnailUrl?: string;
    sourcePlatform?: SourcePlatform;
    sourceTitle?: string;
    sourceAuthor?: string;
    sourceThumbnailUrl?: string;
    rawContent?: RawContent;
    parsedRecipe?: ParsedRecipe;
    warning: string;
    warnings?: string[];
    reason: NeedsInputReason;
    debugExtraction?: DebugExtraction;
}): ImportResult {
    return {
        sourceType: args.sourceType,
        ...(args.mode ? { mode: args.mode } : {}),
        ...(args.sourceUrl ? { sourceUrl: args.sourceUrl } : {}),
        ...(args.sourceText ? { sourceText: args.sourceText } : {}),
        ...(args.imageUri ? { imageUri: args.imageUri } : {}),
        ...(args.imageStorageId ? { imageStorageId: args.imageStorageId } : {}),
        ...(args.thumbnailStorageId ? { thumbnailStorageId: args.thumbnailStorageId } : {}),
        ...(args.imageUrl ? { imageUrl: args.imageUrl } : {}),
        ...(args.imageThumbnailUrl ? { imageThumbnailUrl: args.imageThumbnailUrl } : {}),
        ...(args.sourcePlatform ? { sourcePlatform: args.sourcePlatform } : {}),
        ...(args.sourceTitle ? { sourceTitle: args.sourceTitle } : {}),
        ...(args.sourceAuthor ? { sourceAuthor: args.sourceAuthor } : {}),
        ...(args.sourceThumbnailUrl ? { sourceThumbnailUrl: args.sourceThumbnailUrl } : {}),
        ...(args.rawContent ? { rawContent: compactRawContent(args.rawContent) } : {}),
        ...(args.parsedRecipe ? { parsedRecipe: args.parsedRecipe } : {}),
        status: "needs_input",
        confidence: args.parsedRecipe?.confidence ?? "low",
        warnings: [...(args.warnings ?? []), args.warning],
        needsInputReason: args.reason,
        ...(args.debugExtraction ? { debugExtraction: args.debugExtraction } : {}),
    };
}

function ensureSocialImageOrAsk(result: ImportResult): ImportResult {
    if (
        result.status !== "ready_for_review" ||
        result.imageStorageId ||
        result.thumbnailStorageId ||
        result.imageUrl ||
        result.imageThumbnailUrl ||
        (result.sourceType !== "tiktok" && result.sourceType !== "instagram")
    ) {
        return result;
    }

    return {
        ...result,
        warnings: [
            ...result.warnings,
            "Nuk arritëm ta marrim foton nga ky link.",
        ],
        debugExtraction: {
            ...(result.debugExtraction ?? makeDebug("none", result.sourceText ?? "")),
            reason: "NO_IMAGE_AVAILABLE",
        },
    };
}

function hasRecipeCore(recipe: ParsedRecipe) {
    return recipe.title.trim() && recipe.ingredients.length > 0 && recipe.steps.length > 0;
}

function usefulSocialText(sourceText?: string, raw?: RawContent) {
    const text = joinContent([
        raw?.caption,
        raw?.description,
        sourceText?.replace(/https?:\/\/[^\s]+/gi, ""),
    ]).trim();

    return hasUsefulRecipeText(text) ? text : null;
}

function hasUsefulRecipeText(text?: string) {
    if (!text) return false;
    const withoutUrls = text.replace(/https?:\/\/[^\s]+/gi, "").trim();
    return withoutUrls.length >= 35;
}

function isRecipeLikeText(text: string) {
    const normalized = text.toLowerCase();
    const withoutUrls = normalized.replace(/https?:\/\/[^\s]+/gi, " ");

    if (
        /\b\d+\s*(g|kg|ml|l|lug[eë]|got[eë]|cup|cups|tbsp|tsp|filxhan|гр|кг|мл|л)\b/i.test(
            withoutUrls,
        )
    ) {
        return true;
    }

    if (
        /\b(p[eë]rziej|ziej|piq|shto|gatuaj|pjek|skuq|bake|mix|add|cook|boil|stir|fry)\b/i.test(
            withoutUrls,
        )
    ) {
        return true;
    }

    if (/\b(pite|flija|fli|burek|mantia|trile[cç]e|ajvar|tav[eë]|speca|sarma)\b/i.test(withoutUrls)) {
        return true;
    }

    const lines = withoutUrls
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    const ingredientLike = lines.filter(isLikelyIngredient).length;
    const stepLike = lines.filter((line) =>
        /\b(shto|p[eë]rziej|piq|ziej|bake|mix|add|cook)\b/i.test(line),
    ).length;

    return withoutUrls.length > 280 && (ingredientLike >= 2 || stepLike >= 2);
}

function withSourceUrl(text: string, sourceUrl: string) {
    return `${text.trim()}\n\nBurimi: ${sourceUrl}`;
}

function makeDebug(
    source: DebugExtractionSource,
    text: string,
    context: ExtractionContext = {},
    reason?: string,
): DebugExtraction {
    const cleaned = text.replace(/https?:\/\/[^\s]+/gi, "").trim();

    return {
        source,
        rawTextLength: cleaned.length,
        rawTextPreview: cleaned.slice(0, 500),
        ...(context.resolvedUrl || context.normalizedUrl
            ? { resolvedUrl: context.normalizedUrl ?? context.resolvedUrl }
            : {}),
        ...(reason ? { reason } : {}),
    };
}

function normalizeWhitespace(text: string) {
    return text.replace(/\s+/g, " ").trim();
}

async function hashText(text: string) {
    const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(text),
    );

    return [...new Uint8Array(digest)]
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

function isRecipeType(value: unknown) {
    return Array.isArray(value)
        ? value.some(isRecipeType)
        : typeof value === "string" && value.toLowerCase() === "recipe";
}

function normalizeInstructions(value: unknown): string[] {
    if (typeof value === "string") return splitInstructionText(value);
    if (!Array.isArray(value)) return [];

    return value.flatMap((item) => {
        if (typeof item === "string") return splitInstructionText(item);
        if (!isRecord(item)) return [];
        if (Array.isArray(item.itemListElement)) {
            return normalizeInstructions(item.itemListElement);
        }
        return splitInstructionText(textFromUnknown(item.text) ?? textFromUnknown(item.name) ?? "");
    });
}

function splitInstructionText(text: string) {
    return text
        .split(/\n+|(?:^|\s)(?=\d+[.)]\s+)/)
        .map((line) => stripListMarker(line.trim()))
        .filter(Boolean);
}

function isLikelyIngredient(line: string) {
    return (
        /^[-*]\s+/.test(line) ||
        /^(?:\d+([.,/]\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞])\s*(g|kg|ml|l|lug[eë]|filxhan|got[eë]|thelb|kokrra|cop[eë]|tbsp|tsp|cup|cups|гр|кг|мл|л)\b/i.test(
            line,
        ) ||
        /\b(pak|me sy|sa t[eë] merr|filxhan|got[eë]|lug[eë])\b/i.test(line)
    );
}

function stripListMarker(line: string) {
    return line.replace(/^[-*•]\s+/, "").replace(/^\d+[.)]\s+/, "").trim();
}

function extractTitle(html: string) {
    const og = extractMetaContent(html, "og:title");
    const title = og ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
    return title ? decodeHtml(title).replace(/\s+/g, " ").trim() : undefined;
}

function extractMetaDescription(html: string) {
    const match =
        extractMetaContent(html, "og:description") ??
        extractMetaContent(html, "description");
    return match ? decodeHtml(match).replace(/\s+/g, " ").trim() : undefined;
}

function extractMetaContent(html: string, key: string) {
    const tags = html.match(/<meta\b[^>]*>/gi) ?? [];

    for (const tag of tags) {
        const property =
            tag.match(/\bproperty=["']([^"']+)["']/i)?.[1] ??
            tag.match(/\bname=["']([^"']+)["']/i)?.[1];

        if (property?.toLowerCase() !== key.toLowerCase()) continue;

        const content = tag.match(/\bcontent=["']([^"']*)["']/i)?.[1];
        if (content?.trim()) return content.trim();
    }

    return undefined;
}

function extractVisibleText(html: string) {
    return decodeHtml(
        html
            .replace(/<script[\s\S]*?<\/script>/gi, " ")
            .replace(/<style[\s\S]*?<\/style>/gi, " ")
            .replace(/<[^>]+>/g, "\n")
            .replace(/\s+\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .replace(/[ \t]{2,}/g, " "),
    )
        .trim()
        .slice(0, 12000);
}

function decodeHtml(value: string) {
    return value
        .replace(/&#x([\dA-Fa-f]+);/g, (_, hex: string) =>
            String.fromCodePoint(Number.parseInt(hex, 16)),
        )
        .replace(/&#(\d+);/g, (_, code: string) =>
            String.fromCodePoint(Number.parseInt(code, 10)),
        )
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, " ");
}

function compactRawContent(raw: RawContent): RawContent {
    return {
        ...(raw.title?.trim() ? { title: raw.title.trim().slice(0, 300) } : {}),
        ...(raw.caption?.trim() ? { caption: raw.caption.trim().slice(0, 12000) } : {}),
        ...(raw.description?.trim()
            ? { description: raw.description.trim().slice(0, 4000) }
            : {}),
        ...(raw.htmlText?.trim() ? { htmlText: raw.htmlText.trim().slice(0, 12000) } : {}),
        ...(raw.imageText?.trim()
            ? { imageText: raw.imageText.trim().slice(0, 12000) }
            : {}),
    };
}

function joinContent(parts: (string | undefined)[]) {
    return parts.filter(isNonEmptyString).join("\n\n");
}

function uniqueStrings(parts: (string | undefined)[]) {
    return [...new Set(parts.map((part) => part?.trim()).filter(isNonEmptyString))];
}

function textFromUnknown(value: unknown) {
    if (typeof value === "string") return value.trim() || undefined;
    if (typeof value === "number") return String(value);
    return undefined;
}

function numberFromUnknown(value: unknown) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const match = value.match(/\d+/);
        return match ? Number(match[0]) : undefined;
    }
    return undefined;
}

function minutesFromDuration(value: unknown) {
    const text = textFromUnknown(value);
    if (!text) return undefined;
    const hours = Number(text.match(/(\d+)H/i)?.[1] ?? 0);
    const minutes = Number(text.match(/(\d+)M/i)?.[1] ?? 0);
    const total = hours * 60 + minutes;
    return total > 0 ? total : undefined;
}

function arrayFromUnknown(value: unknown): unknown[] {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") return value.split(",").map((item) => item.trim());
    return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function normalizeConfidence(value: unknown): Confidence {
    return value === "high" || value === "medium" || value === "low"
        ? value
        : "low";
}

function normalizeLanguage(value: unknown): Language {
    return value === "sq" ||
        value === "mk" ||
        value === "en" ||
        value === "de" ||
        value === "tr" ||
        value === "mixed" ||
        value === "unknown"
        ? value
        : "unknown";
}

function detectLanguage(text: string): Language {
    if (/[а-шѓќљњџ]/i.test(text)) return "mk";
    if (/\b(dhe|p[eë]r|miell|krip[eë]|vaj|vez[eë])\b/i.test(text)) return "sq";
    if (/\b(und|mit|zutaten|zubereitung)\b/i.test(text)) return "de";
    if (/\b(tuz|un|yumurta|tarifi|hazırlanışı)\b/i.test(text)) return "tr";
    if (/\b(ingredients|steps|recipe|method)\b/i.test(text)) return "en";
    return "unknown";
}

function stripJson(content: string) {
    return content
        .trim()
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/i, "")
        .trim();
}

async function hashImportInput(args: {
    sourceType: ImportSourceType;
    sourceUrl?: string;
    sourceText?: string;
    imageUri?: string;
    rawContent?: RawContent;
}) {
    const source = JSON.stringify({
        parserVersion: 5,
        sourceType: args.sourceType,
        sourceUrl: args.sourceUrl,
        sourceText: args.sourceText,
        imageUri: args.imageUri,
        rawContent: args.rawContent,
    });
    const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(source),
    );

    return [...new Uint8Array(digest)]
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

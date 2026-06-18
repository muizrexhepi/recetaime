import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const subscriptionStatus = v.union(
    v.literal("inactive"),
    v.literal("trial"),
    v.literal("active"),
    v.literal("expired"),
);

const authProvider = v.union(
    v.literal("email"),
    v.literal("apple"),
    v.literal("google"),
    v.literal("dev"),
);

const importSource = v.union(
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

const syncSource = v.union(
    v.literal("guest_sync"),
    v.literal("account"),
    v.literal("manual"),
);

const confidence = v.union(
    v.literal("low"),
    v.literal("medium"),
    v.literal("high"),
);

const importStatus = v.union(
    v.literal("idle"),
    v.literal("receiving"),
    v.literal("extracting"),
    v.literal("needs_input"),
    v.literal("ready_for_review"),
    v.literal("failed"),
);

const importMode = v.union(
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

const mealSlot = v.union(
    v.literal("breakfast"),
    v.literal("lunch"),
    v.literal("dinner"),
    v.literal("snack"),
);

const parsedIngredient = v.object({
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
    ingredients: v.array(parsedIngredient),
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

const rawImportContent = v.object({
    title: v.optional(v.string()),
    caption: v.optional(v.string()),
    description: v.optional(v.string()),
    htmlText: v.optional(v.string()),
    imageText: v.optional(v.string()),
});

const needsInputReason = v.union(
    v.literal("NO_CAPTION_TEXT"),
    v.literal("ONLY_BARE_SOCIAL_URL"),
    v.literal("SOCIAL_PLATFORM_BLOCKED"),
    v.literal("SOCIAL_SCRAPER_NOT_CONFIGURED"),
    v.literal("SOCIAL_SCRAPER_FAILED"),
    v.literal("NOT_RECIPE_LIKE"),
    v.literal("AI_PARSE_FAILED"),
    v.literal("NO_IMAGE_AVAILABLE"),
);

const debugExtraction = v.object({
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
});

const importResult = v.object({
    status: importStatus,
    sourceType: importSource,
    mode: v.optional(importMode),
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
    rawContent: v.optional(rawImportContent),
    parsedRecipe: v.optional(parsedRecipe),
    confidence,
    warnings: v.array(v.string()),
    needsInputReason: v.optional(needsInputReason),
    debugExtraction: v.optional(debugExtraction),
});

export default defineSchema({
    users: defineTable({
        guestId: v.optional(v.string()),
        authSubject: v.optional(v.string()),
        email: v.optional(v.string()),
        name: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
        passwordHash: v.optional(v.string()),
        passwordSalt: v.optional(v.string()),

        authProvider: v.optional(authProvider),

        onboardingCompleted: v.boolean(),
        onboardingCompletedAt: v.optional(v.number()),

        selectedSources: v.optional(v.array(v.string())),
        selectedGoals: v.optional(v.array(v.string())),
        selectedReminderMoments: v.optional(v.array(v.string())),
        heardFrom: v.optional(v.string()),
        ageRange: v.optional(v.string()),
        expoPushToken: v.optional(v.string()),
        notificationsEnabled: v.optional(v.boolean()),

        subscriptionStatus,
        hasActiveSubscription: v.boolean(),
        revenueCatUserId: v.optional(v.string()),
        productIdentifier: v.optional(v.string()),
        subscriptionExpiresAt: v.optional(v.number()),

        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_guest_id", ["guestId"])
        .index("by_auth_subject", ["authSubject"])
        .index("by_email", ["email"])
        .index("by_revenue_cat_user_id", ["revenueCatUserId"]),

    sessions: defineTable({
        token: v.string(),
        userId: v.id("users"),
        createdAt: v.number(),
        expiresAt: v.optional(v.number()),
    }).index("by_token", ["token"]),

    collections: defineTable({
        userId: v.id("users"),
        title: v.string(),
        color: v.optional(v.string()),
        icon: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_user", ["userId"]),

    recipes: defineTable({
        userId: v.id("users"),

        title: v.string(),
        description: v.optional(v.string()),

        sourceType: importSource,
        sourcePlatform: v.optional(sourcePlatform),
        sourceUrl: v.optional(v.string()),
        sourceText: v.optional(v.string()),
        sourceTitle: v.optional(v.string()),
        sourceAuthor: v.optional(v.string()),
        sourceThumbnailUrl: v.optional(v.string()),

        imageUrl: v.optional(v.string()),
        imageStorageId: v.optional(v.id("_storage")),
        thumbnailStorageId: v.optional(v.id("_storage")),
        imageThumbnailUrl: v.optional(v.string()),

        servings: v.optional(v.number()),
        prepTimeMinutes: v.optional(v.number()),
        cookTimeMinutes: v.optional(v.number()),
        totalTimeMinutes: v.optional(v.number()),
        language: v.optional(language),
        cuisine: v.optional(v.string()),
        ambiguityNotes: v.optional(v.array(v.string())),
        extractionConfidence: v.optional(confidence),
        extractionWarnings: v.optional(v.array(v.string())),
        needsUserReview: v.optional(v.boolean()),
        importConfidence: v.optional(confidence),

        ingredients: v.array(
            v.object({
                text: v.string(),
                amount: v.optional(v.string()),
                unit: v.optional(v.string()),
                item: v.optional(v.string()),
                note: v.optional(v.string()),
                confidence: v.optional(confidence),
            }),
        ),

        steps: v.array(v.string()),
        tips: v.optional(v.array(v.string())),

        notes: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        collectionIds: v.optional(v.array(v.id("collections"))),

        isFavorite: v.boolean(),

        originalLocalId: v.optional(v.string()),
        syncSource,

        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_user_created_at", ["userId", "createdAt"])
        .index("by_original_local_id", ["originalLocalId"]),

    mealPlanItems: defineTable({
        userId: v.id("users"),
        dateKey: v.string(),
        slot: mealSlot,
        recipeId: v.id("recipes"),
        note: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_user_date", ["userId", "dateKey"])
        .index("by_user_recipe", ["userId", "recipeId"]),

    groceryItems: defineTable({
        userId: v.id("users"),

        text: v.string(),
        amount: v.optional(v.string()),
        unit: v.optional(v.string()),
        item: v.optional(v.string()),
        note: v.optional(v.string()),

        recipeId: v.optional(v.id("recipes")),
        recipeTitle: v.optional(v.string()),

        sourceDateKey: v.optional(v.string()),
        mealSlot: v.optional(mealSlot),

        checked: v.boolean(),

        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_user_checked", ["userId", "checked"])
        .index("by_user_created_at", ["userId", "createdAt"]),

    importUsage: defineTable({
        userId: v.optional(v.id("users")),
        guestId: v.optional(v.string()),

        sourceType: importSource,
        isImage: v.optional(v.boolean()),
        createdAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_guest", ["guestId"])
        .index("by_user_created_at", ["userId", "createdAt"])
        .index("by_guest_created_at", ["guestId", "createdAt"]),

    importCache: defineTable({
        sourceHash: v.string(),
        sourceType: importSource,
        sourceUrl: v.optional(v.string()),
        result: importResult,
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_source_hash", ["sourceHash"]),
});

import { v } from "convex/values";

import { Id } from "./_generated/dataModel";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";

const importSource = v.union(
    v.literal("tiktok"),
    v.literal("instagram"),
    v.literal("youtube"),
    v.literal("whatsapp"),
    v.literal("photo"),
    v.literal("manual"),
    v.literal("web"),
);

const confidence = v.union(
    v.literal("low"),
    v.literal("medium"),
    v.literal("high"),
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
    confidence: v.optional(confidence),
});

async function getUserFromToken(ctx: QueryCtx | MutationCtx, token: string) {
    const session = await ctx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", token))
        .unique();

    if (!session) return null;

    return await ctx.db.get(session.userId);
}

export const listMine = query({
    args: {
        token: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getUserFromToken(ctx, args.token);

        if (!user) return [];

        return await ctx.db
            .query("recipes")
            .withIndex("by_user_created_at", (q) => q.eq("userId", user._id))
            .order("desc")
            .take(50);
    },
});

export const getMineById = query({
    args: {
        token: v.string(),
        recipeId: v.id("recipes"),
    },
    handler: async (ctx, args) => {
        const user = await getUserFromToken(ctx, args.token);

        if (!user) return null;

        const recipe = await ctx.db.get(args.recipeId);

        if (!recipe || recipe.userId !== user._id) {
            return null;
        }

        return recipe;
    },
});

export const createFromImport = mutation({
    args: {
        token: v.string(),
        title: v.string(),
        description: v.optional(v.string()),
        sourceType: importSource,
        sourceUrl: v.optional(v.string()),
        sourceText: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        ingredients: v.array(ingredient),
        steps: v.array(v.string()),
        servings: v.optional(v.number()),
        prepTimeMinutes: v.optional(v.number()),
        cookTimeMinutes: v.optional(v.number()),
        tags: v.optional(v.array(v.string())),
        language: v.optional(language),
        cuisine: v.optional(v.string()),
        ambiguityNotes: v.optional(v.array(v.string())),
        needsUserReview: v.optional(v.boolean()),
        importConfidence: v.optional(confidence),
    },
    handler: async (ctx, args) => {
        const user = await getUserFromToken(ctx, args.token);

        if (!user) {
            throw new Error("Not authenticated");
        }

        const title = args.title.trim();
        const ingredients = args.ingredients
            .map((item) => ({
                ...item,
                text: item.text.trim(),
            }))
            .filter((item) => item.text.length > 0);
        const steps = args.steps.map((step) => step.trim()).filter(Boolean);

        if (
            !title ||
            isPlaceholderRecipeTitle(title) ||
            ingredients.length === 0 ||
            steps.length === 0
        ) {
            throw new Error(
                "Recipe is incomplete. Review the import before saving.",
            );
        }

        const now = Date.now();

        const recipeId = await ctx.db.insert("recipes", {
            userId: user._id as Id<"users">,
            title,
            ...(args.description ? { description: args.description } : {}),
            sourceType: args.sourceType,
            ...(args.sourceUrl ? { sourceUrl: args.sourceUrl } : {}),
            ...(args.sourceText ? { sourceText: args.sourceText } : {}),
            ...(args.imageUrl ? { imageUrl: args.imageUrl } : {}),
            ingredients,
            steps,
            ...(args.servings ? { servings: args.servings } : {}),
            ...(args.prepTimeMinutes
                ? { prepTimeMinutes: args.prepTimeMinutes }
                : {}),
            ...(args.cookTimeMinutes
                ? { cookTimeMinutes: args.cookTimeMinutes }
                : {}),
            ...(args.tags ? { tags: args.tags } : {}),
            ...(args.language ? { language: args.language } : {}),
            ...(args.cuisine ? { cuisine: args.cuisine } : {}),
            ...(args.ambiguityNotes
                ? { ambiguityNotes: args.ambiguityNotes }
                : {}),
            ...(args.needsUserReview !== undefined
                ? { needsUserReview: args.needsUserReview }
                : {}),
            ...(args.importConfidence
                ? { importConfidence: args.importConfidence }
                : {}),
            collectionIds: [],
            isFavorite: false,
            syncSource: "account",
            createdAt: now,
            updatedAt: now,
        });

        await ctx.db.insert("importUsage", {
            userId: user._id,
            sourceType: args.sourceType,
            createdAt: now,
        });

        return recipeId;
    },
});

function isPlaceholderRecipeTitle(title: string) {
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


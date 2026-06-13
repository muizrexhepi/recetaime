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
            .take(100);
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

        const collections = recipe.collectionIds?.length
            ? await Promise.all(recipe.collectionIds.map((id) => ctx.db.get(id)))
            : [];

        return {
            ...recipe,
            collections: collections
                .filter((collection) => collection && collection.userId === user._id)
                .map((collection) => ({
                    _id: collection!._id,
                    title: collection!.title,
                    color: collection!.color,
                    icon: collection!.icon,
                })),
        };
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
        collectionIds: v.optional(v.array(v.id("collections"))),
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
            throw new Error("Recipe is incomplete. Review the import before saving.");
        }

        const collectionIds = args.collectionIds ?? [];

        if (collectionIds.length > 0) {
            const collections = await Promise.all(
                collectionIds.map((id) => ctx.db.get(id)),
            );

            const invalidCollection = collections.some(
                (collection) => !collection || collection.userId !== user._id,
            );

            if (invalidCollection) {
                throw new Error("Invalid collection");
            }
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
            ...(args.prepTimeMinutes ? { prepTimeMinutes: args.prepTimeMinutes } : {}),
            ...(args.cookTimeMinutes ? { cookTimeMinutes: args.cookTimeMinutes } : {}),
            ...(args.prepTimeMinutes || args.cookTimeMinutes
                ? {
                    totalTimeMinutes:
                        (args.prepTimeMinutes ?? 0) + (args.cookTimeMinutes ?? 0),
                }
                : {}),
            ...(args.tags ? { tags: args.tags } : {}),
            ...(args.language ? { language: args.language } : {}),
            ...(args.cuisine ? { cuisine: args.cuisine } : {}),
            ...(args.ambiguityNotes ? { ambiguityNotes: args.ambiguityNotes } : {}),
            ...(args.needsUserReview !== undefined
                ? { needsUserReview: args.needsUserReview }
                : {}),
            ...(args.importConfidence ? { importConfidence: args.importConfidence } : {}),
            collectionIds,
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

export const toggleFavorite = mutation({
    args: {
        token: v.string(),
        recipeId: v.id("recipes"),
    },
    handler: async (ctx, args) => {
        const user = await getUserFromToken(ctx, args.token);

        if (!user) {
            throw new Error("Not authenticated");
        }

        const recipe = await ctx.db.get(args.recipeId);

        if (!recipe || recipe.userId !== user._id) {
            throw new Error("Recipe not found");
        }

        await ctx.db.patch(args.recipeId, {
            isFavorite: !recipe.isFavorite,
            updatedAt: Date.now(),
        });

        return !recipe.isFavorite;
    },
});

export const remove = mutation({
    args: {
        token: v.string(),
        recipeId: v.id("recipes"),
    },
    handler: async (ctx, args) => {
        const user = await getUserFromToken(ctx, args.token);

        if (!user) {
            throw new Error("Not authenticated");
        }

        const recipe = await ctx.db.get(args.recipeId);

        if (!recipe || recipe.userId !== user._id) {
            throw new Error("Recipe not found");
        }

        const mealItems = await ctx.db
            .query("mealPlanItems")
            .withIndex("by_user_recipe", (q) =>
                q.eq("userId", user._id).eq("recipeId", args.recipeId),
            )
            .collect();

        const groceryItems = await ctx.db
            .query("groceryItems")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        await Promise.all([
            ...mealItems.map((item) => ctx.db.delete(item._id)),
            ...groceryItems
                .filter((item) => item.recipeId === args.recipeId)
                .map((item) => ctx.db.delete(item._id)),
        ]);

        await ctx.db.delete(args.recipeId);
    },
});

export const updateBasics = mutation({
    args: {
        token: v.string(),
        recipeId: v.id("recipes"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        notes: v.optional(v.string()),
        servings: v.optional(v.number()),
        prepTimeMinutes: v.optional(v.number()),
        cookTimeMinutes: v.optional(v.number()),
        tags: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const user = await getUserFromToken(ctx, args.token);

        if (!user) {
            throw new Error("Not authenticated");
        }

        const recipe = await ctx.db.get(args.recipeId);

        if (!recipe || recipe.userId !== user._id) {
            throw new Error("Recipe not found");
        }

        const patch: Record<string, unknown> = {
            updatedAt: Date.now(),
        };

        if (args.title !== undefined) {
            const title = args.title.trim();

            if (!title || isPlaceholderRecipeTitle(title)) {
                throw new Error("Recipe title is required");
            }

            patch.title = title;
        }

        if (args.description !== undefined) {
            patch.description = args.description.trim();
        }

        if (args.notes !== undefined) {
            patch.notes = args.notes.trim();
        }

        if (args.servings !== undefined) {
            patch.servings = args.servings;
        }

        if (args.prepTimeMinutes !== undefined) {
            patch.prepTimeMinutes = args.prepTimeMinutes;
        }

        if (args.cookTimeMinutes !== undefined) {
            patch.cookTimeMinutes = args.cookTimeMinutes;
        }

        if (
            args.prepTimeMinutes !== undefined ||
            args.cookTimeMinutes !== undefined
        ) {
            patch.totalTimeMinutes =
                (args.prepTimeMinutes ?? recipe.prepTimeMinutes ?? 0) +
                (args.cookTimeMinutes ?? recipe.cookTimeMinutes ?? 0);
        }

        if (args.tags !== undefined) {
            patch.tags = args.tags;
        }

        await ctx.db.patch(args.recipeId, patch);
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
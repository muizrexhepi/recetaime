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

const ingredient = v.object({
    text: v.string(),
    amount: v.optional(v.string()),
    unit: v.optional(v.string()),
    item: v.optional(v.string()),
    note: v.optional(v.string()),
    confidence: v.optional(
        v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    ),
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
    },
    handler: async (ctx, args) => {
        const user = await getUserFromToken(ctx, args.token);

        if (!user) {
            throw new Error("Not authenticated");
        }

        const now = Date.now();

        const recipeId = await ctx.db.insert("recipes", {
            userId: user._id as Id<"users">,
            title: args.title.trim() || "Recetë e re",
            ...(args.description ? { description: args.description } : {}),
            sourceType: args.sourceType,
            ...(args.sourceUrl ? { sourceUrl: args.sourceUrl } : {}),
            ...(args.sourceText ? { sourceText: args.sourceText } : {}),
            ...(args.imageUrl ? { imageUrl: args.imageUrl } : {}),
            ingredients: args.ingredients,
            steps: args.steps,
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

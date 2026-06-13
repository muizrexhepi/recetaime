import { v } from "convex/values";

import {
    mutation,
    query,
    type MutationCtx,
    type QueryCtx,
} from "./_generated/server";

const COLLECTION_COLORS = [
    "#EF4A38",
    "#4F8FEA",
    "#8B6FE8",
    "#8FD36B",
    "#F2B84B",
    "#F27C38",
];

async function getUserFromToken(ctx: QueryCtx | MutationCtx, token: string) {
    const session = await ctx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", token))
        .unique();

    if (!session) return null;

    return await ctx.db.get(session.userId);
}

export const listMineWithCounts = query({
    args: {
        token: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getUserFromToken(ctx, args.token);

        if (!user) return [];

        const [collections, recipes] = await Promise.all([
            ctx.db
                .query("collections")
                .withIndex("by_user", (q) => q.eq("userId", user._id))
                .collect(),
            ctx.db
                .query("recipes")
                .withIndex("by_user_created_at", (q) => q.eq("userId", user._id))
                .order("desc")
                .collect(),
        ]);

        const uncategorizedRecipes = recipes.filter(
            (recipe) => !recipe.collectionIds || recipe.collectionIds.length === 0,
        );

        const collectionCards = collections.map((collection, index) => {
            const collectionRecipes = recipes.filter((recipe) =>
                recipe.collectionIds?.some((id) => id === collection._id),
            );

            return {
                id: collection._id,
                kind: "collection" as const,
                title: collection.title,
                color:
                    collection.color ??
                    COLLECTION_COLORS[index % COLLECTION_COLORS.length],
                icon: collection.icon,
                count: collectionRecipes.length,
                recentRecipes: collectionRecipes.slice(0, 3).map((recipe) => ({
                    _id: recipe._id,
                    title: recipe.title,
                    imageUrl: recipe.imageUrl,
                })),
                createdAt: collection.createdAt,
                updatedAt: collection.updatedAt,
            };
        });

        return [
            {
                id: "uncategorized",
                kind: "uncategorized" as const,
                title: "Pa kategori",
                color: "#8B6FE8",
                icon: "folder",
                count: uncategorizedRecipes.length,
                recentRecipes: uncategorizedRecipes.slice(0, 3).map((recipe) => ({
                    _id: recipe._id,
                    title: recipe.title,
                    imageUrl: recipe.imageUrl,
                })),
                createdAt: 0,
                updatedAt: Date.now(),
            },
            ...collectionCards,
        ];
    },
});

export const listRecipes = query({
    args: {
        token: v.string(),
        collectionId: v.union(v.literal("uncategorized"), v.id("collections")),
    },
    handler: async (ctx, args) => {
        const user = await getUserFromToken(ctx, args.token);

        if (!user) {
            return {
                collection: null,
                recipes: [],
            };
        }

        const recipes = await ctx.db
            .query("recipes")
            .withIndex("by_user_created_at", (q) => q.eq("userId", user._id))
            .order("desc")
            .collect();

        if (args.collectionId === "uncategorized") {
            return {
                collection: {
                    id: "uncategorized",
                    kind: "uncategorized" as const,
                    title: "Pa kategori",
                    color: "#8B6FE8",
                    count: recipes.filter(
                        (recipe) =>
                            !recipe.collectionIds || recipe.collectionIds.length === 0,
                    ).length,
                },
                recipes: recipes.filter(
                    (recipe) =>
                        !recipe.collectionIds || recipe.collectionIds.length === 0,
                ),
            };
        }

        const collection = await ctx.db.get(args.collectionId);

        if (!collection || collection.userId !== user._id) {
            return {
                collection: null,
                recipes: [],
            };
        }

        const collectionRecipes = recipes.filter((recipe) =>
            recipe.collectionIds?.some((id) => id === args.collectionId),
        );

        return {
            collection: {
                id: collection._id,
                kind: "collection" as const,
                title: collection.title,
                color: collection.color ?? "#EF4A38",
                icon: collection.icon,
                count: collectionRecipes.length,
            },
            recipes: collectionRecipes,
        };
    },
});

export const create = mutation({
    args: {
        token: v.string(),
        title: v.string(),
        color: v.optional(v.string()),
        icon: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getUserFromToken(ctx, args.token);

        if (!user) {
            throw new Error("Unauthorized");
        }

        const title = args.title.trim();

        if (!title) {
            throw new Error("Collection title is required");
        }

        const now = Date.now();

        return await ctx.db.insert("collections", {
            userId: user._id,
            title,
            color: args.color,
            icon: args.icon,
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const update = mutation({
    args: {
        token: v.string(),
        collectionId: v.id("collections"),
        title: v.optional(v.string()),
        color: v.optional(v.string()),
        icon: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getUserFromToken(ctx, args.token);

        if (!user) {
            throw new Error("Unauthorized");
        }

        const collection = await ctx.db.get(args.collectionId);

        if (!collection || collection.userId !== user._id) {
            throw new Error("Collection not found");
        }

        const patch: Partial<{
            title: string;
            color: string;
            icon: string;
            updatedAt: number;
        }> = {
            updatedAt: Date.now(),
        };

        if (args.title !== undefined) {
            const title = args.title.trim();

            if (!title) {
                throw new Error("Collection title is required");
            }

            patch.title = title;
        }

        if (args.color !== undefined) patch.color = args.color;
        if (args.icon !== undefined) patch.icon = args.icon;

        await ctx.db.patch(args.collectionId, patch);
    },
});

export const remove = mutation({
    args: {
        token: v.string(),
        collectionId: v.id("collections"),
    },
    handler: async (ctx, args) => {
        const user = await getUserFromToken(ctx, args.token);

        if (!user) {
            throw new Error("Unauthorized");
        }

        const collection = await ctx.db.get(args.collectionId);

        if (!collection || collection.userId !== user._id) {
            throw new Error("Collection not found");
        }

        const recipes = await ctx.db
            .query("recipes")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        await Promise.all(
            recipes.map(async (recipe) => {
                if (!recipe.collectionIds?.some((id) => id === args.collectionId)) {
                    return;
                }

                await ctx.db.patch(recipe._id, {
                    collectionIds: recipe.collectionIds.filter(
                        (id) => id !== args.collectionId,
                    ),
                    updatedAt: Date.now(),
                });
            }),
        );

        await ctx.db.delete(args.collectionId);
    },
});

export const setRecipeCollections = mutation({
    args: {
        token: v.string(),
        recipeId: v.id("recipes"),
        collectionIds: v.array(v.id("collections")),
    },
    handler: async (ctx, args) => {
        const user = await getUserFromToken(ctx, args.token);

        if (!user) {
            throw new Error("Unauthorized");
        }

        const recipe = await ctx.db.get(args.recipeId);

        if (!recipe || recipe.userId !== user._id) {
            throw new Error("Recipe not found");
        }

        const collections = await Promise.all(
            args.collectionIds.map((id) => ctx.db.get(id)),
        );

        const invalidCollection = collections.some(
            (collection) => !collection || collection.userId !== user._id,
        );

        if (invalidCollection) {
            throw new Error("Invalid collection");
        }

        await ctx.db.patch(args.recipeId, {
            collectionIds: args.collectionIds,
            updatedAt: Date.now(),
        });
    },
});

export const addRecipeToCollection = mutation({
    args: {
        token: v.string(),
        recipeId: v.id("recipes"),
        collectionId: v.id("collections"),
    },
    handler: async (ctx, args) => {
        const user = await getUserFromToken(ctx, args.token);

        if (!user) {
            throw new Error("Unauthorized");
        }

        const [recipe, collection] = await Promise.all([
            ctx.db.get(args.recipeId),
            ctx.db.get(args.collectionId),
        ]);

        if (!recipe || recipe.userId !== user._id) {
            throw new Error("Recipe not found");
        }

        if (!collection || collection.userId !== user._id) {
            throw new Error("Collection not found");
        }

        const currentIds = recipe.collectionIds ?? [];

        if (currentIds.some((id) => id === args.collectionId)) {
            return;
        }

        await ctx.db.patch(args.recipeId, {
            collectionIds: [...currentIds, args.collectionId],
            updatedAt: Date.now(),
        });
    },
});

export const removeRecipeFromCollection = mutation({
    args: {
        token: v.string(),
        recipeId: v.id("recipes"),
        collectionId: v.id("collections"),
    },
    handler: async (ctx, args) => {
        const user = await getUserFromToken(ctx, args.token);

        if (!user) {
            throw new Error("Unauthorized");
        }

        const recipe = await ctx.db.get(args.recipeId);

        if (!recipe || recipe.userId !== user._id) {
            throw new Error("Recipe not found");
        }

        await ctx.db.patch(args.recipeId, {
            collectionIds: (recipe.collectionIds ?? []).filter(
                (id) => id !== args.collectionId,
            ),
            updatedAt: Date.now(),
        });
    },
});
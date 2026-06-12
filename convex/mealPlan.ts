import { v } from "convex/values";

import { Id } from "./_generated/dataModel";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";

const mealSlot = v.union(
    v.literal("breakfast"),
    v.literal("lunch"),
    v.literal("dinner"),
    v.literal("snack"),
);

async function getUserFromToken(ctx: QueryCtx | MutationCtx, token: string) {
    const session = await ctx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", token))
        .unique();

    if (!session) return null;

    return await ctx.db.get(session.userId);
}

export const getWeek = query({
    args: {
        token: v.string(),
        startDateKey: v.string(),
        endDateKey: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getUserFromToken(ctx, args.token);

        if (!user) return [];

        const items = await ctx.db
            .query("mealPlanItems")
            .withIndex("by_user_date", (q) =>
                q
                    .eq("userId", user._id)
                    .gte("dateKey", args.startDateKey)
                    .lte("dateKey", args.endDateKey),
            )
            .collect();

        const hydrated = await Promise.all(
            items.map(async (item) => {
                const recipe = await ctx.db.get(item.recipeId);

                if (!recipe || recipe.userId !== user._id) return null;

                return {
                    ...item,
                    recipe,
                };
            }),
        );

        return hydrated
            .filter((item): item is NonNullable<typeof item> => Boolean(item))
            .sort((a, b) => {
                if (a.dateKey !== b.dateKey) {
                    return a.dateKey.localeCompare(b.dateKey);
                }

                return slotOrder(a.slot) - slotOrder(b.slot);
            });
    },
});

export const addRecipe = mutation({
    args: {
        token: v.string(),
        dateKey: v.string(),
        slot: mealSlot,
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

        const now = Date.now();

        return await ctx.db.insert("mealPlanItems", {
            userId: user._id as Id<"users">,
            dateKey: args.dateKey,
            slot: args.slot,
            recipeId: args.recipeId,
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const removeItem = mutation({
    args: {
        token: v.string(),
        itemId: v.id("mealPlanItems"),
    },
    handler: async (ctx, args) => {
        const user = await getUserFromToken(ctx, args.token);

        if (!user) {
            throw new Error("Not authenticated");
        }

        const item = await ctx.db.get(args.itemId);

        if (!item || item.userId !== user._id) {
            throw new Error("Meal plan item not found");
        }

        await ctx.db.delete(args.itemId);

        return true;
    },
});

export const updateSlot = mutation({
    args: {
        token: v.string(),
        itemId: v.id("mealPlanItems"),
        slot: mealSlot,
    },
    handler: async (ctx, args) => {
        const user = await getUserFromToken(ctx, args.token);

        if (!user) {
            throw new Error("Not authenticated");
        }

        const item = await ctx.db.get(args.itemId);

        if (!item || item.userId !== user._id) {
            throw new Error("Meal plan item not found");
        }

        await ctx.db.patch(args.itemId, {
            slot: args.slot,
            updatedAt: Date.now(),
        });

        return true;
    },
});

function slotOrder(slot: string) {
    switch (slot) {
        case "breakfast":
            return 1;
        case "lunch":
            return 2;
        case "dinner":
            return 3;
        case "snack":
            return 4;
        default:
            return 99;
    }
}
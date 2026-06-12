import { v } from "convex/values";

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

export const listMine = query({
    args: {
        token: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getUserFromToken(ctx, args.token);

        if (!user) return [];

        return await ctx.db
            .query("groceryItems")
            .withIndex("by_user_created_at", (q) => q.eq("userId", user._id))
            .order("desc")
            .collect();
    },
});

export const addItems = mutation({
    args: {
        token: v.string(),
        items: v.array(
            v.object({
                text: v.string(),
                amount: v.optional(v.string()),
                unit: v.optional(v.string()),
                item: v.optional(v.string()),
                note: v.optional(v.string()),
                recipeId: v.optional(v.id("recipes")),
                recipeTitle: v.optional(v.string()),
                sourceDateKey: v.optional(v.string()),
                mealSlot: v.optional(mealSlot),
            }),
        ),
    },
    handler: async (ctx, args) => {
        const user = await getUserFromToken(ctx, args.token);

        if (!user) {
            throw new Error("Not authenticated");
        }

        const now = Date.now();

        const ids = await Promise.all(
            args.items
                .map((item) => ({
                    ...item,
                    text: item.text.trim(),
                }))
                .filter((item) => item.text.length > 0)
                .map((item) =>
                    ctx.db.insert("groceryItems", {
                        userId: user._id,
                        text: item.text,
                        ...(item.amount ? { amount: item.amount } : {}),
                        ...(item.unit ? { unit: item.unit } : {}),
                        ...(item.item ? { item: item.item } : {}),
                        ...(item.note ? { note: item.note } : {}),
                        ...(item.recipeId ? { recipeId: item.recipeId } : {}),
                        ...(item.recipeTitle ? { recipeTitle: item.recipeTitle } : {}),
                        ...(item.sourceDateKey ? { sourceDateKey: item.sourceDateKey } : {}),
                        ...(item.mealSlot ? { mealSlot: item.mealSlot } : {}),
                        checked: false,
                        createdAt: now,
                        updatedAt: now,
                    }),
                ),
        );

        return ids;
    },
});

export const setChecked = mutation({
    args: {
        token: v.string(),
        itemId: v.id("groceryItems"),
        checked: v.boolean(),
    },
    handler: async (ctx, args) => {
        const user = await getUserFromToken(ctx, args.token);

        if (!user) {
            throw new Error("Not authenticated");
        }

        const item = await ctx.db.get(args.itemId);

        if (!item || item.userId !== user._id) {
            throw new Error("Grocery item not found");
        }

        await ctx.db.patch(args.itemId, {
            checked: args.checked,
            updatedAt: Date.now(),
        });

        return true;
    },
});

export const removeItem = mutation({
    args: {
        token: v.string(),
        itemId: v.id("groceryItems"),
    },
    handler: async (ctx, args) => {
        const user = await getUserFromToken(ctx, args.token);

        if (!user) {
            throw new Error("Not authenticated");
        }

        const item = await ctx.db.get(args.itemId);

        if (!item || item.userId !== user._id) {
            throw new Error("Grocery item not found");
        }

        await ctx.db.delete(args.itemId);

        return true;
    },
});

export const clearChecked = mutation({
    args: {
        token: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getUserFromToken(ctx, args.token);

        if (!user) {
            throw new Error("Not authenticated");
        }

        const checkedItems = await ctx.db
            .query("groceryItems")
            .withIndex("by_user_checked", (q) =>
                q.eq("userId", user._id).eq("checked", true),
            )
            .collect();

        await Promise.all(checkedItems.map((item) => ctx.db.delete(item._id)));

        return checkedItems.length;
    },
});
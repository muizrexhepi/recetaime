import { v } from "convex/values";

import { internalMutation, internalQuery, query, MutationCtx, QueryCtx } from "./_generated/server";

const FREE_WEEKLY_IMPORT_LIMIT = 5;
const FREE_WEEKLY_IMAGE_IMPORT_LIMIT = 2;

async function getUserFromToken(ctx: QueryCtx | MutationCtx, token: string) {
    const session = await ctx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", token))
        .unique();

    if (!session) return null;

    return await ctx.db.get(session.userId);
}

export const getWeeklyUsage = query({
    args: {
        token: v.optional(v.string()),
        guestId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const { start, resetAt } = getCurrentWeekWindow(now);

        if (!args.token && !args.guestId) {
            return createUsageResult({
                used: 0,
                now,
                resetAt,
                hasUnlimited: false,
            });
        }

        const user = args.token ? await getUserFromToken(ctx, args.token) : null;

        if (!user && !args.guestId) {
            return createUsageResult({
                used: 0,
                now,
                resetAt,
                hasUnlimited: false,
            });
        }

        const rows = user
            ? await ctx.db
                .query("importUsage")
                .withIndex("by_user", (q) => q.eq("userId", user._id))
                .collect()
            : await ctx.db
                .query("importUsage")
                .withIndex("by_guest", (q) => q.eq("guestId", args.guestId!))
                .collect();

        const weeklyRows = rows.filter((row) => row.createdAt >= start);
        const weeklyImageRows = weeklyRows.filter(isImageUsageRow);

        return createUsageResult({
            used: weeklyRows.length,
            imageUsed: weeklyImageRows.length,
            now,
            resetAt,
            hasUnlimited: Boolean(user?.hasActiveSubscription),
        });
    },
});

export const checkAllowance = internalQuery({
    args: {
        token: v.optional(v.string()),
        guestId: v.optional(v.string()),
        sourceType: v.optional(
            v.union(
                v.literal("tiktok"),
                v.literal("instagram"),
                v.literal("youtube"),
                v.literal("whatsapp"),
                v.literal("photo"),
                v.literal("text"),
                v.literal("manual"),
                v.literal("web"),
                v.literal("unknown"),
            ),
        ),
        isImage: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const { start, resetAt } = getCurrentWeekWindow(now);
        const user = args.token ? await getUserFromToken(ctx, args.token) : null;
        const hasUnlimited = Boolean(user?.hasActiveSubscription);

        if (hasUnlimited) {
            return {
                allowed: true,
                reason: null,
                ...createUsageResult({ used: 0, now, resetAt, hasUnlimited }),
            };
        }

        const rows = user
            ? await ctx.db
                .query("importUsage")
                .withIndex("by_user", (q) => q.eq("userId", user._id))
                .collect()
            : args.guestId
                ? await ctx.db
                    .query("importUsage")
                    .withIndex("by_guest", (q) => q.eq("guestId", args.guestId!))
                    .collect()
                : [];

        const weeklyRows = rows.filter((row) => row.createdAt >= start);
        const used = weeklyRows.length;
        const imageUsed = weeklyRows.filter(isImageUsageRow).length;
        const usage = createUsageResult({ used, imageUsed, now, resetAt, hasUnlimited });
        const isImageRequest = Boolean(args.isImage || args.sourceType === "photo");

        return {
            allowed:
                used < FREE_WEEKLY_IMPORT_LIMIT &&
                (!isImageRequest || imageUsed < FREE_WEEKLY_IMAGE_IMPORT_LIMIT),
            reason:
                isImageRequest && imageUsed >= FREE_WEEKLY_IMAGE_IMPORT_LIMIT
                    ? "IMAGE_LIMIT_REACHED"
                    : used >= FREE_WEEKLY_IMPORT_LIMIT
                        ? "TOTAL_LIMIT_REACHED"
                        : null,
            ...usage,
        };
    },
});

export const recordImport = internalMutation({
    args: {
        token: v.optional(v.string()),
        guestId: v.optional(v.string()),
        sourceType: v.union(
            v.literal("tiktok"),
            v.literal("instagram"),
            v.literal("youtube"),
            v.literal("whatsapp"),
            v.literal("photo"),
            v.literal("text"),
            v.literal("manual"),
            v.literal("web"),
            v.literal("unknown"),
        ),
        isImage: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user = args.token ? await getUserFromToken(ctx, args.token) : null;

        await ctx.db.insert("importUsage", {
            ...(user ? { userId: user._id } : {}),
            ...(!user && args.guestId ? { guestId: args.guestId } : {}),
            sourceType: args.sourceType,
            isImage: Boolean(args.isImage || args.sourceType === "photo"),
            createdAt: Date.now(),
        });
    },
});

function createUsageResult({
    used,
    imageUsed = 0,
    now,
    resetAt,
    hasUnlimited,
}: {
    used: number;
    imageUsed?: number;
    now: number;
    resetAt: number;
    hasUnlimited: boolean;
}) {
    const limit = FREE_WEEKLY_IMPORT_LIMIT;

    return {
        used,
        limit,
        remaining: hasUnlimited ? null : Math.max(0, limit - used),
        imageUsed,
        imageLimit: FREE_WEEKLY_IMAGE_IMPORT_LIMIT,
        imageRemaining: hasUnlimited
            ? null
            : Math.max(0, FREE_WEEKLY_IMAGE_IMPORT_LIMIT - imageUsed),
        hasUnlimited,
        resetAt,
        daysUntilReset: Math.max(
            1,
            Math.ceil((resetAt - now) / (1000 * 60 * 60 * 24)),
        ),
    };
}

function isImageUsageRow(row: { sourceType: string; isImage?: boolean }) {
    return row.isImage === true || row.sourceType === "photo";
}

function getCurrentWeekWindow(nowMs: number) {
    const now = new Date(nowMs);

    const start = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    const day = start.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    start.setUTCDate(start.getUTCDate() + diffToMonday);
    start.setUTCHours(0, 0, 0, 0);

    const reset = new Date(start);
    reset.setUTCDate(reset.getUTCDate() + 7);

    return {
        start: start.getTime(),
        resetAt: reset.getTime(),
    };
}

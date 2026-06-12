import { v } from "convex/values";

import { query, QueryCtx } from "./_generated/server";

const FREE_WEEKLY_IMPORT_LIMIT = 5;

async function getUserFromToken(ctx: QueryCtx, token: string) {
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
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const { start, resetAt } = getCurrentWeekWindow(now);

        if (!args.token) {
            return createUsageResult({
                used: 0,
                now,
                resetAt,
                hasUnlimited: false,
            });
        }

        const user = await getUserFromToken(ctx, args.token);

        if (!user) {
            return createUsageResult({
                used: 0,
                now,
                resetAt,
                hasUnlimited: false,
            });
        }

        const rows = await ctx.db
            .query("importUsage")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        const weeklyRows = rows.filter((row) => row.createdAt >= start);

        return createUsageResult({
            used: weeklyRows.length,
            now,
            resetAt,
            hasUnlimited: Boolean(user.hasActiveSubscription),
        });
    },
});

function createUsageResult({
    used,
    now,
    resetAt,
    hasUnlimited,
}: {
    used: number;
    now: number;
    resetAt: number;
    hasUnlimited: boolean;
}) {
    const limit = FREE_WEEKLY_IMPORT_LIMIT;

    return {
        used,
        limit,
        remaining: hasUnlimited ? null : Math.max(0, limit - used),
        hasUnlimited,
        resetAt,
        daysUntilReset: Math.max(
            1,
            Math.ceil((resetAt - now) / (1000 * 60 * 60 * 24)),
        ),
    };
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
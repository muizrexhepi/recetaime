import { v } from "convex/values";

import { mutation } from "./_generated/server";

const onboardingArgs = {
    guestId: v.optional(v.string()),
    selectedGoals: v.array(v.string()),
    selectedSources: v.array(v.string()),
    selectedReminderMoments: v.array(v.string()),
    heardFrom: v.optional(v.string()),
    ageRange: v.optional(v.string()),
    expoPushToken: v.optional(v.string()),
    notificationsEnabled: v.optional(v.boolean()),
};

export const upsertOnboardingProfile = mutation({
    args: onboardingArgs,
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        const now = Date.now();
        const authSubject = identity?.tokenIdentifier;

        const existingByAuth = authSubject
            ? await ctx.db
                .query("users")
                .withIndex("by_auth_subject", (q) => q.eq("authSubject", authSubject))
                .unique()
            : null;

        const existingByGuest =
            !existingByAuth && args.guestId
                ? await ctx.db
                    .query("users")
                    .withIndex("by_guest_id", (q) => q.eq("guestId", args.guestId))
                    .unique()
                : null;

        const existing = existingByAuth ?? existingByGuest;

        const profilePatch = {
            onboardingCompleted: true,
            onboardingCompletedAt: now,
            selectedGoals: args.selectedGoals,
            selectedSources: args.selectedSources,
            selectedReminderMoments: args.selectedReminderMoments,
            updatedAt: now,
            ...(args.guestId ? { guestId: args.guestId } : {}),
            ...(authSubject ? { authSubject } : {}),
            ...(identity?.email ? { email: identity.email } : {}),
            ...(identity?.name ? { name: identity.name } : {}),
            ...(args.heardFrom ? { heardFrom: args.heardFrom } : {}),
            ...(args.ageRange ? { ageRange: args.ageRange } : {}),
            ...(args.expoPushToken ? { expoPushToken: args.expoPushToken } : {}),
            ...(typeof args.notificationsEnabled === "boolean"
                ? { notificationsEnabled: args.notificationsEnabled }
                : {}),
        };

        if (existing) {
            await ctx.db.patch(existing._id, profilePatch);
            return existing._id;
        }

        if (!authSubject && !args.guestId) {
            return null;
        }

        return await ctx.db.insert("users", {
            ...profilePatch,
            subscriptionStatus: "inactive",
            hasActiveSubscription: false,
            createdAt: now,
        });
    },
});

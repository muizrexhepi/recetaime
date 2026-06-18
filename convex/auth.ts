import { v } from "convex/values";

import { Id } from "./_generated/dataModel";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";

function makeSessionToken() {
    return `ri_${crypto.randomUUID()}_${crypto.randomUUID()}`;
}

function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

function assertValidPassword(password: string) {
    if (password.length < 8) {
        throw new Error("Password must be at least 8 characters.");
    }
}

function bytesToHex(bytes: ArrayBuffer) {
    return [...new Uint8Array(bytes)]
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

async function hashPassword(password: string, salt: string) {
    const input = new TextEncoder().encode(`${salt}:${password}`);
    const digest = await crypto.subtle.digest("SHA-256", input);
    return bytesToHex(digest);
}

async function createSession(ctx: MutationCtx, userId: Id<"users">) {
    const token = makeSessionToken();

    await ctx.db.insert("sessions", {
        token,
        userId,
        createdAt: Date.now(),
    });

    return token;
}

async function getUserFromToken(ctx: QueryCtx | MutationCtx, token: string) {
    const session = await ctx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", token))
        .unique();

    if (!session) return null;

    return await ctx.db.get(session.userId);
}

export const getMe = query({
    args: {
        token: v.string(),
    },
    handler: async (ctx, args) => {
        return await getUserFromToken(ctx, args.token);
    },
});

export const createDevUser = mutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();

        const userId = await ctx.db.insert("users", {
            email: "dev@recetaime.com",
            name: "Dev User",
            authProvider: "dev",

            onboardingCompleted: false,

            subscriptionStatus: "inactive",
            hasActiveSubscription: false,

            createdAt: now,
            updatedAt: now,
        });

        const token = await createSession(ctx, userId);

        return {
            token,
            userId,
        };
    },
});

export const registerWithEmailPassword = mutation({
    args: {
        email: v.string(),
        password: v.string(),
        name: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const email = normalizeEmail(args.email);
        assertValidPassword(args.password);

        const existing = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", email))
            .unique();

        if (existing) {
            throw new Error("An account with this email already exists.");
        }

        const now = Date.now();
        const passwordSalt = crypto.randomUUID();
        const passwordHash = await hashPassword(args.password, passwordSalt);

        const userId = await ctx.db.insert("users", {
            email,
            ...(args.name?.trim() ? { name: args.name.trim() } : {}),
            authProvider: "email",
            passwordHash,
            passwordSalt,
            onboardingCompleted: false,
            subscriptionStatus: "inactive",
            hasActiveSubscription: false,
            createdAt: now,
            updatedAt: now,
        });

        const token = await createSession(ctx, userId);

        return {
            token,
            userId,
        };
    },
});

export const signInWithEmailPassword = mutation({
    args: {
        email: v.string(),
        password: v.string(),
    },
    handler: async (ctx, args) => {
        const email = normalizeEmail(args.email);
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", email))
            .unique();

        if (!user?.passwordHash || !user.passwordSalt) {
            throw new Error("Invalid email or password.");
        }

        const passwordHash = await hashPassword(args.password, user.passwordSalt);

        if (passwordHash !== user.passwordHash) {
            throw new Error("Invalid email or password.");
        }

        const token = await createSession(ctx, user._id);

        return {
            token,
            userId: user._id,
        };
    },
});

export const signInWithOAuthProfile = mutation({
    args: {
        provider: v.union(v.literal("apple"), v.literal("google")),
        providerId: v.string(),
        email: v.optional(v.string()),
        name: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const authSubject = `${args.provider}:${args.providerId}`;
        const email = args.email ? normalizeEmail(args.email) : undefined;

        const existingBySubject = await ctx.db
            .query("users")
            .withIndex("by_auth_subject", (q) => q.eq("authSubject", authSubject))
            .unique();

        const existingByEmail =
            !existingBySubject && email
                ? await ctx.db
                    .query("users")
                    .withIndex("by_email", (q) => q.eq("email", email))
                    .unique()
                : null;

        const existing = existingBySubject ?? existingByEmail;

        if (existing) {
            await ctx.db.patch(existing._id, {
                authSubject,
                authProvider: args.provider,
                ...(email ? { email } : {}),
                ...(args.name ? { name: args.name } : {}),
                ...(args.avatarUrl ? { avatarUrl: args.avatarUrl } : {}),
                updatedAt: now,
            });

            const token = await createSession(ctx, existing._id);

            return {
                token,
                userId: existing._id,
            };
        }

        const userId = await ctx.db.insert("users", {
            authSubject,
            authProvider: args.provider,
            ...(email ? { email } : {}),
            ...(args.name ? { name: args.name } : {}),
            ...(args.avatarUrl ? { avatarUrl: args.avatarUrl } : {}),
            onboardingCompleted: false,
            subscriptionStatus: "inactive",
            hasActiveSubscription: false,
            createdAt: now,
            updatedAt: now,
        });

        const token = await createSession(ctx, userId);

        return {
            token,
            userId,
        };
    },
});

export const completeOnboarding = mutation({
    args: {
        token: v.string(),
        selectedSources: v.array(v.string()),
        selectedGoals: v.array(v.string()),
        selectedReminderMoments: v.optional(v.array(v.string())),
        heardFrom: v.optional(v.string()),
        ageRange: v.optional(v.string()),
        expoPushToken: v.optional(v.string()),
        notificationsEnabled: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user = await getUserFromToken(ctx, args.token);

        if (!user) {
            throw new Error("Not authenticated");
        }

        await ctx.db.patch(user._id, {
            onboardingCompleted: true,
            onboardingCompletedAt: Date.now(),
            selectedSources: args.selectedSources,
            selectedGoals: args.selectedGoals,
            selectedReminderMoments: args.selectedReminderMoments ?? [],
            ...(args.heardFrom ? { heardFrom: args.heardFrom } : {}),
            ...(args.ageRange ? { ageRange: args.ageRange } : {}),
            ...(args.expoPushToken ? { expoPushToken: args.expoPushToken } : {}),
            ...(typeof args.notificationsEnabled === "boolean"
                ? { notificationsEnabled: args.notificationsEnabled }
                : {}),
            updatedAt: Date.now(),
        });

        return true;
    },
});

export const updateNotificationSettings = mutation({
    args: {
        token: v.string(),
        expoPushToken: v.optional(v.string()),
        notificationsEnabled: v.boolean(),
        permissionStatus: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getUserFromToken(ctx, args.token);

        if (!user) {
            throw new Error("Not authenticated");
        }

        await ctx.db.patch(user._id, {
            ...(args.expoPushToken ? { expoPushToken: args.expoPushToken } : {}),
            notificationsEnabled: args.notificationsEnabled,
            updatedAt: Date.now(),
        });

        return true;
    },
});

export const syncSubscriptionFromRevenueCat = mutation({
    args: {
        token: v.string(),
        revenueCatUserId: v.string(),
        hasActiveSubscription: v.boolean(),
        subscriptionStatus: v.union(
            v.literal("inactive"),
            v.literal("trial"),
            v.literal("active"),
            v.literal("expired"),
        ),
        productIdentifier: v.optional(v.string()),
        subscriptionExpiresAt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getUserFromToken(ctx, args.token);

        if (!user) {
            throw new Error("Not authenticated");
        }

        await ctx.db.patch(user._id, {
            revenueCatUserId: args.revenueCatUserId,
            hasActiveSubscription: args.hasActiveSubscription,
            subscriptionStatus: args.subscriptionStatus,
            ...(args.productIdentifier
                ? { productIdentifier: args.productIdentifier }
                : {}),
            ...(typeof args.subscriptionExpiresAt === "number"
                ? { subscriptionExpiresAt: args.subscriptionExpiresAt }
                : {}),
            updatedAt: Date.now(),
        });

        return true;
    },
});

export const signOut = mutation({
    args: {
        token: v.string(),
    },
    handler: async (ctx, args) => {
        const session = await ctx.db
            .query("sessions")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .unique();

        if (session) {
            await ctx.db.delete(session._id);
        }

        return true;
    },
});

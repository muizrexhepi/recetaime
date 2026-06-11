import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const subscriptionStatus = v.union(
    v.literal("inactive"),
    v.literal("trial"),
    v.literal("active"),
    v.literal("expired"),
);

const authProvider = v.union(
    v.literal("email"),
    v.literal("apple"),
    v.literal("google"),
    v.literal("dev"),
);

const importSource = v.union(
    v.literal("tiktok"),
    v.literal("instagram"),
    v.literal("youtube"),
    v.literal("whatsapp"),
    v.literal("photo"),
    v.literal("manual"),
    v.literal("web"),
);

const syncSource = v.union(
    v.literal("guest_sync"),
    v.literal("account"),
    v.literal("manual"),
);

export default defineSchema({
    users: defineTable({
        guestId: v.optional(v.string()),
        authSubject: v.optional(v.string()),
        email: v.optional(v.string()),
        name: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
        passwordHash: v.optional(v.string()),
        passwordSalt: v.optional(v.string()),

        authProvider: v.optional(authProvider),

        onboardingCompleted: v.boolean(),
        onboardingCompletedAt: v.optional(v.number()),

        selectedSources: v.optional(v.array(v.string())),
        selectedGoals: v.optional(v.array(v.string())),
        selectedReminderMoments: v.optional(v.array(v.string())),
        heardFrom: v.optional(v.string()),
        ageRange: v.optional(v.string()),
        expoPushToken: v.optional(v.string()),
        notificationsEnabled: v.optional(v.boolean()),

        subscriptionStatus,
        hasActiveSubscription: v.boolean(),
        revenueCatUserId: v.optional(v.string()),
        productIdentifier: v.optional(v.string()),
        subscriptionExpiresAt: v.optional(v.number()),

        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_guest_id", ["guestId"])
        .index("by_auth_subject", ["authSubject"])
        .index("by_email", ["email"])
        .index("by_revenue_cat_user_id", ["revenueCatUserId"]),

    sessions: defineTable({
        token: v.string(),
        userId: v.id("users"),
        createdAt: v.number(),
        expiresAt: v.optional(v.number()),
    }).index("by_token", ["token"]),

    collections: defineTable({
        userId: v.id("users"),
        title: v.string(),
        color: v.optional(v.string()),
        icon: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_user", ["userId"]),

    recipes: defineTable({
        userId: v.id("users"),

        title: v.string(),
        description: v.optional(v.string()),

        sourceType: importSource,
        sourceUrl: v.optional(v.string()),
        sourceText: v.optional(v.string()),

        imageUrl: v.optional(v.string()),

        servings: v.optional(v.number()),
        prepTimeMinutes: v.optional(v.number()),
        cookTimeMinutes: v.optional(v.number()),
        totalTimeMinutes: v.optional(v.number()),

        ingredients: v.array(
            v.object({
                text: v.string(),
                amount: v.optional(v.string()),
                unit: v.optional(v.string()),
                item: v.optional(v.string()),
                note: v.optional(v.string()),
                confidence: v.optional(
                    v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
                ),
            }),
        ),

        steps: v.array(v.string()),

        notes: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        collectionIds: v.optional(v.array(v.id("collections"))),

        isFavorite: v.boolean(),

        originalLocalId: v.optional(v.string()),
        syncSource,

        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_user_created_at", ["userId", "createdAt"])
        .index("by_original_local_id", ["originalLocalId"]),

    importUsage: defineTable({
        userId: v.optional(v.id("users")),
        guestId: v.optional(v.string()),

        sourceType: importSource,
        createdAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_guest", ["guestId"]),
});

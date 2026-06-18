import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type GuestRecipe = {
    localId: string;
    serverId?: string;

    title: string;
    description?: string;

    sourceType:
    | "tiktok"
    | "instagram"
    | "youtube"
    | "whatsapp"
    | "photo"
    | "text"
    | "manual"
    | "web"
    | "unknown";

    sourceUrl?: string;
    sourceText?: string;
    imageUrl?: string;
    imageThumbnailUrl?: string;
    imageStorageId?: string;
    thumbnailStorageId?: string;
    sourcePlatform?: "tiktok" | "instagram" | "manual" | "photo" | "text" | "unknown";
    sourceTitle?: string;
    sourceAuthor?: string;
    sourceThumbnailUrl?: string;

    ingredients: {
        text: string;
        amount?: string;
        unit?: string;
        item?: string;
        note?: string;
        confidence?: "low" | "medium" | "high";
    }[];

    steps: string[];
    tips?: string[];

    servings?: number;
    prepTimeMinutes?: number;
    cookTimeMinutes?: number;
    extractionConfidence?: "low" | "medium" | "high";
    extractionWarnings?: string[];

    collectionIds: string[];

    isFavorite: boolean;

    syncStatus: "local_only" | "syncing" | "synced" | "failed";

    createdAt: number;
    updatedAt: number;
};

type GuestState = {
    guestId: string;
    guestName: string;
    onboardingCompleted: boolean;

    selectedSources: string[];
    selectedGoals: string[];
    selectedReminderMoments: string[];
    heardFrom?: string;
    ageRange?: string;
    onboardingPaywallHandled: boolean;
    notificationsEnabled: boolean;
    notificationPermissionStatus?: string;
    expoPushToken?: string;

    recipes: GuestRecipe[];

    completeOnboarding: (args: {
        selectedSources: string[];
        selectedGoals: string[];
        selectedReminderMoments?: string[];
        heardFrom?: string;
        ageRange?: string;
        onboardingPaywallHandled?: boolean;
    }) => void;

    setNotificationPreference: (args: {
        enabled: boolean;
        permissionStatus?: string;
        expoPushToken?: string;
    }) => void;

    addRecipe: (
        recipe: Omit<
            GuestRecipe,
            "localId" | "syncStatus" | "createdAt" | "updatedAt"
        >,
    ) => string;

    markRecipeSynced: (localId: string, serverId: string) => void;
    markRecipeFailed: (localId: string) => void;
    updateRecipeImage: (
        localId: string,
        image: {
            imageUrl?: string;
            imageThumbnailUrl?: string;
            imageStorageId?: string;
            thumbnailStorageId?: string;
        },
    ) => void;

    resetGuest: () => void;
};

function createGuestId() {
    return `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function createGuestName() {
    const adjectives = ["spicy", "sweet", "fresh", "golden", "crispy"];
    const nouns = ["sugar", "burek", "pancake", "honey", "pepper"];

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(100 + Math.random() * 900);

    return `${adjective}-${noun}-${number}`;
}

function createInitialGuestState() {
    return {
        guestId: createGuestId(),
        guestName: createGuestName(),
        onboardingCompleted: false,
        selectedSources: [],
        selectedGoals: [],
        selectedReminderMoments: [],
        heardFrom: undefined,
        ageRange: undefined,
        onboardingPaywallHandled: false,
        notificationsEnabled: false,
        notificationPermissionStatus: undefined,
        expoPushToken: undefined,
        recipes: [],
    };
}

export const useGuestStore = create<GuestState>()(
    persist(
        (set) => ({
            ...createInitialGuestState(),

            completeOnboarding: ({
                selectedSources,
                selectedGoals,
                selectedReminderMoments = [],
                heardFrom,
                ageRange,
                onboardingPaywallHandled = false,
            }) =>
                set({
                    onboardingCompleted: true,
                    selectedSources,
                    selectedGoals,
                    selectedReminderMoments,
                    heardFrom,
                    ageRange,
                    onboardingPaywallHandled,
                }),

            setNotificationPreference: ({
                enabled,
                permissionStatus,
                expoPushToken,
            }) =>
                set({
                    notificationsEnabled: enabled,
                    notificationPermissionStatus: permissionStatus,
                    expoPushToken,
                }),

            addRecipe: (recipe) => {
                const now = Date.now();
                const localId = `local_${now}_${Math.random().toString(36).slice(2)}`;

                set((state) => ({
                    recipes: [
                        {
                            ...recipe,
                            localId,
                            syncStatus: "local_only",
                            createdAt: now,
                            updatedAt: now,
                        },
                        ...state.recipes,
                    ],
                }));

                return localId;
            },

            markRecipeSynced: (localId, serverId) =>
                set((state) => ({
                    recipes: state.recipes.map((recipe) =>
                        recipe.localId === localId
                            ? {
                                ...recipe,
                                serverId,
                                syncStatus: "synced",
                                updatedAt: Date.now(),
                            }
                            : recipe,
                    ),
                })),

            markRecipeFailed: (localId) =>
                set((state) => ({
                    recipes: state.recipes.map((recipe) =>
                        recipe.localId === localId
                            ? {
                                ...recipe,
                                syncStatus: "failed",
                                updatedAt: Date.now(),
                            }
                            : recipe,
                    ),
                })),

            updateRecipeImage: (localId, image) =>
                set((state) => ({
                    recipes: state.recipes.map((recipe) =>
                        recipe.localId === localId || String(recipe.serverId) === String(localId)
                            ? {
                                ...recipe,
                                ...image,
                                updatedAt: Date.now(),
                            }
                            : recipe,
                    ),
                })),

            resetGuest: () => {
                set(createInitialGuestState());
            },
        }),
        {
            name: "receta-ime-guest-store",
            storage: createJSONStorage(() => AsyncStorage),
        },
    ),
);

import { create } from "zustand";

import { GuestRecipe } from "@/stores/guest-store";

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export type GuestMealPlanItem = {
    localId: string;
    dateKey: string;
    slot: MealSlot;
    recipeId?: string;
    recipe: GuestRecipe;
    createdAt: number;
    updatedAt: number;
};

type MealPlanState = {
    items: GuestMealPlanItem[];
    addGuestRecipe: (args: {
        dateKey: string;
        slot: MealSlot;
        recipe: GuestRecipe;
    }) => void;
    removeGuestItem: (localId: string) => void;
    clearGuestPlan: () => void;
};

function createLocalId() {
    return `meal_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export const useMealPlanStore = create<MealPlanState>()((set) => ({
    items: [],

    addGuestRecipe: ({ dateKey, slot, recipe }) =>
        set((state) => {
            const now = Date.now();

            return {
                items: [
                    ...state.items,
                    {
                        localId: createLocalId(),
                        dateKey,
                        slot,
                        recipeId: recipe.localId,
                        recipe,
                        createdAt: now,
                        updatedAt: now,
                    },
                ],
            };
        }),

    removeGuestItem: (localId) =>
        set((state) => ({
            items: state.items.filter((item) => item.localId !== localId),
        })),

    clearGuestPlan: () => set({ items: [] }),
}));
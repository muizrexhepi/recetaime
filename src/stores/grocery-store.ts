import { create } from "zustand";

import type { MealSlot } from "@/stores/meal-plan-store";

export type GuestGroceryItem = {
    localId: string;

    text: string;
    amount?: string;
    unit?: string;
    item?: string;
    note?: string;

    recipeId?: string;
    recipeTitle?: string;

    sourceDateKey?: string;
    mealSlot?: MealSlot;

    checked: boolean;

    createdAt: number;
    updatedAt: number;
};

type AddGuestGroceryItem = Omit<
    GuestGroceryItem,
    "localId" | "checked" | "createdAt" | "updatedAt"
>;

type GroceryState = {
    items: GuestGroceryItem[];
    addItems: (items: AddGuestGroceryItem[]) => void;
    toggleItem: (localId: string) => void;
    removeItem: (localId: string) => void;
    clearChecked: () => void;
};

function createLocalId() {
    return `grocery_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export const useGroceryStore = create<GroceryState>()((set) => ({
    items: [],

    addItems: (items) =>
        set((state) => {
            const now = Date.now();

            return {
                items: [
                    ...items
                        .map((item) => ({
                            ...item,
                            text: item.text.trim(),
                        }))
                        .filter((item) => item.text.length > 0)
                        .map((item) => ({
                            ...item,
                            localId: createLocalId(),
                            checked: false,
                            createdAt: now,
                            updatedAt: now,
                        })),
                    ...state.items,
                ],
            };
        }),

    toggleItem: (localId) =>
        set((state) => ({
            items: state.items.map((item) =>
                item.localId === localId
                    ? {
                        ...item,
                        checked: !item.checked,
                        updatedAt: Date.now(),
                    }
                    : item,
            ),
        })),

    removeItem: (localId) =>
        set((state) => ({
            items: state.items.filter((item) => item.localId !== localId),
        })),

    clearChecked: () =>
        set((state) => ({
            items: state.items.filter((item) => !item.checked),
        })),
}));
import {
  IconArrowLeft,
  IconCalendar,
  IconCheck,
  IconX,
} from "@tabler/icons-react-native";
import { useMutation, useQuery } from "convex/react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { useGroceryStore } from "@/stores/grocery-store";
import type { GuestRecipe } from "@/stores/guest-store";
import { MealSlot, useMealPlanStore } from "@/stores/meal-plan-store";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type RecipeLike = Partial<GuestRecipe> & {
  _id?: Id<"recipes">;
  localId?: string;
  title: string;
  imageUrl?: string;
  ingredients?: {
    text: string;
    amount?: string;
    unit?: string;
    item?: string;
    note?: string;
  }[];
};

type MealPlanItemLike = {
  _id?: Id<"mealPlanItems">;
  localId?: string;
  dateKey: string;
  slot: MealSlot;
  recipe: RecipeLike;
};

type IngredientRow = {
  id: string;
  planItemKey: string;
  dateKey: string;
  slot: MealSlot;
  recipe: RecipeLike;
  ingredient: {
    text: string;
    amount?: string;
    unit?: string;
    item?: string;
    note?: string;
  };
};

const MONTHS = [
  "Jan",
  "Shk",
  "Mar",
  "Pri",
  "Maj",
  "Qer",
  "Kor",
  "Gus",
  "Sht",
  "Tet",
  "Nën",
  "Dhj",
];

export default function AddGroceriesModalScreen() {
  const theme = useTheme();
  const router = useRouter();

  const params = useLocalSearchParams<{
    startDateKey?: string;
    endDateKey?: string;
    selectedItemKey?: string;
  }>();

  const { token, isAuthenticated } = useAuth();

  const guestPlanItems = useMealPlanStore((state) => state.items);
  const addGuestGroceryItems = useGroceryStore((state) => state.addItems);

  const addAccountGroceryItems = useMutation(api.groceries.addItems);

  const [step, setStep] = useState<"recipes" | "items">("recipes");
  const [selectedPlanItemKeys, setSelectedPlanItemKeys] = useState<string[]>(
    [],
  );
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<string[]>(
    [],
  );
  const [didInitializeRecipes, setDidInitializeRecipes] = useState(false);

  const startDateKey = params.startDateKey;
  const endDateKey = params.endDateKey;

  const accountPlanItems = useQuery(
    api.mealPlan.getWeek,
    isAuthenticated && token && startDateKey && endDateKey
      ? {
          token,
          startDateKey,
          endDateKey,
        }
      : "skip",
  ) as MealPlanItemLike[] | undefined;

  const sourceItems = useMemo(() => {
    const items = (
      isAuthenticated ? (accountPlanItems ?? []) : guestPlanItems
    ) as MealPlanItemLike[];

    return items.filter((item) => {
      if (!startDateKey || !endDateKey) return true;

      return item.dateKey >= startDateKey && item.dateKey <= endDateKey;
    });
  }, [
    accountPlanItems,
    endDateKey,
    guestPlanItems,
    isAuthenticated,
    startDateKey,
  ]);

  const selectedItems = useMemo(() => {
    return sourceItems.filter((item) =>
      selectedPlanItemKeys.includes(getPlanItemKey(item)),
    );
  }, [selectedPlanItemKeys, sourceItems]);

  const ingredientRows = useMemo<IngredientRow[]>(() => {
    return selectedItems.flatMap((planItem) => {
      const planItemKey = getPlanItemKey(planItem);

      return (planItem.recipe.ingredients ?? []).map((ingredient, index) => ({
        id: `${planItemKey}:${index}`,
        planItemKey,
        dateKey: planItem.dateKey,
        slot: planItem.slot,
        recipe: planItem.recipe,
        ingredient,
      }));
    });
  }, [selectedItems]);

  const selectedIngredientCount = selectedIngredientIds.length;

  useEffect(() => {
    if (didInitializeRecipes || sourceItems.length === 0) return;

    if (params.selectedItemKey) {
      setSelectedPlanItemKeys([params.selectedItemKey]);
    } else {
      setSelectedPlanItemKeys(sourceItems.map(getPlanItemKey));
    }

    setDidInitializeRecipes(true);
  }, [didInitializeRecipes, params.selectedItemKey, sourceItems]);

  useEffect(() => {
    if (step !== "items") return;

    setSelectedIngredientIds(ingredientRows.map((row) => row.id));
  }, [ingredientRows, step]);

  const togglePlanItem = (key: string) => {
    setSelectedPlanItemKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const toggleIngredient = (id: string) => {
    setSelectedIngredientIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleAllIngredients = () => {
    if (selectedIngredientIds.length === ingredientRows.length) {
      setSelectedIngredientIds([]);
      return;
    }

    setSelectedIngredientIds(ingredientRows.map((row) => row.id));
  };

  const addSelectedItems = async () => {
    const rowsToAdd = ingredientRows.filter((row) =>
      selectedIngredientIds.includes(row.id),
    );

    if (rowsToAdd.length === 0) return;

    if (isAuthenticated && token) {
      await addAccountGroceryItems({
        token,
        items: rowsToAdd.map((row) => ({
          text: row.ingredient.text,
          ...(row.ingredient.amount ? { amount: row.ingredient.amount } : {}),
          ...(row.ingredient.unit ? { unit: row.ingredient.unit } : {}),
          ...(row.ingredient.item ? { item: row.ingredient.item } : {}),
          ...(row.ingredient.note ? { note: row.ingredient.note } : {}),
          ...(row.recipe._id ? { recipeId: row.recipe._id } : {}),
          recipeTitle: row.recipe.title,
          sourceDateKey: row.dateKey,
          mealSlot: row.slot,
        })),
      });

      router.back();
      return;
    }

    addGuestGroceryItems(
      rowsToAdd.map((row) => ({
        text: row.ingredient.text,
        ...(row.ingredient.amount ? { amount: row.ingredient.amount } : {}),
        ...(row.ingredient.unit ? { unit: row.ingredient.unit } : {}),
        ...(row.ingredient.item ? { item: row.ingredient.item } : {}),
        ...(row.ingredient.note ? { note: row.ingredient.note } : {}),
        ...(row.recipe.localId ? { recipeId: row.recipe.localId } : {}),
        recipeTitle: row.recipe.title,
        sourceDateKey: row.dateKey,
        mealSlot: row.slot,
      })),
    );

    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: step === "recipes" ? "Zgjidh receta" : "Shto artikuj",
        }}
      />

      <SafeAreaView
        edges={["bottom"]}
        style={[styles.safeArea, { backgroundColor: theme.background }]}
      >
        <ThemedView transparent style={styles.content}>
          <ThemedView transparent style={styles.header}>
            {step === "items" ? (
              <Pressable
                onPress={() => setStep("recipes")}
                style={({ pressed }) => [
                  styles.headerIconButton,
                  {
                    backgroundColor: theme.surface,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <IconArrowLeft
                  size={22}
                  color={theme.textPrimary}
                  strokeWidth={2.4}
                />
              </Pressable>
            ) : (
              <View style={styles.headerIconSpacer} />
            )}

            <ThemedText type="title" style={styles.headerTitle}>
              {step === "recipes" ? "Zgjidh receta" : "Shto artikuj"}
            </ThemedText>

            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.headerIconButton,
                {
                  backgroundColor: theme.surface,
                  opacity: pressed ? 0.72 : 1,
                },
              ]}
            >
              <IconX size={22} color={theme.textPrimary} strokeWidth={2.4} />
            </Pressable>
          </ThemedView>

          {step === "recipes" ? (
            <>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {sourceItems.length === 0 ? (
                  <View style={styles.empty}>
                    <ThemedText type="body" themeColor="textSecondary">
                      Nuk ka receta të planifikuara për këtë javë.
                    </ThemedText>
                  </View>
                ) : (
                  sourceItems.map((item) => {
                    const key = getPlanItemKey(item);
                    const selected = selectedPlanItemKeys.includes(key);

                    return (
                      <Pressable
                        key={key}
                        onPress={() => togglePlanItem(key)}
                        style={({ pressed }) => [
                          { opacity: pressed ? 0.78 : 1 },
                        ]}
                      >
                        <ThemedCard
                          style={[
                            styles.recipeCard,
                            {
                              backgroundColor: theme.surfaceElevated,
                              borderColor: selected
                                ? theme.primary
                                : theme.borderLight,
                            },
                          ]}
                        >
                          <RecipeThumb recipe={item.recipe} />

                          <ThemedView transparent style={styles.recipeCopy}>
                            <ThemedText type="cardTitle" numberOfLines={2}>
                              {item.recipe.title}
                            </ThemedText>

                            <ThemedText
                              type="subhead"
                              themeColor="textSecondary"
                            >
                              {formatShortDate(item.dateKey)} ·{" "}
                              {slotLabel(item.slot)}
                            </ThemedText>
                          </ThemedView>

                          <CheckBox selected={selected} />
                        </ThemedCard>
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>

              <FooterButton
                label="Vazhdo"
                disabled={selectedPlanItemKeys.length === 0}
                onPress={() => setStep("items")}
              />
            </>
          ) : (
            <>
              <ThemedView transparent style={styles.itemsToolbar}>
                <ThemedText type="subhead" themeColor="textSecondary">
                  {selectedIngredientCount} nga {ingredientRows.length} të
                  zgjedhura
                </ThemedText>

                <Pressable onPress={toggleAllIngredients} hitSlop={8}>
                  <ThemedText type="smallBold" themeColor="primary">
                    {selectedIngredientIds.length === ingredientRows.length
                      ? "Hiqi të gjitha"
                      : "Zgjidhi të gjitha"}
                  </ThemedText>
                </Pressable>
              </ThemedView>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {selectedItems.map((item) => {
                  const rows = ingredientRows.filter(
                    (row) => row.planItemKey === getPlanItemKey(item),
                  );

                  return (
                    <ThemedView
                      key={getPlanItemKey(item)}
                      transparent
                      style={styles.recipeIngredientGroup}
                    >
                      <ThemedView transparent style={styles.groupHeader}>
                        <RecipeThumb recipe={item.recipe} small />

                        <ThemedView transparent style={styles.groupHeaderCopy}>
                          <ThemedText type="cardTitle" numberOfLines={1}>
                            {item.recipe.title}
                          </ThemedText>

                          <ThemedText type="subhead" themeColor="textSecondary">
                            {formatShortDate(item.dateKey)} ·{" "}
                            {slotLabel(item.slot)}
                          </ThemedText>
                        </ThemedView>
                      </ThemedView>

                      <ThemedCard
                        style={[
                          styles.ingredientsCard,
                          {
                            backgroundColor: theme.surfaceElevated,
                            borderColor: theme.borderLight,
                          },
                        ]}
                      >
                        {rows.map((row, index) => {
                          const selected = selectedIngredientIds.includes(
                            row.id,
                          );

                          return (
                            <Pressable
                              key={row.id}
                              onPress={() => toggleIngredient(row.id)}
                              style={({ pressed }) => [
                                styles.ingredientRow,
                                index !== rows.length - 1 && {
                                  borderBottomWidth: StyleSheet.hairlineWidth,
                                  borderBottomColor: theme.borderLight,
                                },
                                { opacity: pressed ? 0.72 : 1 },
                              ]}
                            >
                              <ThemedText
                                type="bodyMedium"
                                style={styles.ingredientText}
                              >
                                {row.ingredient.text}
                              </ThemedText>

                              <CheckBox selected={selected} />
                            </Pressable>
                          );
                        })}
                      </ThemedCard>
                    </ThemedView>
                  );
                })}
              </ScrollView>

              <FooterButton
                label={`Shto ${selectedIngredientCount} artikuj`}
                disabled={selectedIngredientCount === 0}
                onPress={() => void addSelectedItems()}
              />
            </>
          )}
        </ThemedView>
      </SafeAreaView>
    </>
  );
}

function RecipeThumb({
  recipe,
  small,
}: {
  recipe: RecipeLike;
  small?: boolean;
}) {
  const theme = useTheme();
  const size = small ? 46 : 56;

  if (recipe.imageUrl) {
    return (
      <Image
        source={{ uri: recipe.imageUrl }}
        style={[
          styles.recipeImage,
          {
            width: size,
            height: size,
            borderRadius: small ? Radius.md : Radius.lg,
          },
        ]}
      />
    );
  }

  return (
    <ThemedView
      style={[
        styles.recipeThumb,
        {
          width: size,
          height: size,
          borderRadius: small ? Radius.md : Radius.lg,
          backgroundColor: theme.surface,
        },
      ]}
    >
      <IconCalendar size={20} color={theme.primary} strokeWidth={2.1} />
    </ThemedView>
  );
}

function CheckBox({ selected }: { selected: boolean }) {
  const theme = useTheme();

  return (
    <ThemedView
      style={[
        styles.checkbox,
        {
          backgroundColor: selected ? theme.primary : theme.surface,
          borderColor: selected ? theme.primary : theme.borderStrong,
        },
      ]}
    >
      {selected ? (
        <IconCheck size={18} color="#FFFFFF" strokeWidth={3} />
      ) : null}
    </ThemedView>
  );
}

function FooterButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <ThemedView
      style={[
        styles.footer,
        {
          backgroundColor: theme.background,
          borderTopColor: theme.borderLight,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.footerButton,
          {
            backgroundColor: disabled ? theme.surfaceMuted : theme.primary,
            opacity: pressed ? 0.84 : 1,
          },
        ]}
      >
        <ThemedText
          type="button"
          style={{
            color: disabled ? theme.textTertiary : theme.textInverse,
          }}
        >
          {label}
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

function getPlanItemKey(item: MealPlanItemLike) {
  return String(item._id ?? item.localId);
}

function formatShortDate(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`);

  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

function slotLabel(slot: MealSlot) {
  switch (slot) {
    case "breakfast":
      return "Mëngjes";
    case "lunch":
      return "Drekë";
    case "dinner":
      return "Darkë";
    case "snack":
      return "Snack";
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    minHeight: 72,
    paddingHorizontal: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EEEAE2",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 24,
    lineHeight: 30,
  },
  headerIconButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconSpacer: {
    width: 48,
    height: 48,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: 110,
    gap: Spacing.md,
  },
  recipeCard: {
    minHeight: 84,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  recipeThumb: {
    alignItems: "center",
    justifyContent: "center",
  },
  recipeImage: {
    backgroundColor: "#F0F0EC",
  },
  recipeCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  checkbox: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    paddingTop: 80,
    alignItems: "center",
  },
  itemsToolbar: {
    minHeight: 48,
    paddingHorizontal: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EEEAE2",
  },
  recipeIngredientGroup: {
    gap: Spacing.md,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  groupHeaderCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  ingredientsCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 0,
    overflow: "hidden",
  },
  ingredientRow: {
    minHeight: 66,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  ingredientText: {
    flex: 1,
    lineHeight: 23,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerButton: {
    minHeight: 54,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
});

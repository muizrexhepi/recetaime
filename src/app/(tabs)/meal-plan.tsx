import { Button, Host, Menu } from "@expo/ui/swift-ui";
import { labelStyle } from "@expo/ui/swift-ui/modifiers";
import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconShoppingCartPlus,
} from "@tabler/icons-react-native";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";

import { TabScreen } from "@/components/tabs/tab-screen";
import { TabScreenHeader } from "@/components/tabs/tab-screen-header";
import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { GuestRecipe } from "@/stores/guest-store";
import { MealSlot, useMealPlanStore } from "@/stores/meal-plan-store";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type RecipeLike = Partial<GuestRecipe> & {
  _id?: Id<"recipes">;
  localId?: string;
  title: string;
  description?: string;
  sourceType?: string;
  imageUrl?: string;
  ingredients?: { text: string }[];
  steps?: string[];
};

type MealPlanItemLike = {
  _id?: Id<"mealPlanItems">;
  localId?: string;
  dateKey: string;
  slot: MealSlot;
  recipeId?: Id<"recipes"> | string;
  recipe: RecipeLike;
};

const WEEK_DAYS = [
  "E hënë",
  "E martë",
  "E mërkurë",
  "E enjte",
  "E premte",
  "E shtunë",
  "E diel",
];

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

export default function MealPlanScreen() {
  const theme = useTheme();
  const router = useRouter();

  const { token, isAuthenticated } = useAuth();

  const guestPlanItems = useMealPlanStore((state) => state.items);
  const removeGuestItem = useMealPlanStore((state) => state.removeGuestItem);

  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = useMemo(
    () => getMonday(addDays(new Date(), weekOffset * 7)),
    [weekOffset],
  );

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, index) => {
        const date = addDays(weekStart, index);

        return {
          date,
          dateKey: formatDateKey(date),
          dayLabel: WEEK_DAYS[index],
          dayNumber: date.getDate(),
          isToday: isSameDate(date, new Date()),
        };
      }),
    [weekStart],
  );

  const weekEnd = weekDays[6].date;

  const accountPlanItems = useQuery(
    api.mealPlan.getWeek,
    isAuthenticated && token
      ? {
          token,
          startDateKey: formatDateKey(weekStart),
          endDateKey: formatDateKey(weekEnd),
        }
      : "skip",
  ) as MealPlanItemLike[] | undefined;

  const removeMealPlanItem = useMutation(api.mealPlan.removeItem);

  const planItems = (
    isAuthenticated ? (accountPlanItems ?? []) : guestPlanItems
  ) as MealPlanItemLike[];

  const openAddMeal = (dateKey: string, slot: MealSlot) => {
    router.push({
      pathname: "/(modals)/add-meal",
      params: {
        dateKey,
        slot,
      },
    } as any);
  };

  const openRecipe = (recipe: RecipeLike) => {
    const id = recipe._id ?? recipe.localId;

    if (!id) return;

    router.push({
      pathname: "/recipe/[id]",
      params: {
        id: String(id),
        source: isAuthenticated ? "account" : "guest",
      },
    } as any);
  };

  const removeItem = async (item: MealPlanItemLike) => {
    if (isAuthenticated && token && item._id) {
      await removeMealPlanItem({
        token,
        itemId: item._id,
      });

      return;
    }

    if (item.localId) {
      removeGuestItem(item.localId);
    }
  };

  return (
    <TabScreen>
      <TabScreenHeader
        title="Plani"
        right={
          <View
            style={[
              styles.nativeMenuShell,
              {
                backgroundColor: theme.surface,
              },
            ]}
          >
            <Host matchContents>
              <Menu
                label="Opsionet"
                systemImage="ellipsis"
                modifiers={[labelStyle("iconOnly")]}
              >
                <Button
                  label="Kthehu te kjo javë"
                  systemImage="calendar"
                  onPress={() => setWeekOffset(0)}
                />
                <Button
                  label="Shko te lista e blerjes"
                  systemImage="cart"
                  onPress={() => router.push("/(tabs)/groceries" as any)}
                />
              </Menu>
            </Host>
          </View>
        }
      />

      <ThemedView
        style={[
          styles.weekCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.borderLight,
          },
        ]}
      >
        <Pressable
          onPress={() => setWeekOffset((prev) => prev - 1)}
          hitSlop={12}
          style={styles.weekArrow}
        >
          <IconChevronLeft
            size={22}
            color={theme.textPrimary}
            strokeWidth={2.35}
          />
        </Pressable>

        <ThemedView transparent style={styles.weekCopy}>
          <ThemedText
            type="smallBold"
            themeColor="textSecondary"
            style={styles.weekEyebrow}
          >
            JAVA
          </ThemedText>

          <ThemedText type="cardTitle" style={styles.weekTitle}>
            {formatWeekRange(weekStart, weekEnd)}
          </ThemedText>
        </ThemedView>

        <Pressable
          onPress={() => setWeekOffset((prev) => prev + 1)}
          hitSlop={12}
          style={styles.weekArrow}
        >
          <IconChevronRight
            size={22}
            color={theme.textPrimary}
            strokeWidth={2.35}
          />
        </Pressable>
      </ThemedView>

      <Pressable
        onPress={() => router.push("/(tabs)/groceries" as any)}
        style={({ pressed }) => [
          styles.groceryButton,
          {
            borderColor: theme.border,
            backgroundColor: theme.surfaceElevated,
            opacity: pressed ? 0.82 : 1,
          },
        ]}
      >
        <IconShoppingCartPlus
          size={20}
          color={theme.textPrimary}
          strokeWidth={2.2}
        />

        <ThemedText type="smallBold">Shto në listën e blerjes</ThemedText>
      </Pressable>

      <ThemedView transparent style={styles.days}>
        {weekDays.map((day) => {
          const dayItems = planItems.filter(
            (item) => item.dateKey === day.dateKey,
          );

          return (
            <View key={day.dateKey} style={styles.daySection}>
              <ThemedView transparent style={styles.dayHeader}>
                <ThemedView transparent style={styles.dayCopy}>
                  <ThemedView transparent style={styles.dayTitleRow}>
                    <ThemedText type="cardTitle" style={styles.dayTitle}>
                      {day.dayLabel} {day.dayNumber}
                    </ThemedText>

                    {day.isToday ? (
                      <ThemedView
                        style={[
                          styles.todayPill,
                          { backgroundColor: theme.primarySoft },
                        ]}
                      >
                        <ThemedText type="caption" themeColor="primary">
                          Sot
                        </ThemedText>
                      </ThemedView>
                    ) : null}
                  </ThemedView>

                  {dayItems.length === 0 ? (
                    <ThemedText type="subhead" themeColor="textTertiary">
                      Nuk ka receta ende
                    </ThemedText>
                  ) : (
                    <ThemedText type="subhead" themeColor="textSecondary">
                      {dayItems.length} recetë
                      {dayItems.length === 1 ? "" : "a"}
                    </ThemedText>
                  )}
                </ThemedView>

                <View
                  style={[
                    styles.nativeMenuShellSmall,
                    {
                      backgroundColor: theme.surface,
                    },
                  ]}
                >
                  <Host matchContents>
                    <Menu
                      label="Shto vakt"
                      systemImage="plus"
                      modifiers={[labelStyle("iconOnly")]}
                    >
                      <Button
                        label="Mëngjes"
                        systemImage="sunrise"
                        onPress={() => openAddMeal(day.dateKey, "breakfast")}
                      />
                      <Button
                        label="Drekë"
                        systemImage="sun.max"
                        onPress={() => openAddMeal(day.dateKey, "lunch")}
                      />
                      <Button
                        label="Darkë"
                        systemImage="moon"
                        onPress={() => openAddMeal(day.dateKey, "dinner")}
                      />
                      <Button
                        label="Snack"
                        systemImage="takeoutbag.and.cup.and.straw"
                        onPress={() => openAddMeal(day.dateKey, "snack")}
                      />
                    </Menu>
                  </Host>
                </View>
              </ThemedView>

              {dayItems.length > 0 ? (
                <ThemedView transparent style={styles.meals}>
                  {dayItems.map((item) => (
                    <ThemedCard
                      key={String(item._id ?? item.localId)}
                      style={[
                        styles.mealRow,
                        {
                          backgroundColor: theme.surfaceElevated,
                          borderColor: theme.borderLight,
                        },
                      ]}
                    >
                      <Pressable
                        onPress={() => openRecipe(item.recipe)}
                        style={({ pressed }) => [
                          styles.mealMain,
                          { opacity: pressed ? 0.78 : 1 },
                        ]}
                      >
                        <RecipeThumb recipe={item.recipe} />

                        <ThemedView transparent style={styles.mealCopy}>
                          <ThemedText
                            type="cardTitle"
                            numberOfLines={2}
                            style={styles.mealTitle}
                          >
                            {item.recipe.title}
                          </ThemedText>

                          <ThemedView
                            style={[
                              styles.slotPill,
                              { backgroundColor: theme.warningSubtle },
                            ]}
                          >
                            <ThemedText type="caption">
                              {slotLabel(item.slot)}
                            </ThemedText>
                          </ThemedView>
                        </ThemedView>
                      </Pressable>

                      <View style={styles.mealMenuShell}>
                        <Host matchContents>
                          <Menu
                            label="Opsionet"
                            systemImage="ellipsis"
                            modifiers={[labelStyle("iconOnly")]}
                          >
                            <Button
                              label="Shiko recetën"
                              systemImage="book"
                              onPress={() => openRecipe(item.recipe)}
                            />
                            <Button
                              label="Shto në listën e blerjes"
                              systemImage="cart.badge.plus"
                              onPress={() =>
                                router.push("/(tabs)/groceries" as any)
                              }
                            />
                            <Button
                              label="Hiqe nga plani"
                              systemImage="trash"
                              role="destructive"
                              onPress={() => void removeItem(item)}
                            />
                          </Menu>
                        </Host>
                      </View>
                    </ThemedCard>
                  ))}
                </ThemedView>
              ) : null}
            </View>
          );
        })}
      </ThemedView>
    </TabScreen>
  );
}

function RecipeThumb({ recipe }: { recipe: RecipeLike }) {
  const theme = useTheme();

  if (recipe.imageUrl) {
    return (
      <Image source={{ uri: recipe.imageUrl }} style={styles.recipeImage} />
    );
  }

  return (
    <ThemedView
      style={[
        styles.recipeThumb,
        {
          backgroundColor: theme.surface,
        },
      ]}
    >
      <IconCalendar size={21} color={theme.primary} strokeWidth={2.1} />
    </ThemedView>
  );
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

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getMonday(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function isSameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatWeekRange(start: Date, end: Date) {
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) {
    return `${start.getDate()}–${end.getDate()} ${
      MONTHS[end.getMonth()]
    } ${end.getFullYear()}`;
  }

  if (sameYear) {
    return `${start.getDate()} ${MONTHS[start.getMonth()]} – ${end.getDate()} ${
      MONTHS[end.getMonth()]
    } ${end.getFullYear()}`;
  }

  return `${start.getDate()} ${MONTHS[start.getMonth()]} ${start.getFullYear()} – ${end.getDate()} ${
    MONTHS[end.getMonth()]
  } ${end.getFullYear()}`;
}

const styles = StyleSheet.create({
  nativeMenuShell: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  nativeMenuShellSmall: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  mealMenuShell: {
    width: 34,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  weekCard: {
    marginTop: Spacing.xl,
    minHeight: 66,
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  weekArrow: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  weekCopy: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  weekEyebrow: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
  weekTitle: {
    fontSize: 18,
    lineHeight: 23,
    textAlign: "center",
  },
  groceryButton: {
    marginTop: Spacing.lg,
    minHeight: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  days: {
    marginTop: Spacing.xl,
    marginHorizontal: -Spacing.xl,
  },
  daySection: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderTopWidth: 7,
    borderTopColor: "#F0F0EC",
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  dayCopy: {
    flex: 1,
    gap: 3,
  },
  dayTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  dayTitle: {
    fontSize: 18,
    lineHeight: 23,
  },
  todayPill: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  meals: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  mealRow: {
    minHeight: 74,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  mealMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  recipeThumb: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  recipeImage: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: "#F0F0EC",
  },
  mealCopy: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.xs,
  },
  mealTitle: {
    fontSize: 16,
    lineHeight: 21,
  },
  slotPill: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
});

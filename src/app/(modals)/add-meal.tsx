import { IconCalendar, IconPlus, IconSearch } from "@tabler/icons-react-native";
import { useMutation, useQuery } from "convex/react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { GuestRecipe, useGuestStore } from "@/stores/guest-store";
import { MealSlot, useMealPlanStore } from "@/stores/meal-plan-store";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type RecipeLike = Partial<GuestRecipe> & {
  _id?: Id<"recipes">;
  localId?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  ingredients?: { text: string }[];
  steps?: string[];
};

const VALID_SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

export default function AddMealModalScreen() {
  const theme = useTheme();
  const router = useRouter();

  const params = useLocalSearchParams<{
    dateKey?: string;
    slot?: string;
  }>();

  const { token, isAuthenticated } = useAuth();

  const guestRecipes = useGuestStore((state) => state.recipes);
  const addGuestRecipe = useMealPlanStore((state) => state.addGuestRecipe);

  const [search, setSearch] = useState("");

  const accountRecipes = useQuery(
    api.recipes.listMine,
    isAuthenticated && token ? { token } : "skip",
  );

  const addRecipeToPlan = useMutation(api.mealPlan.addRecipe);

  const dateKey = params.dateKey;
  const slot = normalizeSlot(params.slot);

  const recipes = (
    isAuthenticated ? (accountRecipes ?? []) : guestRecipes
  ) as RecipeLike[];

  const filteredRecipes = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return recipes;

    return recipes.filter((recipe) => {
      return (
        recipe.title?.toLowerCase().includes(query) ||
        recipe.description?.toLowerCase().includes(query) ||
        recipe.ingredients?.some((ingredient) =>
          ingredient.text.toLowerCase().includes(query),
        )
      );
    });
  }, [recipes, search]);

  const selectRecipe = async (recipe: RecipeLike) => {
    if (!dateKey || !slot) return;

    if (isAuthenticated && token && recipe._id) {
      await addRecipeToPlan({
        token,
        dateKey,
        slot,
        recipeId: recipe._id,
      });

      router.back();
      return;
    }

    addGuestRecipe({
      dateKey,
      slot,
      recipe: recipe as GuestRecipe,
    });

    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: slot ? `Shto në ${slotLabel(slot)}` : "Shto vakt",
        }}
      />

      <SafeAreaView
        edges={["bottom"]}
        style={[styles.safeArea, { backgroundColor: theme.background }]}
      >
        <ThemedView transparent style={styles.content}>
          <ThemedView transparent style={styles.hero}>
            <ThemedText type="title" style={styles.heroTitle}>
              {slot ? `Shto në ${slotLabel(slot)}` : "Shto vakt"}
            </ThemedText>

            <ThemedText type="subhead" themeColor="textSecondary">
              Zgjidh një recetë të ruajtur për këtë ditë.
            </ThemedText>
          </ThemedView>

          <View
            style={[
              styles.searchBox,
              {
                borderColor: theme.border,
                backgroundColor: theme.surfaceElevated,
              },
            ]}
          >
            <IconSearch
              size={20}
              color={theme.textTertiary}
              strokeWidth={2.2}
            />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Kërko receta"
              placeholderTextColor={theme.textTertiary}
              style={[styles.searchInput, { color: theme.textPrimary }]}
            />
          </View>

          <FlatList
            data={filteredRecipes}
            keyExtractor={(item) =>
              String(item._id ?? item.localId ?? item.title)
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.recipeList}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <ThemedText type="body" themeColor="textSecondary">
                  Nuk ka receta për të zgjedhur.
                </ThemedText>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => void selectRecipe(item)}
                style={({ pressed }) => [{ opacity: pressed ? 0.78 : 1 }]}
              >
                <ThemedCard
                  style={[
                    styles.recipeCard,
                    {
                      backgroundColor: theme.surfaceElevated,
                      borderColor: theme.borderLight,
                    },
                  ]}
                >
                  <RecipeThumb recipe={item} />

                  <View style={styles.recipeCopy}>
                    <ThemedText type="cardTitle" numberOfLines={1}>
                      {item.title}
                    </ThemedText>

                    <ThemedText
                      type="subhead"
                      themeColor="textSecondary"
                      numberOfLines={1}
                    >
                      {item.ingredients?.length ?? 0} përbërës ·{" "}
                      {item.steps?.length ?? 0} hapa
                    </ThemedText>
                  </View>

                  <IconPlus size={21} color={theme.primary} strokeWidth={2.5} />
                </ThemedCard>
              </Pressable>
            )}
          />
        </ThemedView>
      </SafeAreaView>
    </>
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

function normalizeSlot(value?: string): MealSlot | null {
  if (!value) return null;

  return VALID_SLOTS.includes(value as MealSlot) ? (value as MealSlot) : null;
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
    paddingHorizontal: Spacing.xl,
  },
  hero: {
    paddingTop: Spacing.lg,
    gap: Spacing.xs,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
  },
  searchBox: {
    marginTop: Spacing.xl,
    minHeight: 52,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Satoshi-Medium",
    fontSize: 16,
    padding: 0,
  },
  recipeList: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  separator: {
    height: Spacing.md,
  },
  recipeCard: {
    minHeight: 74,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  recipeThumb: {
    width: 50,
    height: 50,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  recipeImage: {
    width: 50,
    height: 50,
    borderRadius: Radius.lg,
    backgroundColor: "#F0F0EC",
  },
  recipeCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  empty: {
    paddingVertical: Spacing.xxxl,
    alignItems: "center",
  },
});

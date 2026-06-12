import {
  IconBook,
  IconChefHat,
  IconChevronRight,
  IconPlus,
} from "@tabler/icons-react-native";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { EmptyTabState } from "@/components/tabs/empty-tab-state";
import { TabScreen } from "@/components/tabs/tab-screen";
import { TabScreenHeader } from "@/components/tabs/tab-screen-header";
import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { GuestRecipe, useGuestStore } from "@/stores/guest-store";
import { api } from "../../../convex/_generated/api";

type RecipeLike = Partial<GuestRecipe> & {
  _id?: string;
  localId?: string;
  createdAt?: number;
  title: string;
  description?: string;
  sourceType?: string;
  ingredients?: { text: string }[];
  steps?: string[];
};

export default function CookbooksScreen() {
  const theme = useTheme();
  const router = useRouter();

  const { token, isAuthenticated } = useAuth();
  const guestRecipes = useGuestStore((state) => state.recipes);

  const accountRecipes = useQuery(
    api.recipes.listMine,
    isAuthenticated && token ? { token } : "skip",
  );

  const isLoading = isAuthenticated && token && accountRecipes === undefined;

  const recipes = (
    isAuthenticated ? (accountRecipes ?? []) : guestRecipes
  ) as RecipeLike[];

  const openRecipe = (recipe: RecipeLike) => {
    const id = getRecipeId(recipe);

    if (!id) return;

    router.push({
      pathname: "/recipe/[id]",
      params: {
        id,
        source: isAuthenticated ? "account" : "guest",
      },
    } as any);
  };

  return (
    <TabScreen>
      <TabScreenHeader
        title="Recetat"
        subtitle="Recetat e tua të ruajtura, të importuara dhe gati për gatim."
      />

      {isLoading ? (
        <ThemedView transparent style={styles.loadingState}>
          <ThemedText type="body" themeColor="textSecondary">
            Duke i ngarkuar recetat...
          </ThemedText>
        </ThemedView>
      ) : recipes.length > 0 ? (
        <ThemedView transparent style={styles.recipeList}>
          {recipes.map((recipe) => (
            <RecipeCard
              key={getRecipeKey(recipe)}
              recipe={recipe}
              onPress={() => openRecipe(recipe)}
            />
          ))}
        </ThemedView>
      ) : (
        <>
          <EmptyTabState
            icon={
              <IconChefHat size={42} color={theme.primary} strokeWidth={2.1} />
            }
            title="Asnjë recetë ende"
            subtitle="Shto recetën e parë nga link, foto, screenshot ose tekst."
          />

          <Pressable
            onPress={() =>
              router.push({
                pathname: "/import-recipe",
                params: { mode: "link" },
              } as any)
            }
            style={({ pressed }) => [
              styles.primaryAction,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.86 : 1,
              },
            ]}
          >
            <IconPlus size={21} color="#FFFFFF" strokeWidth={2.6} />
            <ThemedText style={styles.primaryActionText}>
              Shto recetë
            </ThemedText>
          </Pressable>
        </>
      )}

      <ThemedCard style={styles.tipCard}>
        <IconBook size={22} color={theme.textSecondary} strokeWidth={2.1} />

        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={styles.tipText}
        >
          Recetat ruhen si karta të pastra me përbërës, hapa dhe burim. Së
          shpejti mund t’i ndash edhe në koleksione.
        </ThemedText>
      </ThemedCard>
    </TabScreen>
  );
}

function RecipeCard({
  recipe,
  onPress,
}: {
  recipe: RecipeLike;
  onPress: () => void;
}) {
  const theme = useTheme();

  const ingredientCount = recipe.ingredients?.length ?? 0;
  const stepCount = recipe.steps?.length ?? 0;

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <ThemedCard
          style={[
            styles.recipeCard,
            {
              opacity: pressed ? 0.82 : 1,
              transform: [{ scale: pressed ? 0.99 : 1 }],
            },
          ]}
        >
          <ThemedView transparent style={styles.recipeRow}>
            <ThemedView
              style={[
                styles.recipeIcon,
                { backgroundColor: theme.primarySoft },
              ]}
            >
              <IconChefHat size={24} color={theme.primary} strokeWidth={2.1} />
            </ThemedView>

            <ThemedView transparent style={styles.recipeCopy}>
              <ThemedText
                type="smallBold"
                style={styles.recipeTitle}
                numberOfLines={1}
              >
                {recipe.title || "Recetë e re"}
              </ThemedText>

              {recipe.description ? (
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  numberOfLines={1}
                >
                  {recipe.description}
                </ThemedText>
              ) : (
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  numberOfLines={1}
                >
                  {sourceLabel(recipe.sourceType)} · {ingredientCount} përbërës
                  · {stepCount} hapa
                </ThemedText>
              )}

              {recipe.description ? (
                <ThemedText
                  type="small"
                  themeColor="textTertiary"
                  numberOfLines={1}
                >
                  {sourceLabel(recipe.sourceType)} · {ingredientCount} përbërës
                  · {stepCount} hapa
                </ThemedText>
              ) : null}
            </ThemedView>

            <ThemedView
              transparent
              style={[styles.chevron, { backgroundColor: theme.surfaceMuted }]}
            >
              <IconChevronRight
                size={18}
                color={theme.textSecondary}
                strokeWidth={2.3}
              />
            </ThemedView>
          </ThemedView>
        </ThemedCard>
      )}
    </Pressable>
  );
}

function getRecipeId(recipe: RecipeLike) {
  return recipe._id ?? recipe.localId;
}

function getRecipeKey(recipe: RecipeLike) {
  return (
    recipe._id ?? recipe.localId ?? `${recipe.title}-${recipe.createdAt ?? ""}`
  );
}

function sourceLabel(sourceType?: string) {
  switch (sourceType) {
    case "tiktok":
      return "TikTok";
    case "instagram":
      return "Instagram";
    case "youtube":
      return "YouTube";
    case "whatsapp":
      return "WhatsApp";
    case "photo":
      return "Foto";
    case "manual":
      return "Tekst";
    case "web":
      return "Web";
    default:
      return "Import";
  }
}

const styles = StyleSheet.create({
  loadingState: {
    marginTop: Spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl,
  },
  recipeList: {
    marginTop: Spacing.xxl,
    gap: Spacing.md,
  },
  recipeCard: {
    padding: Spacing.md,
    borderRadius: Radius.xl,
  },
  recipeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  recipeIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  recipeCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  recipeTitle: {
    fontSize: 17,
    lineHeight: 22,
  },
  chevron: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryAction: {
    marginTop: Spacing.lg,
    height: 54,
    borderRadius: Radius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
  },
  tipCard: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  tipText: {
    flex: 1,
  },
});

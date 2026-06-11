import { IconBook, IconChefHat } from "@tabler/icons-react-native";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet } from "react-native";

import { EmptyTabState } from "@/components/tabs/empty-tab-state";
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
  title: string;
  sourceType: string;
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

  const recipes = isAuthenticated ? (accountRecipes ?? []) : guestRecipes;

  const openImport = () => {
    router.push({
      pathname: "/import-recipe",
      params: { mode: "link" },
    } as any);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <TabScreenHeader
          title="Recetat e tua"
          subtitle="Këtu do të shfaqen recetat që ruan."
        />

        {recipes.length > 0 ? (
          <ThemedView transparent style={styles.list}>
            {recipes.map((recipe) => (
              <RecipeCard
                key={getRecipeKey(recipe)}
                recipe={recipe as RecipeLike}
              />
            ))}
          </ThemedView>
        ) : (
          <EmptyTabState
            icon={
              <IconChefHat size={42} color={theme.primary} strokeWidth={2.1} />
            }
            title="Ruaje recetën e parë"
            subtitle="Shto një link, foto, screenshot ose recetë nga WhatsApp."
            actionLabel="Shto recetë"
            onActionPress={openImport}
          />
        )}

        <ThemedView transparent style={styles.tipRow}>
          <IconBook size={18} color={theme.textSecondary} strokeWidth={2.1} />
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.tipText}
          >
            Recetat ruhen si karta të pastra me përbërës dhe hapa.
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

function RecipeCard({ recipe }: { recipe: RecipeLike }) {
  const theme = useTheme();

  const ingredientsCount = recipe.ingredients?.length ?? 0;
  const stepsCount = recipe.steps?.length ?? 0;

  return (
    <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.82 : 1 }]}>
      <ThemedCard style={styles.recipeCard}>
        <ThemedView transparent style={styles.recipeRow}>
          <ThemedView
            style={[styles.recipeIcon, { backgroundColor: theme.primarySoft }]}
          >
            <IconChefHat size={23} color={theme.primary} strokeWidth={2.15} />
          </ThemedView>

          <ThemedView transparent style={styles.recipeText}>
            <ThemedText
              type="smallBold"
              style={styles.recipeTitle}
              numberOfLines={1}
            >
              {recipe.title?.trim() || "Recetë e re"}
            </ThemedText>

            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.recipeMeta}
              numberOfLines={1}
            >
              {sourceLabel(recipe.sourceType)} • {ingredientsCount} përbërës •{" "}
              {stepsCount} hapa
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedCard>
    </Pressable>
  );
}

function getRecipeKey(recipe: {
  _id?: string;
  localId?: string;
  title?: string;
}) {
  return recipe._id ?? recipe.localId ?? recipe.title ?? String(Math.random());
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
      return "Manual";
    case "web":
      return "Web";
    default:
      return "Burim";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: 140,
  },
  list: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  recipeCard: {
    padding: Spacing.md,
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
  recipeText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  recipeTitle: {
    fontSize: 17,
    lineHeight: 22,
  },
  recipeMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  tipRow: {
    marginTop: Spacing.xl,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  tipText: {
    flex: 1,
  },
});

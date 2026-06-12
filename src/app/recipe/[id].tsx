import {
  IconChefHat,
  IconClock,
  IconExternalLink,
  IconHeart,
  IconUsers,
} from "@tabler/icons-react-native";
import { useQuery } from "convex/react";
import { Stack, useLocalSearchParams } from "expo-router";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { useGuestStore } from "@/stores/guest-store";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type RecipeDetail = {
  _id?: Id<"recipes">;
  localId?: string;
  title: string;
  description?: string;
  sourceType?: string;
  sourceUrl?: string;
  imageUrl?: string;
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  totalTimeMinutes?: number;
  ingredients?: {
    text: string;
  }[];
  steps?: string[];
  tags?: string[];
  isFavorite?: boolean;
};

export default function RecipeDetailScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id?: string; source?: string }>();

  const { token, isAuthenticated } = useAuth();
  const guestRecipes = useGuestStore((state) => state.recipes);

  const isAccountRecipe = params.source === "account";

  const accountRecipe = useQuery(
    api.recipes.getMineById,
    isAccountRecipe && isAuthenticated && token && params.id
      ? {
          token,
          recipeId: params.id as Id<"recipes">,
        }
      : "skip",
  ) as RecipeDetail | null | undefined;

  const guestRecipe = guestRecipes.find(
    (recipe) => recipe.localId === params.id,
  );

  const recipe = (isAccountRecipe ? accountRecipe : guestRecipe) as
    | RecipeDetail
    | null
    | undefined;

  const totalTime =
    recipe?.totalTimeMinutes ??
    ((recipe?.prepTimeMinutes ?? 0) + (recipe?.cookTimeMinutes ?? 0) ||
      undefined);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Receta",
          headerRight: () =>
            recipe ? (
              <Pressable hitSlop={12} style={styles.headerIconButton}>
                <IconHeart
                  size={22}
                  color={recipe.isFavorite ? theme.primary : theme.text}
                  fill={recipe.isFavorite ? theme.primary : "transparent"}
                  strokeWidth={2.2}
                />
              </Pressable>
            ) : null,
        }}
      />

      <SafeAreaView
        edges={["bottom"]}
        style={[styles.safeArea, { backgroundColor: theme.background }]}
      >
        {!recipe ? (
          <View style={styles.empty}>
            <IconChefHat size={44} color={theme.primary} strokeWidth={2.1} />

            <ThemedText type="title" style={styles.centerText}>
              Receta nuk u gjet
            </ThemedText>

            <ThemedText
              type="body"
              themeColor="textSecondary"
              style={styles.centerText}
            >
              Mund të jetë fshirë ose ende nuk është sinkronizuar.
            </ThemedText>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <ThemedView transparent style={styles.hero}>
              <ThemedView
                style={[
                  styles.heroIcon,
                  { backgroundColor: theme.primarySoft },
                ]}
              >
                <IconChefHat
                  size={34}
                  color={theme.primary}
                  strokeWidth={2.1}
                />
              </ThemedView>

              <ThemedText type="h1" style={styles.title}>
                {recipe.title}
              </ThemedText>

              {recipe.description ? (
                <ThemedText
                  type="body"
                  themeColor="textSecondary"
                  style={styles.description}
                >
                  {recipe.description}
                </ThemedText>
              ) : null}
            </ThemedView>

            <View style={styles.metaRow}>
              {recipe.servings ? (
                <MetaPill
                  icon={
                    <IconUsers
                      size={17}
                      color={theme.primary}
                      strokeWidth={2.2}
                    />
                  }
                  label={`${recipe.servings} racione`}
                />
              ) : null}

              {totalTime ? (
                <MetaPill
                  icon={
                    <IconClock
                      size={17}
                      color={theme.primary}
                      strokeWidth={2.2}
                    />
                  }
                  label={`${totalTime} min`}
                />
              ) : null}

              <MetaPill label={sourceLabel(recipe.sourceType)} />
            </View>

            {recipe.sourceUrl ? (
              <Pressable
                onPress={() => Linking.openURL(recipe.sourceUrl!)}
                style={[
                  styles.sourceButton,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.surface,
                  },
                ]}
              >
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Shiko burimin
                </ThemedText>

                <IconExternalLink
                  size={18}
                  color={theme.textSecondary}
                  strokeWidth={2.2}
                />
              </Pressable>
            ) : null}

            <Section title="PËRBËRËSIT">
              <ThemedCard style={styles.listCard}>
                {(recipe.ingredients ?? []).map((ingredient, index) => (
                  <View
                    key={`${ingredient.text}-${index}`}
                    style={[
                      styles.ingredientRow,
                      index !== (recipe.ingredients?.length ?? 0) - 1 && {
                        borderBottomColor: theme.border,
                        borderBottomWidth: 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.bullet,
                        { backgroundColor: theme.primary },
                      ]}
                    />

                    <ThemedText type="bodyMedium" style={styles.listText}>
                      {ingredient.text}
                    </ThemedText>
                  </View>
                ))}
              </ThemedCard>
            </Section>

            <Section title="HAPAT">
              <View style={styles.stepsList}>
                {(recipe.steps ?? []).map((step, index) => (
                  <View key={`${step}-${index}`} style={styles.stepRow}>
                    <View
                      style={[
                        styles.stepNumber,
                        { backgroundColor: theme.surfaceMuted },
                      ]}
                    >
                      <ThemedText type="smallBold" themeColor="textSecondary">
                        {index + 1}
                      </ThemedText>
                    </View>

                    <ThemedCard style={styles.stepCard}>
                      <ThemedText type="body" style={styles.stepText}>
                        {step}
                      </ThemedText>
                    </ThemedCard>
                  </View>
                ))}
              </View>
            </Section>

            {recipe.tags?.length ? (
              <Section title="ETIKETAT">
                <View style={styles.tags}>
                  {recipe.tags.map((tag) => (
                    <View
                      key={tag}
                      style={[
                        styles.tag,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <ThemedText type="smallBold" themeColor="textSecondary">
                        {tag}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </Section>
            ) : null}
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <ThemedText
        type="smallBold"
        themeColor="textSecondary"
        style={styles.sectionTitle}
      >
        {title}
      </ThemedText>

      {children}
    </View>
  );
}

function MetaPill({ icon, label }: { icon?: React.ReactNode; label: string }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.metaPill,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      {icon}

      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
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
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 48,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    alignItems: "center",
    gap: Spacing.md,
    paddingTop: Spacing.md,
  },
  heroIcon: {
    width: 76,
    height: 76,
    borderRadius: Radius.xxl,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
  },
  description: {
    textAlign: "center",
    lineHeight: 24,
  },
  metaRow: {
    marginTop: Spacing.xl,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    justifyContent: "center",
  },
  metaPill: {
    minHeight: 38,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sourceButton: {
    marginTop: Spacing.lg,
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  section: {
    marginTop: Spacing.xxl,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    letterSpacing: 0.9,
  },
  listCard: {
    padding: 0,
    overflow: "hidden",
  },
  ingredientRow: {
    minHeight: 58,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 99,
  },
  listText: {
    flex: 1,
    lineHeight: 24,
  },
  stepsList: {
    gap: Spacing.md,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  stepNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stepCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
  },
  stepText: {
    lineHeight: 25,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  tag: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  centerText: {
    textAlign: "center",
  },
});

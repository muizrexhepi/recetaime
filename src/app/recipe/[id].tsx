import {
  IconCalendarPlus,
  IconChefHat,
  IconClock,
  IconDots,
  IconExternalLink,
  IconHeart,
  IconHeartFilled,
  IconNotebook,
  IconPlus,
  IconShoppingCartPlus,
  IconUsers,
} from "@tabler/icons-react-native";
import { useMutation, useQuery } from "convex/react";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ActionSheetIOS,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyTabState } from "@/components/tabs/empty-tab-state";
import { ThemedText } from "@/components/ui/themed-text";
import { colors, Fonts, Radius, Shadows, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { type GuestRecipe, useGuestStore } from "@/stores/guest-store";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type RecipeDetail = Partial<GuestRecipe> & {
  _id?: Id<"recipes"> | string;
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
    amount?: string;
    unit?: string;
    item?: string;
    note?: string;
  }[];
  steps?: string[];
  notes?: string;
  tags?: string[];
  collectionIds?: (Id<"collections"> | string)[];
  collections?: {
    _id: Id<"collections">;
    title: string;
    color?: string;
    icon?: string;
  }[];
  isFavorite?: boolean;
  createdAt?: number;
};

export default function RecipeDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    source?: "account" | "guest";
  }>();

  const theme = useTheme();
  const { token, isAuthenticated } = useAuth();

  const guestRecipes = useGuestStore((state) => state.recipes);
  const toggleGuestFavorite =
    useGuestStore((state: any) => state.toggleFavorite) ??
    useGuestStore((state: any) => state.toggleRecipeFavorite);

  const recipeId = params.id;
  const isGuest = params.source === "guest" || !isAuthenticated;

  const accountRecipe = useQuery(
    api.recipes.getMineById,
    !isGuest && token && recipeId
      ? {
          token,
          recipeId: recipeId as Id<"recipes">,
        }
      : "skip",
  ) as RecipeDetail | null | undefined;

  const toggleFavorite = useMutation(api.recipes.toggleFavorite);
  const removeRecipe = useMutation(api.recipes.remove);

  const guestRecipe = useMemo(() => {
    if (!recipeId) return null;

    return (
      guestRecipes.find(
        (recipe) =>
          String((recipe as any)._id ?? recipe.localId) === String(recipeId),
      ) ?? null
    );
  }, [guestRecipes, recipeId]) as RecipeDetail | null;

  const recipe = isGuest ? guestRecipe : accountRecipe;

  const t = theme as any;
  const surface = t.surface ?? "#F7F6F2";
  const paper = t.paper ?? theme.background;
  const borderLight = t.borderLight ?? theme.border;
  const textSecondary = t.textSecondary ?? "#756F66";
  const textTertiary = t.textTertiary ?? textSecondary;
  const primarySoft = t.primarySoft ?? surface;

  const totalTime =
    recipe?.totalTimeMinutes ??
    ((recipe?.prepTimeMinutes ?? 0) + (recipe?.cookTimeMinutes ?? 0) ||
      undefined);

  const handleFavorite = async () => {
    if (!recipe) return;

    Haptics.selectionAsync();

    if (isGuest) {
      if (typeof toggleGuestFavorite === "function") {
        toggleGuestFavorite(recipe.localId ?? recipe._id);
      }

      return;
    }

    if (!token || !recipe._id) return;

    await toggleFavorite({
      token,
      recipeId: recipe._id as Id<"recipes">,
    });
  };

  const handleMore = () => {
    if (!recipe) return;

    Haptics.selectionAsync();

    const openSource = () => {
      if (!recipe.sourceUrl) return;
      Linking.openURL(recipe.sourceUrl);
    };

    const deleteRecipe = () => {
      Alert.alert(
        "Fshi recetën?",
        "Kjo recetë do të hiqet nga biblioteka jote.",
        [
          { text: "Anulo", style: "cancel" },
          {
            text: "Fshi",
            style: "destructive",
            onPress: async () => {
              if (!token || !recipe._id || isGuest) return;

              await removeRecipe({
                token,
                recipeId: recipe._id as Id<"recipes">,
              });

              router.back();
            },
          },
        ],
      );
    };

    const options = [
      "Shto në koleksion",
      "Shto në plan",
      "Shto në listë blerjeje",
      recipe.sourceUrl ? "Hap burimin" : null,
      !isGuest ? "Fshi recetën" : null,
      "Anulo",
    ].filter(Boolean) as string[];

    const cancelButtonIndex = options.length - 1;
    const destructiveButtonIndex = options.indexOf("Fshi recetën");

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: recipe.title,
          options,
          cancelButtonIndex,
          destructiveButtonIndex:
            destructiveButtonIndex >= 0 ? destructiveButtonIndex : undefined,
          userInterfaceStyle: "light",
        },
        (index) => {
          const selected = options[index];

          if (selected === "Shto në koleksion") openCookbookManager();
          if (selected === "Shto në plan") openAddToPlan();
          if (selected === "Shto në listë blerjeje") openAddToGroceries();
          if (selected === "Hap burimin") openSource();
          if (selected === "Fshi recetën") deleteRecipe();
        },
      );

      return;
    }

    Alert.alert(
      recipe.title,
      undefined,
      [
        { text: "Shto në koleksion", onPress: openCookbookManager },
        { text: "Shto në plan", onPress: openAddToPlan },
        { text: "Shto në listë blerjeje", onPress: openAddToGroceries },
        recipe.sourceUrl ? { text: "Hap burimin", onPress: openSource } : null,
        !isGuest
          ? {
              text: "Fshi recetën",
              style: "destructive",
              onPress: deleteRecipe,
            }
          : null,
        { text: "Anulo", style: "cancel" },
      ].filter(Boolean) as any,
    );
  };

  const openCookbookManager = () => {
    if (!recipe?._id || isGuest) {
      Alert.alert("Krijo llogari", "Koleksionet ruhen në llogarinë tënde.");
      return;
    }

    router.push({
      pathname: "/manage-recipe-cookbooks" as any,
      params: {
        recipeId: String(recipe._id),
        title: recipe.title,
      },
    });
  };

  const openAddToPlan = () => {
    if (!recipe?._id && !recipe?.localId) return;

    router.push({
      pathname: "/add-meal" as any,
      params: {
        recipeId: String(recipe._id ?? recipe.localId),
      },
    });
  };

  const openAddToGroceries = () => {
    if (!recipe?._id && !recipe?.localId) return;

    router.push({
      pathname: "/add-groceries" as any,
      params: {
        recipeId: String(recipe._id ?? recipe.localId),
      },
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "",
          headerBackTitle: "Recetat",
          headerShadowVisible: false,
          headerTransparent: true, // Absolutely positions the header over the content
          headerBlurEffect: undefined, // Let UIKit natively handle Liquid Glass on scroll
          headerTintColor: colors.textPrimary,
          headerStyle: {
            backgroundColor: "transparent",
          },
          headerTitleStyle: {
            fontFamily: Fonts.bold,
            fontSize: 17,
          },
          contentStyle: {
            backgroundColor: theme.background,
          },
          headerRight: () =>
            recipe ? (
              <View style={styles.headerActions}>
                <Pressable
                  onPress={handleFavorite}
                  hitSlop={12}
                  style={({ pressed }) => [
                    styles.headerButton,
                    { opacity: pressed ? 0.62 : 1 },
                  ]}
                >
                  {recipe.isFavorite ? (
                    <IconHeartFilled size={23} color={theme.primary} />
                  ) : (
                    <IconHeart
                      size={23}
                      color={theme.textPrimary}
                      strokeWidth={2.45}
                    />
                  )}
                </Pressable>

                <Pressable
                  onPress={handleMore}
                  hitSlop={12}
                  style={({ pressed }) => [
                    styles.headerButton,
                    { opacity: pressed ? 0.62 : 1 },
                  ]}
                >
                  <IconDots
                    size={24}
                    color={theme.textPrimary}
                    strokeWidth={2.6}
                  />
                </Pressable>
              </View>
            ) : null,
        }}
      />

      <SafeAreaView
        edges={["bottom"]}
        style={[styles.safeArea, { backgroundColor: theme.background }]}
      >
        {!recipe ? (
          <EmptyTabState
            icon={
              <IconChefHat size={42} color={theme.primary} strokeWidth={2.1} />
            }
            title="Receta nuk u gjet"
            subtitle="Kjo recetë mund të jetë fshirë ose nuk ekziston më."
          />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            contentInsetAdjustmentBehavior="automatic"
          >
            <View
              style={[
                styles.heroImage,
                {
                  backgroundColor: surface,
                  borderColor: borderLight,
                },
              ]}
            >
              {recipe.imageUrl ? (
                <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
              ) : (
                <IconChefHat
                  size={52}
                  color={theme.primary}
                  strokeWidth={2.1}
                />
              )}
            </View>

            <ThemedText style={styles.title}>{recipe.title}</ThemedText>

            {recipe.description ? (
              <ThemedText
                style={[styles.description, { color: textSecondary }]}
              >
                {recipe.description}
              </ThemedText>
            ) : null}

            <View style={styles.metaRow}>
              {recipe.servings ? (
                <MetaPill
                  icon={<IconUsers size={16} color={theme.primary} />}
                  label={`${recipe.servings} porcione`}
                />
              ) : null}

              {totalTime ? (
                <MetaPill
                  icon={<IconClock size={16} color={theme.primary} />}
                  label={`${totalTime} min`}
                />
              ) : null}

              <MetaPill
                icon={<IconNotebook size={16} color={theme.primary} />}
                label={sourceLabel(recipe.sourceType)}
              />
            </View>

            <View style={styles.quickActions}>
              <QuickAction
                icon={<IconCalendarPlus size={22} color={theme.primary} />}
                title="Plan"
                onPress={openAddToPlan}
              />

              <QuickAction
                icon={<IconShoppingCartPlus size={22} color={theme.primary} />}
                title="Listë"
                onPress={openAddToGroceries}
              />

              <QuickAction
                icon={<IconPlus size={22} color={theme.primary} />}
                title="Koleksion"
                onPress={openCookbookManager}
              />
            </View>

            {recipe.collections?.length ? (
              <View style={styles.collectionRow}>
                <ThemedText
                  style={[styles.collectionLabel, { color: textSecondary }]}
                >
                  Koleksionet
                </ThemedText>

                <View style={styles.collectionChips}>
                  {recipe.collections.map((collection) => (
                    <View
                      key={collection._id}
                      style={[
                        styles.collectionChip,
                        { backgroundColor: primarySoft },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.collectionChipText,
                          { color: theme.primary },
                        ]}
                      >
                        {collection.title}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <SectionCard
              title="Përbërësit"
              count={recipe.ingredients?.length ?? 0}
            >
              {(recipe.ingredients ?? []).map((item, index) => (
                <View
                  key={`${item.text}-${index}`}
                  style={[
                    styles.ingredientRow,
                    {
                      borderBottomColor:
                        index === (recipe.ingredients?.length ?? 0) - 1
                          ? "transparent"
                          : borderLight,
                    },
                  ]}
                >
                  <View
                    style={[styles.bullet, { backgroundColor: theme.primary }]}
                  />
                  <ThemedText style={styles.ingredientText}>
                    {item.text}
                  </ThemedText>
                </View>
              ))}
            </SectionCard>

            <SectionCard title="Hapat" count={recipe.steps?.length ?? 0}>
              {(recipe.steps ?? []).map((step, index) => (
                <View key={`${step}-${index}`} style={styles.stepRow}>
                  <View
                    style={[
                      styles.stepNumber,
                      { backgroundColor: primarySoft },
                    ]}
                  >
                    <ThemedText
                      style={[styles.stepNumberText, { color: theme.primary }]}
                    >
                      {index + 1}
                    </ThemedText>
                  </View>

                  <ThemedText style={styles.stepText}>{step}</ThemedText>
                </View>
              ))}
            </SectionCard>

            {recipe.notes ? (
              <SectionCard title="Shënime">
                <ThemedText
                  style={[styles.notesText, { color: textSecondary }]}
                >
                  {recipe.notes}
                </ThemedText>
              </SectionCard>
            ) : null}

            {recipe.sourceUrl ? (
              <Pressable
                onPress={() => Linking.openURL(recipe.sourceUrl!)}
                style={({ pressed }) => [
                  styles.sourceButton,
                  {
                    borderColor: borderLight,
                    opacity: pressed ? 0.66 : 1,
                  },
                ]}
              >
                <IconExternalLink
                  size={20}
                  color={theme.primary}
                  strokeWidth={2.4}
                />

                <ThemedText style={styles.sourceButtonText}>
                  Hap burimin origjinal
                </ThemedText>
              </Pressable>
            ) : null}
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  );
}

function MetaPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  const theme = useTheme();

  const t = theme as any;
  const primarySoft = t.primarySoft ?? "#FFF0ED";

  return (
    <View style={[styles.metaPill, { backgroundColor: primarySoft }]}>
      {icon}
      <ThemedText style={[styles.metaPillText, { color: theme.primary }]}>
        {label}
      </ThemedText>
    </View>
  );
}

function QuickAction({
  icon,
  title,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  const t = theme as any;
  const surface = t.surface ?? "#F7F6F2";
  const borderLight = t.borderLight ?? theme.border;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        {
          backgroundColor: surface,
          borderColor: borderLight,
          opacity: pressed ? 0.68 : 1,
        },
      ]}
    >
      {icon}
      <ThemedText style={styles.quickActionText}>{title}</ThemedText>
    </Pressable>
  );
}

function SectionCard({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  const theme = useTheme();

  const t = theme as any;
  const paper = t.paper ?? theme.background;
  const borderLight = t.borderLight ?? theme.border;

  return (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: paper,
          borderColor: borderLight,
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>

        {count !== undefined ? (
          <ThemedText type="subhead" themeColor="textSecondary">
            {count}
          </ThemedText>
        ) : null}
      </View>

      {children}
    </View>
  );
}

function sourceLabel(sourceType?: string) {
  if (sourceType === "instagram") return "Instagram";
  if (sourceType === "tiktok") return "TikTok";
  if (sourceType === "youtube") return "YouTube";
  if (sourceType === "photo") return "Foto";
  if (sourceType === "manual") return "Manual";
  if (sourceType === "web") return "Web";

  return "Recetë";
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: 150,
  },
  heroImage: {
    width: "100%",
    aspectRatio: 1.35,
    borderRadius: Radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.soft,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  title: {
    marginTop: Spacing.xl,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  description: {
    marginTop: Spacing.sm,
    fontSize: 17,
    lineHeight: 25,
    fontWeight: "700",
  },
  metaRow: {
    marginTop: Spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  metaPill: {
    minHeight: 36,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  metaPillText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
  },
  quickActions: {
    marginTop: Spacing.xl,
    flexDirection: "row",
    gap: Spacing.sm,
  },
  quickAction: {
    flex: 1,
    minHeight: 74,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  quickActionText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
  },
  collectionRow: {
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  collectionLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  collectionChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  collectionChip: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  collectionChipText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
  },
  sectionCard: {
    marginTop: Spacing.xl,
    borderRadius: Radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    ...Shadows.soft,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  ingredientRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bullet: {
    width: 7,
    height: 7,
    borderRadius: Radius.full,
  },
  ingredientText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
  },
  stepRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "900",
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
  },
  sourceButton: {
    marginTop: Spacing.xl,
    minHeight: 56,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  sourceButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
  },
});

import { IconChefHat, IconMenu, IconPlus } from "@tabler/icons-react-native";
import { useMutation, useQuery } from "convex/react";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ActionSheetIOS,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyTabState } from "@/components/tabs/empty-tab-state";
import { ThemedText } from "@/components/ui/themed-text";
import { colors, Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { type GuestRecipe, useGuestStore } from "@/stores/guest-store";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type RecipeLike = Partial<GuestRecipe> & {
  _id?: Id<"recipes"> | string;
  localId?: string;
  createdAt?: number;
  title: string;
  description?: string;
  sourceType?: string;
  imageUrl?: string;
};

type CookbookData = {
  collection: {
    id: string;
    kind: "collection" | "uncategorized";
    title: string;
    color: string;
    count: number;
  } | null;
  recipes: RecipeLike[];
};

export default function CookbookDetailScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();

  const cookbookId = params.id ?? "uncategorized";
  const isUncategorized = cookbookId === "uncategorized";

  const { token, isAuthenticated } = useAuth();
  const guestRecipes = useGuestStore((state) => state.recipes);

  const updateCollection = useMutation(api.collections.update);
  const removeCollection = useMutation(api.collections.remove);

  const accountData = useQuery(
    api.collections.listRecipes,
    isAuthenticated && token
      ? {
          token,
          collectionId: isUncategorized
            ? "uncategorized"
            : (cookbookId as Id<"collections">),
        }
      : "skip",
  ) as CookbookData | undefined;

  const guestRecipesForCollection = useMemo(() => {
    if (!isUncategorized) return [];

    return guestRecipes.filter(
      (recipe) => !recipe.collectionIds || recipe.collectionIds.length === 0,
    ) as RecipeLike[];
  }, [guestRecipes, isUncategorized]);

  const collectionTitle = isAuthenticated
    ? (accountData?.collection?.title ?? "Koleksion")
    : "Pa kategori";

  const recipes = (
    isAuthenticated ? (accountData?.recipes ?? []) : guestRecipesForCollection
  ) as RecipeLike[];

  const sortedRecipes = useMemo(() => {
    return [...recipes].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }, [recipes]);

  const openAddRecipes = () => {
    Haptics.selectionAsync();

    if (isUncategorized) return;

    router.push({
      pathname: "/add-to-cookbook" as any,
      params: {
        collectionId: cookbookId,
        title: collectionTitle,
      },
    });
  };

  const openRecipe = (recipe: RecipeLike) => {
    const id = recipe._id ?? recipe.localId;

    if (!id) return;

    router.push({
      pathname: "/recipe/[id]",
      params: {
        id,
        source: isAuthenticated ? "account" : "guest",
      },
    } as any);
  };

  const openCollectionMenu = () => {
    Haptics.selectionAsync();

    if (isUncategorized || !token) return;

    const rename = () => {
      if (Platform.OS !== "ios") {
        Alert.alert("Riemërto", "Për Android do ta lidhim me modal më vonë.");
        return;
      }

      Alert.prompt(
        "Riemërto koleksionin",
        undefined,
        [
          { text: "Anulo", style: "cancel" },
          {
            text: "Ruaj",
            onPress: (value?: string) => {
              const title = value?.trim();
              if (!title) return;

              void updateCollection({
                token,
                collectionId: cookbookId as Id<"collections">,
                title,
              });
            },
          },
        ],
        "plain-text",
        collectionTitle,
      );
    };

    const remove = () => {
      Alert.alert(
        "Fshi koleksionin?",
        "Recetat nuk do të fshihen. Vetëm koleksioni do të hiqet.",
        [
          { text: "Anulo", style: "cancel" },
          {
            text: "Fshi",
            style: "destructive",
            onPress: async () => {
              await removeCollection({
                token,
                collectionId: cookbookId as Id<"collections">,
              });

              router.back();
            },
          },
        ],
      );
    };

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: collectionTitle,
          options: ["Riemërto", "Fshi koleksionin", "Anulo"],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 2,
          userInterfaceStyle: "light",
        },
        (index) => {
          if (index === 0) rename();
          if (index === 1) remove();
        },
      );

      return;
    }

    Alert.alert(collectionTitle, undefined, [
      { text: "Riemërto", onPress: rename },
      { text: "Fshi koleksionin", style: "destructive", onPress: remove },
      { text: "Anulo", style: "cancel" },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: collectionTitle,
          headerBackTitle: "Recetat",
          headerShadowVisible: false,
          headerTintColor: colors.textPrimary,
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerTitleStyle: {
            fontFamily: Fonts.bold,
            fontSize: 17,
          },
          contentStyle: {
            backgroundColor: theme.background,
          },
          headerRight: () =>
            isUncategorized ? null : (
              <View style={styles.headerActions}>
                <Pressable
                  onPress={openAddRecipes}
                  hitSlop={12}
                  style={({ pressed }) => [
                    styles.headerActionButton,
                    { opacity: pressed ? 0.62 : 1 },
                  ]}
                >
                  <IconPlus size={23} color={theme.primary} strokeWidth={2.6} />
                </Pressable>

                <Pressable
                  onPress={openCollectionMenu}
                  hitSlop={12}
                  style={({ pressed }) => [
                    styles.headerActionButton,
                    { opacity: pressed ? 0.62 : 1 },
                  ]}
                >
                  <IconMenu
                    size={24}
                    color={theme.textPrimary}
                    strokeWidth={2.6}
                  />
                </Pressable>
              </View>
            ),
        }}
      />

      <SafeAreaView
        edges={["bottom"]}
        style={[styles.safeArea, { backgroundColor: theme.background }]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {sortedRecipes.length > 0 ? (
            <View style={styles.recipeGrid}>
              {sortedRecipes.map((recipe) => (
                <RecipeGridCard
                  key={String(recipe._id ?? recipe.localId ?? recipe.title)}
                  recipe={recipe}
                  onPress={() => openRecipe(recipe)}
                />
              ))}
            </View>
          ) : (
            <EmptyTabState
              icon={
                <IconChefHat
                  size={42}
                  color={theme.primary}
                  strokeWidth={2.1}
                />
              }
              title="Nuk ka receta këtu"
              subtitle={
                isUncategorized
                  ? "Recetat pa koleksion do të shfaqen këtu."
                  : "Shto receta në këtë koleksion me butonin plus."
              }
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function RecipeGridCard({
  recipe,
  onPress,
}: {
  recipe: RecipeLike;
  onPress: () => void;
}) {
  const theme = useTheme();

  const t = theme as any;
  const surface = t.surface ?? "#F7F6F2";
  const borderLight = t.borderLight ?? theme.border;
  const textSecondary = t.textSecondary ?? "#756F66";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.recipeCard,
        {
          opacity: pressed ? 0.75 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <View
        style={[
          styles.recipeImageWrap,
          {
            backgroundColor: surface,
            borderColor: borderLight,
          },
        ]}
      >
        {recipe.imageUrl ? (
          <Image source={{ uri: recipe.imageUrl }} style={styles.recipeImage} />
        ) : (
          <IconChefHat size={34} color={theme.primary} strokeWidth={2.1} />
        )}
      </View>

      <ThemedText style={styles.recipeTitle} numberOfLines={2}>
        {recipe.title || "Recetë e re"}
      </ThemedText>

      <ThemedText
        style={[styles.recipeMeta, { color: textSecondary }]}
        numberOfLines={1}
      >
        {sourceLabel(recipe.sourceType)}
      </ThemedText>
    </Pressable>
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
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: 140,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  headerActionButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  recipeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: Spacing.xl,
  },
  recipeCard: {
    width: "47%",
  },
  recipeImageWrap: {
    aspectRatio: 1,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  recipeImage: {
    width: "100%",
    height: "100%",
  },
  recipeTitle: {
    marginTop: Spacing.sm,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
  },
  recipeMeta: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
});

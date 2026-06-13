import { IconCheck, IconChefHat, IconX } from "@tabler/icons-react-native";
import { useMutation, useQuery } from "convex/react";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedText } from "@/components/ui/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type RecipeLike = {
  _id: Id<"recipes">;
  title: string;
  description?: string;
  sourceType?: string;
  imageUrl?: string;
  collectionIds?: Id<"collections">[];
};

export default function AddToCookbookScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{
    collectionId?: string;
    title?: string;
  }>();

  const { token, isAuthenticated } = useAuth();

  const collectionId = params.collectionId as Id<"collections"> | undefined;
  const collectionTitle = params.title ?? "Koleksion";

  const [selectedIds, setSelectedIds] = useState<Id<"recipes">[]>([]);

  const recipes = useQuery(
    api.recipes.listMine,
    isAuthenticated && token ? { token } : "skip",
  ) as RecipeLike[] | undefined;

  const addRecipeToCollection = useMutation(
    api.collections.addRecipeToCollection,
  );

  const availableRecipes = useMemo(() => {
    if (!collectionId) return [];

    return (recipes ?? []).filter(
      (recipe) =>
        !recipe.collectionIds?.some(
          (id) => String(id) === String(collectionId),
        ),
    );
  }, [collectionId, recipes]);

  const toggleRecipe = (recipeId: Id<"recipes">) => {
    Haptics.selectionAsync();

    setSelectedIds((prev) =>
      prev.some((id) => id === recipeId)
        ? prev.filter((id) => id !== recipeId)
        : [...prev, recipeId],
    );
  };

  const close = () => {
    Haptics.selectionAsync();
    router.back();
  };

  const submit = async () => {
    if (!token || !collectionId || selectedIds.length === 0) return;

    try {
      await Promise.all(
        selectedIds.map((recipeId) =>
          addRecipeToCollection({
            token,
            recipeId,
            collectionId,
          }),
        ),
      );

      router.back();
    } catch {
      Alert.alert("Nuk u shtuan", "Provo përsëri pas pak.");
    }
  };

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <Pressable
          onPress={close}
          hitSlop={12}
          style={({ pressed }) => [
            styles.closeButton,
            {
              backgroundColor: theme.surface,
              opacity: pressed ? 0.72 : 1,
            },
          ]}
        >
          <IconX size={25} color={theme.textPrimary} strokeWidth={2.7} />
        </Pressable>

        <View style={styles.headerCopy}>
          <ThemedText style={styles.title}>Shto receta</ThemedText>
          <ThemedText type="subhead" themeColor="textSecondary">
            {collectionTitle}
          </ThemedText>
        </View>

        <View style={styles.closeSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {availableRecipes.length > 0 ? (
          availableRecipes.map((recipe) => (
            <RecipeSelectRow
              key={recipe._id}
              recipe={recipe}
              selected={selectedIds.some((id) => id === recipe._id)}
              onPress={() => toggleRecipe(recipe._id)}
            />
          ))
        ) : (
          <View style={styles.empty}>
            <IconChefHat size={42} color={theme.primary} strokeWidth={2.1} />

            <ThemedText style={styles.emptyTitle}>
              Nuk ka receta për të shtuar
            </ThemedText>

            <ThemedText
              type="body"
              themeColor="textSecondary"
              style={styles.emptyText}
            >
              Të gjitha recetat janë tashmë në këtë koleksion.
            </ThemedText>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <ThemedButton
          title={
            selectedIds.length > 0
              ? `Shto ${selectedIds.length} receta`
              : "Zgjidh receta"
          }
          disabled={selectedIds.length === 0}
          onPress={submit}
        />
      </View>
    </SafeAreaView>
  );
}

function RecipeSelectRow({
  recipe,
  selected,
  onPress,
}: {
  recipe: RecipeLike;
  selected: boolean;
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
        styles.recipeRow,
        {
          borderColor: selected ? theme.primary : borderLight,
          opacity: pressed ? 0.78 : 1,
        },
      ]}
    >
      <View style={[styles.recipeImageWrap, { backgroundColor: surface }]}>
        {recipe.imageUrl ? (
          <Image source={{ uri: recipe.imageUrl }} style={styles.recipeImage} />
        ) : (
          <IconChefHat size={25} color={theme.primary} strokeWidth={2.1} />
        )}
      </View>

      <View style={styles.recipeCopy}>
        <ThemedText style={styles.recipeTitle} numberOfLines={2}>
          {recipe.title}
        </ThemedText>

        <ThemedText style={[styles.recipeMeta, { color: textSecondary }]}>
          {sourceLabel(recipe.sourceType)}
        </ThemedText>
      </View>

      <View
        style={[
          styles.checkBox,
          {
            backgroundColor: selected ? theme.primary : "transparent",
            borderColor: selected ? theme.primary : borderLight,
          },
        ]}
      >
        {selected ? (
          <IconCheck size={21} color="#FFFFFF" strokeWidth={3} />
        ) : null}
      </View>
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
  header: {
    height: 84,
    paddingHorizontal: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  closeSpacer: {
    width: 48,
  },
  headerCopy: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 140,
    gap: Spacing.md,
  },
  recipeRow: {
    minHeight: 96,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  recipeImageWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  recipeImage: {
    width: "100%",
    height: "100%",
  },
  recipeCopy: {
    flex: 1,
    gap: 3,
  },
  recipeTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
  },
  recipeMeta: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },
  checkBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    paddingTop: Spacing.xxxl,
    alignItems: "center",
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    backgroundColor: "rgba(250,250,250,0.96)",
  },
});

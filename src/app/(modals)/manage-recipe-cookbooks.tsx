import { IconCheck, IconFolder, IconX } from "@tabler/icons-react-native";
import { useMutation, useQuery } from "convex/react";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedText } from "@/components/ui/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type CollectionLike = {
  id: Id<"collections"> | string;
  kind: "collection" | "uncategorized";
  title: string;
  color: string;
  count: number;
};

export default function ManageRecipeCookbooksScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{
    recipeId?: string;
    title?: string;
  }>();

  const recipeId = params.recipeId as Id<"recipes"> | undefined;
  const recipeTitle = params.title ?? "Recetë";

  const { token, isAuthenticated } = useAuth();

  const recipe = useQuery(
    api.recipes.getMineById,
    isAuthenticated && token && recipeId
      ? {
          token,
          recipeId,
        }
      : "skip",
  ) as
    | {
        collectionIds?: Id<"collections">[];
      }
    | null
    | undefined;

  const collections = useQuery(
    api.collections.listMineWithCounts,
    isAuthenticated && token ? { token } : "skip",
  ) as CollectionLike[] | undefined;

  const setRecipeCollections = useMutation(
    api.collections.setRecipeCollections,
  );

  const realCollections = useMemo(() => {
    return (collections ?? []).filter(
      (collection) => collection.kind === "collection",
    );
  }, [collections]);

  const [selectedIds, setSelectedIds] = useState<Id<"collections">[]>([]);

  useEffect(() => {
    if (!recipe?.collectionIds) return;
    setSelectedIds(recipe.collectionIds);
  }, [recipe?.collectionIds]);

  const close = () => {
    Haptics.selectionAsync();
    router.back();
  };

  const toggleCollection = (id: Id<"collections">) => {
    Haptics.selectionAsync();

    setSelectedIds((prev) =>
      prev.some((selectedId) => selectedId === id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id],
    );
  };

  const submit = async () => {
    if (!token || !recipeId) return;

    try {
      await setRecipeCollections({
        token,
        recipeId,
        collectionIds: selectedIds,
      });

      router.back();
    } catch {
      Alert.alert("Nuk u ruajt", "Provo përsëri pas pak.");
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
          <ThemedText style={styles.title}>Koleksionet</ThemedText>
          <ThemedText
            type="subhead"
            themeColor="textSecondary"
            numberOfLines={1}
          >
            {recipeTitle}
          </ThemedText>
        </View>

        <View style={styles.closeSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {realCollections.length > 0 ? (
          realCollections.map((collection) => {
            const selected = selectedIds.some(
              (id) => String(id) === String(collection.id),
            );

            return (
              <CollectionRow
                key={String(collection.id)}
                collection={collection}
                selected={selected}
                onPress={() =>
                  toggleCollection(collection.id as Id<"collections">)
                }
              />
            );
          })
        ) : (
          <View style={styles.empty}>
            <IconFolder size={42} color={theme.primary} strokeWidth={2.1} />

            <ThemedText style={styles.emptyTitle}>
              Nuk ke koleksione ende
            </ThemedText>

            <ThemedText
              type="body"
              themeColor="textSecondary"
              style={styles.emptyText}
            >
              Krijo një koleksion nga faqja Recetat, pastaj kthehu këtu.
            </ThemedText>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <ThemedButton title="Ruaj" onPress={submit} disabled={!recipeId} />
      </View>
    </SafeAreaView>
  );
}

function CollectionRow({
  collection,
  selected,
  onPress,
}: {
  collection: CollectionLike;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  const t = theme as any;
  const borderLight = t.borderLight ?? theme.border;
  const textSecondary = t.textSecondary ?? "#756F66";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.collectionRow,
        {
          borderColor: selected ? theme.primary : borderLight,
          opacity: pressed ? 0.78 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.collectionIcon,
          {
            backgroundColor: collection.color,
          },
        ]}
      >
        <IconFolder size={23} color="#FFFFFF" strokeWidth={2.25} />
      </View>

      <View style={styles.collectionCopy}>
        <ThemedText style={styles.collectionTitle}>
          {collection.title}
        </ThemedText>

        <ThemedText style={[styles.collectionMeta, { color: textSecondary }]}>
          {formatRecipeCount(collection.count)}
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

function formatRecipeCount(count: number) {
  if (count === 0) return "0 receta";
  if (count === 1) return "1 recetë";

  return `${count} receta`;
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
  collectionRow: {
    minHeight: 82,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  collectionIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  collectionCopy: {
    flex: 1,
    gap: 2,
  },
  collectionTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
  },
  collectionMeta: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },
  checkBox: {
    width: 42,
    height: 42,
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

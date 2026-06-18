import { Divider, Host, Menu, Button as NativeButton } from "@expo/ui/swift-ui";
import { buttonStyle } from "@expo/ui/swift-ui/modifiers";
import {
  IconBoltFilled,
  IconChefHat,
  IconFolder,
  IconFolders,
  IconPlus,
  IconStarFilled,
} from "@tabler/icons-react-native";
import { useMutation, useQuery } from "convex/react";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import {
  ImportUsageSheet,
  type ImportUsageSheetRef,
  type ImportUsageSummary,
} from "@/components/sheets/import-usage-sheet";
import { EmptyTabState } from "@/components/tabs/empty-tab-state";
import { TabScreen } from "@/components/tabs/tab-screen";
import { TabScreenHeader } from "@/components/tabs/tab-screen-header";
import { ThemedText } from "@/components/ui/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { useGuestStore, type GuestRecipe } from "@/stores/guest-store";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type ViewMode = "recipes" | "collections";

type LibraryFilter =
  | { type: "all" }
  | { type: "favorites" }
  | { type: "uncategorized" }
  | { type: "collection"; id: string; label: string };

type CollectionCardLike = {
  id: "uncategorized" | Id<"collections"> | string;
  kind: "uncategorized" | "collection";
  title: string;
  color: string;
  icon?: string;
  count: number;
  recentRecipes?: {
    _id?: Id<"recipes"> | string;
    title: string;
    imageUrl?: string;
    imageThumbnailUrl?: string;
  }[];
};

type RecipeLike = Partial<GuestRecipe> & {
  _id?: Id<"recipes"> | string;
  localId?: string;
  createdAt?: number;
  title: string;
  description?: string;
  sourceType?: string;
  imageUrl?: string;
  imageThumbnailUrl?: string;
  collectionIds?: (Id<"collections"> | string)[];
  ingredients?: { text: string }[];
  steps?: string[];
  tags?: string[];
  isFavorite?: boolean;
};

const COLLECTION_COLORS = [
  "#EF4A38",
  "#4F8FEA",
  "#8B6FE8",
  "#8FD36B",
  "#F2B84B",
  "#F27C38",
];

export default function CookbooksIndexScreen() {
  const router = useRouter();
  const theme = useTheme();

  const usageSheetRef = useRef<ImportUsageSheetRef>(null);

  const { token, isAuthenticated } = useAuth();
  const guestRecipes = useGuestStore((state) => state.recipes);
  const guestId = useGuestStore((state) => state.guestId);

  const [viewMode, setViewMode] = useState<ViewMode>("recipes");
  const [filter, setFilter] = useState<LibraryFilter>({ type: "all" });

  const accountRecipes = useQuery(
    api.recipes.listMine,
    isAuthenticated && token ? { token } : "skip",
  ) as RecipeLike[] | undefined;

  const accountCollections = useQuery(
    api.collections.listMineWithCounts,
    isAuthenticated && token ? { token } : "skip",
  ) as CollectionCardLike[] | undefined;

  const usage = useQuery(
    api.importUsage.getWeeklyUsage,
    isAuthenticated && token ? { token } : { guestId },
  ) as ImportUsageSummary | undefined;

  const createCollection = useMutation(api.collections.create);

  const recipes = (
    isAuthenticated ? (accountRecipes ?? []) : guestRecipes
  ) as RecipeLike[];

  const collections = useMemo(() => {
    if (isAuthenticated) return accountCollections ?? [];

    return buildGuestCollections(recipes);
  }, [accountCollections, isAuthenticated, recipes]);

  const realCollections = useMemo(
    () => collections.filter((collection) => collection.kind === "collection"),
    [collections],
  );

  const filteredRecipes = useMemo(() => {
    return recipes
      .filter((recipe) => {
        if (filter.type === "all") return true;

        if (filter.type === "favorites") {
          return Boolean(recipe.isFavorite);
        }

        if (filter.type === "uncategorized") {
          return !recipe.collectionIds || recipe.collectionIds.length === 0;
        }

        if (filter.type === "collection") {
          return recipe.collectionIds?.some(
            (id) => String(id) === String(filter.id),
          );
        }

        return true;
      })
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }, [filter, recipes]);

  const isLoading =
    isAuthenticated &&
    token &&
    (accountRecipes === undefined || accountCollections === undefined);

  const activeLabel =
    viewMode === "collections" ? "Koleksionet" : getFilterLabel(filter);

  const openUsage = () => {
    void Haptics.selectionAsync();
    usageSheetRef.current?.present();
  };

  const openPaywall = () => {
    router.push("/paywall" as any);
  };

  const openImport = () => {
    void Haptics.selectionAsync();

    router.push({
      pathname: "/import-recipe",
      params: { mode: "link" },
    } as any);
  };

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

  const openCollection = (collection: CollectionCardLike) => {
    void Haptics.selectionAsync();

    router.push({
      pathname: "/cookbook/[id]",
      params: {
        id: String(collection.id),
      },
    } as any);
  };

  const applyFilter = useCallback(
    (nextFilter: LibraryFilter, nextMode: ViewMode = "recipes") => {
      void Haptics.selectionAsync();
      setViewMode(nextMode);
      setFilter(nextFilter);
    },
    [],
  );

  const showCollections = useCallback(() => {
    void Haptics.selectionAsync();
    setViewMode("collections");
  }, []);

  const handleCreateCollection = useCallback(() => {
    void Haptics.selectionAsync();

    if (!isAuthenticated || !token) {
      Alert.alert(
        "Krijo llogari",
        "Krijo llogari për të krijuar koleksione dhe për t’i ruajtur në cloud.",
        [
          { text: "Anulo", style: "cancel" },
          {
            text: "Krijo llogari",
            onPress: () => router.push("/onboarding/create-account" as any),
          },
        ],
      );

      return;
    }

    if (Platform.OS === "ios") {
      Alert.prompt(
        "Koleksion i ri",
        "Shkruaj emrin e koleksionit.",
        [
          { text: "Anulo", style: "cancel" },
          {
            text: "Krijo",
            onPress: (value?: string) => {
              const title = value?.trim();
              if (!title) return;

              void createCollection({
                token,
                title,
                color:
                  COLLECTION_COLORS[
                    Math.floor(Math.random() * COLLECTION_COLORS.length)
                  ],
              });
            },
          },
        ],
        "plain-text",
        "",
        "default",
      );

      return;
    }

    Alert.alert(
      "Koleksion i ri",
      "Për Android do ta lidhim me modal të veçantë më vonë.",
    );
  }, [createCollection, isAuthenticated, router, token]);

  return (
    <>
      <TabScreen>
        <TabScreenHeader
          title="Recetat"
          right={
            <Pressable
              onPress={openUsage}
              hitSlop={12}
              style={({ pressed }) => [
                styles.usagePill,
                { opacity: pressed ? 0.72 : 1 },
              ]}
            >
              <IconBoltFilled size={17} color={theme.primary} />

              <ThemedText style={[styles.usageText, { color: theme.primary }]}>
                {formatUsageLabel(usage)}
              </ThemedText>
            </Pressable>
          }
        />

        <View style={styles.filterHeader}>
          <FilterTitleMenu
            activeLabel={activeLabel}
            filter={filter}
            viewMode={viewMode}
            realCollections={realCollections}
            onAll={() => applyFilter({ type: "all" })}
            onFavorites={() => applyFilter({ type: "favorites" })}
            onUncategorized={() => applyFilter({ type: "uncategorized" })}
            onCollections={showCollections}
            onCollection={(collection) =>
              applyFilter({
                type: "collection",
                id: String(collection.id),
                label: collection.title,
              })
            }
            onCreateCollection={handleCreateCollection}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {isLoading ? (
            <View style={styles.loadingState}>
              <ThemedText type="body" themeColor="textSecondary">
                Duke i ngarkuar recetat...
              </ThemedText>
            </View>
          ) : recipes.length === 0 ? (
            <View style={styles.emptyWrap}>
              <EmptyTabState
                icon={
                  <IconChefHat
                    size={42}
                    color={theme.primary}
                    strokeWidth={2.1}
                  />
                }
                title="Asnjë recetë ende"
                subtitle="Shto recetën e parë nga link, foto, screenshot ose tekst."
              />

              <Pressable
                onPress={openImport}
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
            </View>
          ) : viewMode === "collections" ? (
            <View style={styles.folderGrid}>
              {collections.map((collection) => (
                <FolderCard
                  key={String(collection.id)}
                  collection={collection}
                  onPress={() => openCollection(collection)}
                />
              ))}
            </View>
          ) : filteredRecipes.length > 0 ? (
            <View style={styles.recipeGrid}>
              {filteredRecipes.map((recipe) => (
                <RecipeGridCard
                  key={getRecipeKey(recipe)}
                  recipe={recipe}
                  onPress={() => openRecipe(recipe)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyFiltered}>
              <IconChefHat
                size={42}
                color={theme.textTertiary}
                strokeWidth={2.1}
              />

              <ThemedText type="bodyMedium" themeColor="textSecondary">
                Nuk ka receta me këtë filtër.
              </ThemedText>
            </View>
          )}
        </ScrollView>
      </TabScreen>

      <ImportUsageSheet
        ref={usageSheetRef}
        usage={usage}
        onUnlock={openPaywall}
      />
    </>
  );
}

function FilterTitleMenu({
  activeLabel,
  filter,
  viewMode,
  realCollections,
  onAll,
  onFavorites,
  onUncategorized,
  onCollections,
  onCollection,
  onCreateCollection,
}: {
  activeLabel: string;
  filter: LibraryFilter;
  viewMode: ViewMode;
  realCollections: CollectionCardLike[];
  onAll: () => void;
  onFavorites: () => void;
  onUncategorized: () => void;
  onCollections: () => void;
  onCollection: (collection: CollectionCardLike) => void;
  onCreateCollection: () => void;
}) {
  const isAllSelected = viewMode === "recipes" && filter.type === "all";
  const isFavoritesSelected =
    viewMode === "recipes" && filter.type === "favorites";
  const isUncategorizedSelected =
    viewMode === "recipes" && filter.type === "uncategorized";
  const isCollectionsSelected = viewMode === "collections";

  return (
    <Host style={styles.filterMenuHost}>
      <Menu
        label={activeLabel}
        systemImage="chevron.down"
        modifiers={[buttonStyle("plain")]}
      >
        <NativeButton
          label="Të gjitha"
          systemImage={isAllSelected ? "checkmark" : "fork.knife"}
          onPress={onAll}
        />

        <NativeButton
          label="Favoritet"
          systemImage={isFavoritesSelected ? "checkmark" : "heart"}
          onPress={onFavorites}
        />

        <NativeButton
          label="Pa kategori"
          systemImage={isUncategorizedSelected ? "checkmark" : "folder"}
          onPress={onUncategorized}
        />

        <NativeButton
          label="Koleksionet"
          systemImage={isCollectionsSelected ? "checkmark" : "square.stack"}
          onPress={onCollections}
        />

        {realCollections.length > 0 ? <Divider /> : null}

        {realCollections.map((collection) => {
          const isSelected =
            viewMode === "recipes" &&
            filter.type === "collection" &&
            String(filter.id) === String(collection.id);

          return (
            <NativeButton
              key={String(collection.id)}
              label={collection.title}
              systemImage={isSelected ? "checkmark" : "folder.fill"}
              onPress={() => onCollection(collection)}
            />
          );
        })}

        <Divider />

        <NativeButton
          label="Krijo koleksion"
          systemImage="plus"
          onPress={onCreateCollection}
        />
      </Menu>
    </Host>
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
  const [imageFailed, setImageFailed] = useState(false);

  const t = theme as any;
  const surface = t.surface ?? "#F7F6F2";
  const borderLight = t.borderLight ?? theme.border;
  const textTertiary = t.textTertiary ?? "#A8A096";
  const imageSource = imageFailed ? undefined : getRecipeImageSource(recipe);

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
        {imageSource ? (
          <>
            <Image
              source={{ uri: imageSource }}
              style={styles.recipeImage}
              contentFit="cover"
              transition={180}
              onError={() => setImageFailed(true)}
            />
            <View style={styles.recipeImageOverlay} />
          </>
        ) : (
          <IconChefHat size={31} color={textTertiary} strokeWidth={2.1} />
        )}

        {recipe.isFavorite ? (
          <View style={styles.favoriteBadge}>
            <IconStarFilled size={14} color="#FFFFFF" />
          </View>
        ) : null}
      </View>

      <ThemedText style={styles.recipeTitle} numberOfLines={2}>
        {recipe.title || "Recetë e re"}
      </ThemedText>
    </Pressable>
  );
}

function FolderCard({
  collection,
  onPress,
}: {
  collection: CollectionCardLike;
  onPress: () => void;
}) {
  const theme = useTheme();

  const color = collection.color;
  const darker = shadeColor(color, -18);
  const t = theme as any;
  const textSecondary = t.textSecondary ?? "#756F66";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.folderCard,
        {
          opacity: pressed ? 0.76 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <View style={styles.folderArt}>
        <View style={[styles.folderBack, { backgroundColor: darker }]} />
        <View style={[styles.folderTab, { backgroundColor: color }]} />
        <View style={[styles.folderFront, { backgroundColor: color }]} />

        <View style={styles.folderIconOverlay}>
          {collection.kind === "uncategorized" ? (
            <IconFolder size={24} color="#FFFFFF" strokeWidth={2.3} />
          ) : (
            <IconFolders size={24} color="#FFFFFF" strokeWidth={2.3} />
          )}
        </View>
      </View>

      <ThemedText style={styles.folderTitle} numberOfLines={1}>
        {collection.title}
      </ThemedText>

      <ThemedText style={[styles.folderCount, { color: textSecondary }]}>
        {formatRecipeCount(collection.count)}
      </ThemedText>
    </Pressable>
  );
}

function getRecipeImageSource(recipe: RecipeLike) {
  const value = recipe.imageThumbnailUrl ?? recipe.imageUrl;

  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function buildGuestCollections(recipes: RecipeLike[]) {
  const uncategorized = recipes.filter(
    (recipe) => !recipe.collectionIds || recipe.collectionIds.length === 0,
  ).length;

  return [
    {
      id: "uncategorized",
      kind: "uncategorized" as const,
      title: "Pa kategori",
      color: "#8B6FE8",
      count: uncategorized,
    },
  ];
}

function getRecipeId(recipe: RecipeLike) {
  return recipe._id ?? recipe.localId;
}

function getRecipeKey(recipe: RecipeLike) {
  return String(getRecipeId(recipe) ?? recipe.title);
}

function getFilterLabel(filter: LibraryFilter) {
  if (filter.type === "all") return "Të gjitha";
  if (filter.type === "favorites") return "Favoritet";
  if (filter.type === "uncategorized") return "Pa kategori";
  if (filter.type === "collection") return filter.label;

  return "Të gjitha";
}

function formatUsageLabel(usage?: ImportUsageSummary) {
  if (!usage) return "5/5";
  if (usage.hasUnlimited) return "Pro";

  return `${usage.remaining ?? 0}/${usage.limit}`;
}

function formatRecipeCount(count: number) {
  if (count === 0) return "0 receta";
  if (count === 1) return "1 recetë";

  return `${count} receta`;
}

function shadeColor(hex: string, percent: number) {
  const cleanHex = hex.replace("#", "");
  const number = parseInt(cleanHex, 16);

  if (Number.isNaN(number) || cleanHex.length !== 6) return hex;

  const amount = Math.round(2.55 * percent);
  const red = Math.max(0, Math.min(255, (number >> 16) + amount));
  const green = Math.max(0, Math.min(255, ((number >> 8) & 0xff) + amount));
  const blue = Math.max(0, Math.min(255, (number & 0xff) + amount));

  return `#${(0x1000000 + red * 0x10000 + green * 0x100 + blue)
    .toString(16)
    .slice(1)}`;
}

const styles = StyleSheet.create({
  usagePill: {
    minHeight: 42,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "rgba(255, 240, 237, 0.86)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(239, 74, 56, 0.14)",
  },
  usageText: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "900",
  },
  filterHeader: {
    marginTop: -Spacing.sm,
    marginBottom: Spacing.lg,
    alignSelf: "flex-start",
  },
  filterMenuHost: {
    minWidth: 140,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  content: {
    paddingTop: Spacing.sm,
    paddingBottom: 150,
  },
  loadingState: {
    marginTop: Spacing.xxxl,
    alignItems: "center",
  },
  emptyWrap: {
    paddingTop: Spacing.xl,
  },
  primaryAction: {
    marginTop: Spacing.xl,
    minHeight: 58,
    borderRadius: Radius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900",
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
    aspectRatio: 4 / 5,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  recipeImage: {
    width: "100%",
    height: "100%",
  },
  recipeImageOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "42%",
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  favoriteBadge: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    backgroundColor: "#EF4A38",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
  },
  recipeTitle: {
    marginTop: Spacing.sm,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
    letterSpacing: -0.15,
  },
  folderGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: Spacing.xl,
  },
  folderCard: {
    width: "47%",
  },
  folderArt: {
    height: 104,
    marginBottom: Spacing.md,
  },
  folderBack: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 88,
    borderRadius: Radius.xl,
  },
  folderTab: {
    position: "absolute",
    left: 28,
    top: 0,
    width: 82,
    height: 36,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
  },
  folderFront: {
    position: "absolute",
    left: 0,
    right: 12,
    bottom: 8,
    height: 82,
    borderRadius: Radius.xl,
  },
  folderIconOverlay: {
    position: "absolute",
    left: 14,
    bottom: 20,
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.24)",
    alignItems: "center",
    justifyContent: "center",
  },
  folderTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900",
  },
  folderCount: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },
  emptyFiltered: {
    paddingTop: Spacing.xxxl,
    alignItems: "center",
    gap: Spacing.md,
  },
});

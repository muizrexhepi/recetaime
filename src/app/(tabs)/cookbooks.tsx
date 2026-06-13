import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import {
  IconBoltFilled,
  IconCheck,
  IconChefHat,
  IconChevronDown,
  IconDots,
  IconFolder,
  IconFolders,
  IconHeart,
  IconPlus,
  IconStarFilled,
} from "@tabler/icons-react-native";
import { useMutation, useQuery } from "convex/react";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
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
  const filterSheetRef = useRef<BottomSheetModal>(null);

  const { token, isAuthenticated } = useAuth();
  const guestRecipes = useGuestStore((state) => state.recipes);

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
    isAuthenticated && token ? { token } : "skip",
  ) as ImportUsageSummary | undefined;

  const createCollection = useMutation(api.collections.create);

  const recipes = (
    isAuthenticated ? (accountRecipes ?? []) : guestRecipes
  ) as RecipeLike[];

  const collections = useMemo(() => {
    if (isAuthenticated) return accountCollections ?? [];
    return buildGuestCollections(recipes);
  }, [accountCollections, isAuthenticated, recipes]);

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

  const activeCount =
    viewMode === "collections"
      ? formatCollectionCount(collections.length)
      : formatRecipeCount(filteredRecipes.length);

  const openUsage = () => {
    Haptics.selectionAsync();
    usageSheetRef.current?.present();
  };

  const openFilterSheet = () => {
    Haptics.selectionAsync();
    filterSheetRef.current?.present();
  };

  const closeFilterSheet = () => {
    filterSheetRef.current?.dismiss();
  };

  const openPaywall = () => {
    router.push("/paywall" as any);
  };

  const openImport = () => {
    Haptics.selectionAsync();

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
    Haptics.selectionAsync();

    router.push({
      pathname: "/cookbook/[id]",
      params: {
        id: String(collection.id),
      },
    } as any);
  };

  const applyFilter = (
    nextFilter: LibraryFilter,
    nextMode: ViewMode = "recipes",
  ) => {
    Haptics.selectionAsync();
    setViewMode(nextMode);
    setFilter(nextFilter);
    closeFilterSheet();
  };

  const showCollections = () => {
    Haptics.selectionAsync();
    setViewMode("collections");
    closeFilterSheet();
  };

  const handleCreateCollection = () => {
    Haptics.selectionAsync();
    closeFilterSheet();

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
            onPress: (value) => {
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
  };

  return (
    <>
      <TabScreen>
        <TabScreenHeader
          title="Recetat"
          right={
            <View style={styles.headerActions}>
              <Pressable
                onPress={openUsage}
                hitSlop={12}
                style={({ pressed }) => [
                  styles.usagePill,
                  { opacity: pressed ? 0.72 : 1 },
                ]}
              >
                <IconBoltFilled size={17} color={theme.primary} />

                <ThemedText
                  style={[styles.usageText, { color: theme.primary }]}
                >
                  {formatUsageLabel(usage)}
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={openFilterSheet}
                hitSlop={12}
                style={({ pressed }) => [
                  styles.headerIconButton,
                  { opacity: pressed ? 0.72 : 1 },
                ]}
              >
                <IconDots
                  size={23}
                  color={theme.textPrimary}
                  strokeWidth={2.6}
                />
              </Pressable>
            </View>
          }
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <Pressable
            onPress={openFilterSheet}
            hitSlop={10}
            style={({ pressed }) => [
              styles.stateBlock,
              { opacity: pressed ? 0.72 : 1 },
            ]}
          >
            <View style={styles.stateTitleRow}>
              <ThemedText style={styles.stateTitle} numberOfLines={1}>
                {activeLabel}
              </ThemedText>

              <IconChevronDown
                size={23}
                color={theme.textPrimary}
                strokeWidth={2.5}
              />
            </View>

            <ThemedText style={styles.stateSubtitle}>{activeCount}</ThemedText>
          </Pressable>

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

      <LibraryFilterSheet
        refValue={filterSheetRef}
        viewMode={viewMode}
        filter={filter}
        collections={collections}
        onAll={() => applyFilter({ type: "all" })}
        onFavorites={() => applyFilter({ type: "favorites" })}
        onUncategorized={() => applyFilter({ type: "uncategorized" })}
        onCollection={(collection) =>
          applyFilter({
            type: "collection",
            id: String(collection.id),
            label: collection.title,
          })
        }
        onShowCollections={showCollections}
        onCreateCollection={handleCreateCollection}
      />

      <ImportUsageSheet
        ref={usageSheetRef}
        usage={usage}
        onUnlock={openPaywall}
      />
    </>
  );
}

function LibraryFilterSheet({
  refValue,
  viewMode,
  filter,
  collections,
  onAll,
  onFavorites,
  onUncategorized,
  onCollection,
  onShowCollections,
  onCreateCollection,
}: {
  refValue: React.RefObject<BottomSheetModal>;
  viewMode: ViewMode;
  filter: LibraryFilter;
  collections: CollectionCardLike[];
  onAll: () => void;
  onFavorites: () => void;
  onUncategorized: () => void;
  onCollection: (collection: CollectionCardLike) => void;
  onShowCollections: () => void;
  onCreateCollection: () => void;
}) {
  const theme = useTheme();
  const snapPoints = useMemo(() => ["58%"], []);

  const t = theme as any;
  const paper = t.paper ?? theme.background;
  const surface = t.surface ?? "#F7F6F2";
  const borderLight = t.borderLight ?? theme.border;
  const textSecondary = t.textSecondary ?? "#756F66";

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.42}
        pressBehavior="close"
      />
    ),
    [],
  );

  const realCollections = collections.filter(
    (collection) => collection.kind === "collection",
  );

  return (
    <BottomSheetModal
      ref={refValue}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{
        width: 46,
        height: 5,
        backgroundColor: borderLight,
      }}
      backgroundStyle={{
        backgroundColor: paper,
        borderTopLeftRadius: Radius.xxl,
        borderTopRightRadius: Radius.xxl,
      }}
    >
      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.sheetContent}
      >
        <View style={styles.sheetHeader}>
          <ThemedText style={styles.sheetTitle}>Pamja e recetave</ThemedText>

          <ThemedText style={[styles.sheetSubtitle, { color: textSecondary }]}>
            Zgjidh si do t’i shfaqësh recetat.
          </ThemedText>
        </View>

        <View style={[styles.sheetGroup, { backgroundColor: surface }]}>
          <FilterRow
            title="Të gjitha recetat"
            subtitle="Shfaq çdo recetë të ruajtur."
            icon={<IconChefHat size={21} color={theme.primary} />}
            selected={viewMode === "recipes" && filter.type === "all"}
            onPress={onAll}
          />

          <FilterRow
            title="Favoritet"
            subtitle="Vetëm recetat me yll."
            icon={<IconHeart size={21} color={theme.primary} />}
            selected={viewMode === "recipes" && filter.type === "favorites"}
            onPress={onFavorites}
          />

          <FilterRow
            title="Pa kategori"
            subtitle="Receta që nuk janë në koleksion."
            icon={<IconFolder size={21} color={theme.primary} />}
            selected={viewMode === "recipes" && filter.type === "uncategorized"}
            onPress={onUncategorized}
          />

          <FilterRow
            title="Koleksionet"
            subtitle="Shfaq raftin me koleksione."
            icon={<IconFolders size={21} color={theme.primary} />}
            selected={viewMode === "collections"}
            onPress={onShowCollections}
            last
          />
        </View>

        {realCollections.length > 0 ? (
          <>
            <ThemedText style={styles.sheetSectionLabel}>Koleksione</ThemedText>

            <View style={[styles.sheetGroup, { backgroundColor: surface }]}>
              {realCollections.map((collection, index) => (
                <FilterRow
                  key={String(collection.id)}
                  title={collection.title}
                  subtitle={formatRecipeCount(collection.count)}
                  colorDot={collection.color}
                  selected={
                    viewMode === "recipes" &&
                    filter.type === "collection" &&
                    String(filter.id) === String(collection.id)
                  }
                  onPress={() => onCollection(collection)}
                  last={index === realCollections.length - 1}
                />
              ))}
            </View>
          </>
        ) : null}

        <Pressable
          onPress={onCreateCollection}
          style={({ pressed }) => [
            styles.createCollectionButton,
            {
              borderColor: borderLight,
              opacity: pressed ? 0.72 : 1,
            },
          ]}
        >
          <IconPlus size={20} color={theme.primary} strokeWidth={2.6} />

          <ThemedText
            style={[styles.createCollectionText, { color: theme.primary }]}
          >
            Krijo koleksion
          </ThemedText>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

function FilterRow({
  title,
  subtitle,
  icon,
  colorDot,
  selected,
  onPress,
  last,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  colorDot?: string;
  selected: boolean;
  onPress: () => void;
  last?: boolean;
}) {
  const theme = useTheme();

  const t = theme as any;
  const primarySoft = t.primarySoft ?? "#FFF0ED";
  const borderLight = t.borderLight ?? theme.border;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterRow,
        {
          borderBottomColor: last ? "transparent" : borderLight,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.filterIcon,
          { backgroundColor: selected ? primarySoft : "rgba(39,31,23,0.04)" },
        ]}
      >
        {icon ? (
          icon
        ) : (
          <View style={[styles.colorDot, { backgroundColor: colorDot }]} />
        )}
      </View>

      <View style={styles.filterCopy}>
        <ThemedText style={styles.filterTitle}>{title}</ThemedText>

        {subtitle ? (
          <ThemedText type="subhead" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>

      {selected ? (
        <View style={[styles.checkBadge, { backgroundColor: theme.primary }]}>
          <IconCheck size={15} color="#FFFFFF" strokeWidth={3} />
        </View>
      ) : null}
    </Pressable>
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
  const primarySoft = t.primarySoft ?? surface;

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
            backgroundColor: recipe.imageUrl ? surface : primarySoft,
            borderColor: borderLight,
          },
        ]}
      >
        {recipe.imageUrl ? (
          <Image source={{ uri: recipe.imageUrl }} style={styles.recipeImage} />
        ) : (
          <IconChefHat size={31} color={theme.primary} strokeWidth={2.1} />
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
  if (filter.type === "all") return "Të gjitha recetat";
  if (filter.type === "favorites") return "Favoritet";
  if (filter.type === "uncategorized") return "Pa kategori";
  if (filter.type === "collection") return filter.label;

  return "Të gjitha recetat";
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

function formatCollectionCount(count: number) {
  if (count === 0) return "0 koleksione";
  if (count === 1) return "1 koleksion";

  return `${count} koleksione`;
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
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
  headerIconButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    backgroundColor: "rgba(247, 246, 242, 0.88)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(39, 31, 23, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingBottom: 150,
  },
  stateBlock: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  stateTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  stateTitle: {
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  stateSubtitle: {
    marginTop: 2,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "800",
    color: "#756F66",
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
  favoriteBadge: {
    position: "absolute",
    right: 9,
    top: 9,
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    backgroundColor: "#EF4A38",
    alignItems: "center",
    justifyContent: "center",
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
  sheetContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  sheetHeader: {
    marginBottom: Spacing.lg,
  },
  sheetTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  sheetSubtitle: {
    marginTop: Spacing.xs,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    textAlign: "center",
  },
  sheetSectionLabel: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  sheetGroup: {
    borderRadius: Radius.xl,
    overflow: "hidden",
  },
  filterRow: {
    minHeight: 74,
    paddingHorizontal: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  filterCopy: {
    flex: 1,
    gap: 2,
  },
  filterTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900",
  },
  checkBadge: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: Radius.full,
  },
  createCollectionButton: {
    marginTop: Spacing.xl,
    minHeight: 56,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  createCollectionText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
  },
});

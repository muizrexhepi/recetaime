import { Button, Host, Menu } from "@expo/ui/swift-ui";
import { labelStyle } from "@expo/ui/swift-ui/modifiers";
import {
  IconCheck,
  IconPlus,
  IconShoppingCart,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react-native";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import {
  Alert,
  Pressable,
  Share,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { TabScreen } from "@/components/tabs/tab-screen";
import { TabScreenHeader } from "@/components/tabs/tab-screen-header";
import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { useGroceryStore } from "@/stores/grocery-store";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type GroceryItemLike = {
  _id?: Id<"groceryItems">;
  localId?: string;

  text: string;
  amount?: string;
  unit?: string;
  item?: string;
  note?: string;

  recipeTitle?: string;
  checked: boolean;

  createdAt?: number;
};

type GroceryGroup = {
  key: string;
  title: string;
  items: GroceryItemLike[];
};

export default function GroceriesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();

  const [manualText, setManualText] = useState("");

  const guestItems = useGroceryStore((state) => state.items);
  const addGuestItems = useGroceryStore((state) => state.addItems);
  const toggleGuestItem = useGroceryStore((state) => state.toggleItem);
  const removeGuestItem = useGroceryStore((state) => state.removeItem);
  const clearGuestChecked = useGroceryStore((state) => state.clearChecked);

  const accountItems = useQuery(
    api.groceries.listMine,
    isAuthenticated && token ? { token } : "skip",
  ) as GroceryItemLike[] | undefined;

  const addAccountItems = useMutation(api.groceries.addItems);
  const setAccountChecked = useMutation(api.groceries.setChecked);
  const removeAccountItem = useMutation(api.groceries.removeItem);
  const clearAccountChecked = useMutation(api.groceries.clearChecked);

  const items = (
    isAuthenticated ? (accountItems ?? []) : guestItems
  ) as GroceryItemLike[];

  const sortedItems = [...items].sort((a, b) => {
    if (a.checked !== b.checked) return a.checked ? 1 : -1;
    return (b.createdAt ?? 0) - (a.createdAt ?? 0);
  });

  const groups = groupItems(sortedItems);
  const checkedCount = items.filter((item) => item.checked).length;
  const activeCount = items.length - checkedCount;

  const openAddGroceries = () => {
    const weekStart = getMonday(new Date());
    const weekEnd = addDays(weekStart, 6);

    router.push({
      pathname: "/(modals)/add-groceries",
      params: {
        startDateKey: formatDateKey(weekStart),
        endDateKey: formatDateKey(weekEnd),
      },
    } as any);
  };

  const toggleItem = async (item: GroceryItemLike) => {
    if (isAuthenticated && token && item._id) {
      await setAccountChecked({
        token,
        itemId: item._id,
        checked: !item.checked,
      });

      return;
    }

    if (item.localId) {
      toggleGuestItem(item.localId);
    }
  };

  const removeItem = async (item: GroceryItemLike) => {
    if (isAuthenticated && token && item._id) {
      await removeAccountItem({
        token,
        itemId: item._id,
      });

      return;
    }

    if (item.localId) {
      removeGuestItem(item.localId);
    }
  };

  const clearChecked = () => {
    if (checkedCount === 0) return;

    Alert.alert("Pastro artikujt", "A dëshiron t’i fshish artikujt e kryer?", [
      { text: "Anulo", style: "cancel" },
      {
        text: "Pastro",
        style: "destructive",
        onPress: () => {
          if (isAuthenticated && token) {
            void clearAccountChecked({ token });
            return;
          }

          clearGuestChecked();
        },
      },
    ]);
  };

  const clearAll = () => {
    if (items.length === 0) return;

    Alert.alert(
      "Pastro listën",
      "A dëshiron t’i fshish të gjithë artikujt në listë?",
      [
        { text: "Anulo", style: "cancel" },
        {
          text: "Fshi",
          style: "destructive",
          onPress: () => {
            void Promise.all(items.map((item) => removeItem(item)));
          },
        },
      ],
    );
  };

  const shareList = async () => {
    if (items.length === 0) return;

    const message = groups
      .map((group) => {
        const rows = group.items
          .map((item) => {
            const prefix = item.checked ? "✓" : "•";
            const amount = formatAmount(item);
            return `${prefix} ${item.text}${amount ? ` — ${amount}` : ""}`;
          })
          .join("\n");

        return `${group.title}\n${rows}`;
      })
      .join("\n\n");

    await Share.share({
      message,
    });
  };

  const addManualItems = async () => {
    const lines = manualText
      .split(/\r?\n|,/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    if (isAuthenticated && token) {
      await addAccountItems({
        token,
        items: lines.map((line) => ({
          text: line,
        })),
      });
    } else {
      addGuestItems(
        lines.map((line) => ({
          text: line,
        })),
      );
    }

    setManualText("");
  };

  return (
    <TabScreen>
      <TabScreenHeader
        title="Lista"
        right={
          <View style={styles.headerActions}>
            <Pressable
              onPress={openAddGroceries}
              style={({ pressed }) => [
                styles.headerButton,
                {
                  backgroundColor: theme.primarySoft,
                  opacity: pressed ? 0.72 : 1,
                },
              ]}
            >
              <IconPlus size={22} color={theme.primary} strokeWidth={2.4} />
            </Pressable>

            <Pressable
              onPress={() => void shareList()}
              style={({ pressed }) => [
                styles.headerButton,
                {
                  backgroundColor: theme.surface,
                  opacity: pressed ? 0.72 : 1,
                },
              ]}
            >
              <IconUpload
                size={20}
                color={theme.textPrimary}
                strokeWidth={2.2}
              />
            </Pressable>

            <View
              style={[
                styles.nativeMenuShell,
                {
                  backgroundColor: theme.surface,
                },
              ]}
            >
              <Host matchContents>
                <Menu
                  label="Opsionet"
                  systemImage="ellipsis"
                  modifiers={[labelStyle("iconOnly")]}
                >
                  <Button
                    label="Shto nga plani javor"
                    systemImage="cart.badge.plus"
                    onPress={openAddGroceries}
                  />
                  <Button
                    label="Ndaj listën"
                    systemImage="square.and.arrow.up"
                    onPress={() => void shareList()}
                  />
                  <Button
                    label="Pastro artikujt e kryer"
                    systemImage="checkmark.circle"
                    onPress={clearChecked}
                  />
                  <Button
                    label="Fshi të gjithë artikujt"
                    systemImage="trash"
                    onPress={clearAll}
                  />
                </Menu>
              </Host>
            </View>
          </View>
        }
      />

      {items.length === 0 ? (
        <ThemedCard
          style={[
            styles.emptyCard,
            {
              backgroundColor: theme.surfaceElevated,
              borderColor: theme.borderLight,
            },
          ]}
        >
          <ThemedView
            style={[
              styles.emptyIcon,
              {
                backgroundColor: theme.primarySoft,
              },
            ]}
          >
            <IconShoppingCart
              size={26}
              color={theme.primary}
              strokeWidth={2.2}
            />
          </ThemedView>

          <ThemedText type="cardTitle" style={styles.centerText}>
            Lista është bosh
          </ThemedText>

          <ThemedText
            type="subhead"
            themeColor="textSecondary"
            style={styles.centerText}
          >
            Shto përbërës nga plani javor ose shkruaji vetë më poshtë.
          </ThemedText>
        </ThemedCard>
      ) : (
        <>
          <ThemedView
            style={[
              styles.summaryBar,
              {
                borderColor: theme.borderLight,
                backgroundColor: theme.surfaceElevated,
              },
            ]}
          >
            <ThemedText type="bodyMedium">{activeCount} artikuj</ThemedText>

            <ThemedText type="subhead" themeColor="textSecondary">
              {checkedCount} të kryer
            </ThemedText>
          </ThemedView>

          <ThemedView transparent style={styles.groups}>
            {groups.map((group) => (
              <ThemedView transparent key={group.key} style={styles.group}>
                <ThemedText
                  type="smallBold"
                  themeColor="primary"
                  style={styles.groupTitle}
                >
                  {group.title}
                </ThemedText>

                <ThemedCard
                  style={[
                    styles.groupCard,
                    {
                      backgroundColor: theme.surfaceElevated,
                      borderColor: theme.borderLight,
                    },
                  ]}
                >
                  {group.items.map((item, index) => (
                    <ThemedView
                      transparent
                      key={String(
                        item._id ?? item.localId ?? `${item.text}-${index}`,
                      )}
                      style={[
                        styles.itemRow,
                        index !== group.items.length - 1 && {
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: theme.borderLight,
                        },
                      ]}
                    >
                      <Pressable
                        onPress={() => void toggleItem(item)}
                        style={({ pressed }) => [
                          styles.itemMain,
                          { opacity: pressed ? 0.76 : 1 },
                        ]}
                      >
                        <ThemedView
                          style={[
                            styles.ingredientIcon,
                            {
                              backgroundColor: theme.surface,
                            },
                          ]}
                        >
                          <ThemedText style={styles.emoji}>
                            {emojiForItem(item)}
                          </ThemedText>
                        </ThemedView>

                        <ThemedView transparent style={styles.itemCopy}>
                          <ThemedText
                            type="bodyMedium"
                            style={[
                              styles.itemText,
                              item.checked && {
                                color: theme.textTertiary,
                                textDecorationLine: "line-through",
                              },
                            ]}
                          >
                            {displayItemName(item)}
                          </ThemedText>

                          {formatAmount(item) ? (
                            <ThemedText
                              type="subhead"
                              themeColor="textSecondary"
                              numberOfLines={1}
                            >
                              {formatAmount(item)}
                            </ThemedText>
                          ) : item.recipeTitle ? (
                            <ThemedText
                              type="caption"
                              themeColor="textSecondary"
                              numberOfLines={1}
                            >
                              {item.recipeTitle}
                            </ThemedText>
                          ) : null}
                        </ThemedView>
                      </Pressable>

                      <Pressable
                        onPress={() => void toggleItem(item)}
                        hitSlop={10}
                        style={[
                          styles.checkbox,
                          {
                            backgroundColor: item.checked
                              ? theme.primary
                              : "transparent",
                            borderColor: item.checked
                              ? theme.primary
                              : theme.borderStrong,
                          },
                        ]}
                      >
                        {item.checked ? (
                          <IconCheck
                            size={18}
                            color="#FFFFFF"
                            strokeWidth={3}
                          />
                        ) : null}
                      </Pressable>

                      <Pressable
                        onPress={() => void removeItem(item)}
                        hitSlop={10}
                        style={styles.deleteButton}
                      >
                        <IconTrash
                          size={18}
                          color={theme.textTertiary}
                          strokeWidth={2.15}
                        />
                      </Pressable>
                    </ThemedView>
                  ))}
                </ThemedCard>
              </ThemedView>
            ))}
          </ThemedView>
        </>
      )}

      <ThemedCard
        style={[
          styles.manualCard,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor: theme.borderLight,
          },
        ]}
      >
        <TextInput
          value={manualText}
          onChangeText={setManualText}
          placeholder="Shkruaj ose ngjit disa përbërës"
          placeholderTextColor={theme.textTertiary}
          multiline
          style={[styles.manualInput, { color: theme.textPrimary }]}
        />

        <Pressable
          onPress={() => void addManualItems()}
          disabled={manualText.trim().length === 0}
          style={({ pressed }) => [
            styles.manualButton,
            {
              backgroundColor:
                manualText.trim().length === 0
                  ? theme.surfaceMuted
                  : theme.primary,
              opacity: pressed ? 0.82 : 1,
            },
          ]}
        >
          <ThemedText
            type="smallBold"
            style={{
              color:
                manualText.trim().length === 0 ? theme.textTertiary : "#FFFFFF",
            }}
          >
            Shto
          </ThemedText>
        </Pressable>
      </ThemedCard>
    </TabScreen>
  );
}

function groupItems(items: GroceryItemLike[]): GroceryGroup[] {
  const buckets: Record<string, GroceryGroup> = {};

  for (const item of items) {
    const category = categorizeItem(item);

    if (!buckets[category.key]) {
      buckets[category.key] = {
        key: category.key,
        title: category.title,
        items: [],
      };
    }

    buckets[category.key].items.push(item);
  }

  const order = [
    "dairy",
    "produce",
    "meat",
    "pasta",
    "flours",
    "spices",
    "pantry",
    "other",
  ];

  return Object.values(buckets).sort(
    (a, b) => order.indexOf(a.key) - order.indexOf(b.key),
  );
}

function categorizeItem(item: GroceryItemLike) {
  const text = `${item.item ?? ""} ${item.text}`.toLowerCase();

  if (
    /qum[eë]sht|vez[eë]|djath|kos|gjalp|ajk|krem|mascarpone|jogurt|mozzarella|parmesan|cream|milk|egg|butter|cheese/i.test(
      text,
    )
  ) {
    return { key: "dairy", title: "QUMËSHT, VEZË & FRIGORIFER" };
  }

  if (
    /domate|spec|qep|hud[hë]r|patate|karrot|limon|moll|banane|luleshtrydhe|avokado|spinaq|sallat|perime|fruta/i.test(
      text,
    )
  ) {
    return { key: "produce", title: "FRUTA & PERIME" };
  }

  if (/mish|pul[eë]|vi[cç]|peshk|ton|salmon|suxhuk|proshut/i.test(text)) {
    return { key: "meat", title: "MISH & PESHK" };
  }

  if (
    /makarona|oriz|bulgur|bollgur|kus-kus|fasule|thjerr[eë]za|pasta|rice|beans|lentils|pistach/i.test(
      text,
    )
  ) {
    return { key: "pasta", title: "MAKARONA, DRITHËRA & BISHTAJORE" };
  }

  if (
    /miell|sheqer|niseshte|pluhur pjek|kakao|vanil|flour|sugar|starch/i.test(
      text,
    )
  ) {
    return { key: "flours", title: "MIELL & SHEQER" };
  }

  if (/krip|piper|rigon|er[eë]za|kanell|paprika|curry/i.test(text)) {
    return { key: "spices", title: "ERËZA" };
  }

  if (
    /biskot|vaj|uthull|mjalt|nutella|çokollat|cokollat|coffee|kafe/i.test(text)
  ) {
    return { key: "pantry", title: "PANTRY" };
  }

  return { key: "other", title: "TË TJERA" };
}

function displayItemName(item: GroceryItemLike) {
  if (item.item?.trim()) return item.item.trim();

  return item.text
    .replace(
      /^\s*\d+([.,/]\d+)?\s*(g|kg|ml|l|lug[eë]|filxhan|got[eë]|tbsp|tsp|cup|cups)\s+/i,
      "",
    )
    .trim();
}

function formatAmount(item: GroceryItemLike) {
  if (item.amount && item.unit) return `${item.amount} ${item.unit}`;
  if (item.amount) return item.amount;
  if (item.unit) return item.unit;

  const match = item.text.match(
    /^\s*(\d+(?:[.,/]\d+)?)\s*(g|kg|ml|l|lug[eë]|filxhan|got[eë]|tbsp|tsp|cup|cups)\b/i,
  );

  if (!match) return "";

  return `${match[1]} ${match[2]}`;
}

function emojiForItem(item: GroceryItemLike) {
  const text = `${item.item ?? ""} ${item.text}`.toLowerCase();

  if (
    /mascarpone|ajk|krem|qum[eë]sht|kos|djath|cream|milk|cheese/i.test(text)
  ) {
    return "🥛";
  }

  if (/vez[eë]|egg/i.test(text)) return "🥚";
  if (/pistach|f[eë]st[eë]k/i.test(text)) return "🥜";
  if (/sheqer|sugar/i.test(text)) return "⚪";
  if (/biskot|biscuit/i.test(text)) return "🍪";
  if (/kafe|coffee/i.test(text)) return "☕";
  if (/çokollat|cokollat|chocolate/i.test(text)) return "🍫";
  if (/miell|flour/i.test(text)) return "🌾";
  if (/mish|pul[eë]|chicken|meat/i.test(text)) return "🍗";
  if (/domate|spec|qep|patate|perime/i.test(text)) return "🥬";

  return "🛒";
}

function getMonday(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  nativeMenuShell: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  emptyCard: {
    marginTop: Spacing.xxl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.xxl,
    alignItems: "center",
    gap: Spacing.md,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  centerText: {
    textAlign: "center",
  },
  summaryBar: {
    marginTop: Spacing.xl,
    minHeight: 56,
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  groups: {
    marginTop: Spacing.xl,
    gap: Spacing.xl,
  },
  group: {
    gap: Spacing.sm,
  },
  groupTitle: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  groupCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 0,
    overflow: "hidden",
  },
  itemRow: {
    minHeight: 76,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  itemMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  ingredientIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 20,
    lineHeight: 24,
  },
  itemCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  itemText: {
    lineHeight: 23,
  },
  checkbox: {
    width: 31,
    height: 31,
    borderRadius: Radius.sm,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    width: 28,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  manualCard: {
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xxxl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  manualInput: {
    minHeight: 48,
    maxHeight: 120,
    fontFamily: "Satoshi-Medium",
    fontSize: 16,
    lineHeight: 22,
    padding: 0,
  },
  manualButton: {
    minHeight: 44,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
});

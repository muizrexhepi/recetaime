import { type BottomSheetMethods } from "@expo/ui/community/bottom-sheet";
import {
  IconBookFilled,
  IconCalendarFilled,
  IconPlus,
  IconShoppingCartFilled,
  IconUserFilled,
} from "@tabler/icons-react-native";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import React, { useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AddRecipeSheet } from "@/components/sheets/add-recipe-sheet";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { useTheme } from "@/hooks/use-theme";

const TAB_BAR_HEIGHT = 72;
const CENTER_WIDTH = 82;
const ICON_SIZE = 25;

type TabRouteName = "cookbooks" | "meal-plan" | "groceries" | "profile";

const TAB_CONFIG: Record<
  TabRouteName,
  {
    label: string;
    icon: React.ComponentType<{
      size?: number;
      color?: string;
      strokeWidth?: number;
    }>;
  }
> = {
  cookbooks: {
    label: "Recetat",
    icon: IconBookFilled,
  },
  "meal-plan": {
    label: "Plani",
    icon: IconCalendarFilled,
  },
  groceries: {
    label: "Lista",
    icon: IconShoppingCartFilled,
  },
  profile: {
    label: "Profili",
    icon: IconUserFilled,
  },
};

const LEFT_TABS: TabRouteName[] = ["cookbooks", "meal-plan"];
const RIGHT_TABS: TabRouteName[] = ["groceries", "profile"];

export default function AppTabs() {
  const addRecipeSheetRef = useRef<BottomSheetMethods | null>(null);

  const openAddRecipeSheet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addRecipeSheetRef.current?.present();
  };

  return (
    <ThemedView style={styles.root}>
      <Tabs
        tabBar={(props) => (
          <CustomTabBar {...props} onPlusPress={openAddRecipeSheet} />
        )}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: "transparent" },
        }}
      >
        <Tabs.Screen name="cookbooks" />
        <Tabs.Screen name="meal-plan" />
        <Tabs.Screen name="groceries" />
        <Tabs.Screen name="profile" />
      </Tabs>

      <AddRecipeSheet ref={addRecipeSheetRef} />
    </ThemedView>
  );
}

function CustomTabBar({
  state,
  navigation,
  onPlusPress,
}: {
  state: any;
  navigation: any;
  onPlusPress: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <ThemedView
      style={[
        styles.tabBar,
        {
          height: TAB_BAR_HEIGHT + bottomPadding,
          paddingBottom: bottomPadding,
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        },
      ]}
    >
      <View style={styles.sideGroup}>
        {LEFT_TABS.map((routeName) => (
          <TabButton
            key={routeName}
            routeName={routeName}
            state={state}
            navigation={navigation}
          />
        ))}
      </View>

      <View style={styles.centerSlot}>
        <Pressable
          onPress={onPlusPress}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Shto recetë"
          style={({ pressed }) => [
            styles.plusButton,
            {
              backgroundColor: theme.primary,
              shadowColor: theme.primary,
            },
            pressed && styles.pressed,
          ]}
        >
          <IconPlus size={30} color="#FFFFFF" strokeWidth={2.6} />
        </Pressable>
      </View>

      <View style={styles.sideGroup}>
        {RIGHT_TABS.map((routeName) => (
          <TabButton
            key={routeName}
            routeName={routeName}
            state={state}
            navigation={navigation}
          />
        ))}
      </View>
    </ThemedView>
  );
}

function TabButton({
  routeName,
  state,
  navigation,
}: {
  routeName: TabRouteName;
  state: any;
  navigation: any;
}) {
  const theme = useTheme();

  const route = state.routes.find((item: any) => item.name === routeName);

  if (!route) {
    return <View style={styles.tabSlot} />;
  }

  const focused = state.routes[state.index]?.name === routeName;
  const config = TAB_CONFIG[routeName];
  const Icon = config.icon;
  const color = focused ? theme.primary : theme.textTertiary;

  return (
    <Pressable
      key={route.key}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={config.label}
      accessibilityState={focused ? { selected: true } : undefined}
      style={({ pressed }) => [styles.tabSlot, pressed && styles.pressed]}
      onPress={() => {
        Haptics.selectionAsync();

        const event = navigation.emit({
          type: "tabPress",
          target: route.key,
          canPreventDefault: true,
        });

        if (!focused && !event.defaultPrevented) {
          navigation.navigate(route.name);
        }
      }}
    >
      <Icon size={ICON_SIZE} color={color} strokeWidth={2.25} />

      <ThemedText
        type="tabLabel"
        style={{
          color,
          opacity: focused ? 1 : 0.82,
        }}
        numberOfLines={1}
      >
        {config.label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  sideGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  tabSlot: {
    flex: 1,
    minWidth: 0,
    height: TAB_BAR_HEIGHT - 6,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  centerSlot: {
    width: CENTER_WIDTH,
    height: TAB_BAR_HEIGHT - 6,
    alignItems: "center",
    justifyContent: "center",
  },
  plusButton: {
    width: 56,
    height: 46,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
});

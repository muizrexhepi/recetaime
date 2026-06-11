import {
  IconBook,
  IconCalendar,
  IconPlus,
  IconShoppingCart,
  IconUser,
} from "@tabler/icons-react-native";
import {
  TabList,
  TabListProps,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from "expo-router/ui";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { MaxContentWidth, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const TAB_ITEMS = [
  { name: "cookbooks", href: "/cookbooks", label: "Recetat", icon: IconBook },
  { name: "meal-plan", href: "/meal-plan", label: "Plani", icon: IconCalendar },
  { name: "groceries", href: "/groceries", label: "Lista", icon: IconShoppingCart },
  { name: "profile", href: "/profile", label: "Profili", icon: IconUser },
] as const;

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: "100%" }} />
      <TabList asChild>
        <CustomTabList>
          {TAB_ITEMS.slice(0, 2).map((item) => (
            <TabTrigger key={item.name} name={item.name} href={item.href} asChild>
              <TabButton label={item.label} icon={item.icon} />
            </TabTrigger>
          ))}

          <ThemedView style={styles.centerButton}>
            <IconPlus size={24} color="#FFFFFF" strokeWidth={2.7} />
          </ThemedView>

          {TAB_ITEMS.slice(2).map((item) => (
            <TabTrigger key={item.name} name={item.name} href={item.href} asChild>
              <TabButton label={item.label} icon={item.icon} />
            </TabTrigger>
          ))}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

function TabButton({
  label,
  icon: Icon,
  isFocused,
  ...props
}: TabTriggerSlotProps & {
  label: string;
  icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
}) {
  const theme = useTheme();
  const color = isFocused ? theme.primary : theme.textTertiary;

  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <ThemedView
        transparent
        style={[
          styles.iconWrap,
          { backgroundColor: isFocused ? theme.primarySoft : "transparent" },
        ]}
      >
        <Icon size={22} color={color} strokeWidth={isFocused ? 2.55 : 2.15} />
      </ThemedView>
      <ThemedText type="smallBold" style={[styles.label, { color }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function CustomTabList(props: TabListProps) {
  const theme = useTheme();

  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView
        style={[
          styles.innerContainer,
          { borderColor: theme.border, backgroundColor: theme.paper },
        ]}
      >
        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: "absolute",
    bottom: Spacing.md,
    width: "100%",
    paddingHorizontal: Spacing.md,
    alignItems: "center",
  },
  innerContainer: {
    width: "100%",
    maxWidth: MaxContentWidth,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  tabButton: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xs,
  },
  iconWrap: {
    width: 42,
    height: 31,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    lineHeight: 15,
    textAlign: "center",
  },
  centerButton: {
    width: 52,
    height: 42,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E94B35",
  },
  pressed: {
    opacity: 0.72,
  },
});

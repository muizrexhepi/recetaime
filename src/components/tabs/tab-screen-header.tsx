import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type HeaderAction = {
  icon: React.ReactNode;
  label?: string;
  onPress: () => void;
  accessibilityLabel?: string;
};

type TabScreenHeaderProps = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  action?: HeaderAction;
};

export function TabScreenHeader({
  title,
  subtitle,
  right,
  action,
}: TabScreenHeaderProps) {
  const theme = useTheme();

  return (
    <ThemedView transparent style={styles.container}>
      <View style={styles.copy}>
        <ThemedText type="title" style={styles.title} numberOfLines={1}>
          {title}
        </ThemedText>

        {subtitle ? (
          <ThemedText
            type="subhead"
            themeColor="textSecondary"
            style={styles.subtitle}
            numberOfLines={2}
          >
            {subtitle}
          </ThemedText>
        ) : null}
      </View>

      {right ? <View style={styles.right}>{right}</View> : null}

      {!right && action ? (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={
            action.accessibilityLabel ?? action.label ?? title
          }
          style={({ pressed }) => [
            action.label ? styles.pillAction : styles.iconAction,
            {
              backgroundColor: theme.surface,
              opacity: pressed ? 0.72 : 1,
            },
          ]}
        >
          {action.icon}

          {action.label ? (
            <ThemedText type="smallBold" themeColor="textSecondary">
              {action.label}
            </ThemedText>
          ) : null}
        </Pressable>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.xs,
  },
  title: {
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.75,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
  },
  right: {
    paddingTop: 1,
  },
  iconAction: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  pillAction: {
    minHeight: 42,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
});

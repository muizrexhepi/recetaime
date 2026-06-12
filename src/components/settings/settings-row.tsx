import { IconChevronRight } from "@tabler/icons-react-native";
import React from "react";
import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type SettingsRowProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  destructive?: boolean;
};

export function SettingsRow({
  icon,
  title,
  subtitle,
  onPress,
  destructive,
}: SettingsRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.65 : 1 }]}
    >
      <ThemedView
        style={[
          styles.iconBox,
          { backgroundColor: destructive ? theme.errorSubtle : theme.surface },
        ]}
      >
        {icon}
      </ThemedView>

      <ThemedView transparent style={styles.copy}>
        <ThemedText
          type="bodyMedium"
          style={[styles.title, destructive ? { color: theme.danger } : null]}
        >
          {title}
        </ThemedText>

        {subtitle ? (
          <ThemedText type="subhead" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </ThemedView>

      {!destructive ? (
        <IconChevronRight
          size={20}
          color={theme.textTertiary}
          strokeWidth={2.2}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
  },
});

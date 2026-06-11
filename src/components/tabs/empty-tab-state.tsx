import React from "react";
import { Pressable, StyleSheet } from "react-native";

import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type EmptyTabStateProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function EmptyTabState({
  icon,
  title,
  subtitle,
  actionLabel,
  onActionPress,
}: EmptyTabStateProps) {
  const theme = useTheme();

  return (
    <ThemedCard style={styles.card}>
      <ThemedView
        style={[styles.iconWrap, { backgroundColor: theme.primarySoft }]}
      >
        {icon}
      </ThemedView>

      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>

      <ThemedText
        type="default"
        themeColor="textSecondary"
        style={styles.subtitle}
      >
        {subtitle}
      </ThemedText>

      {actionLabel && onActionPress ? (
        <Pressable
          onPress={onActionPress}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: theme.primary,
              opacity: pressed ? 0.86 : 1,
            },
          ]}
        >
          <ThemedText type="smallBold" style={styles.buttonText}>
            {actionLabel}
          </ThemedText>
        </Pressable>
      ) : null}
    </ThemedCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    alignItems: "center",
    gap: Spacing.md,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: Radius.xxl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  title: {
    textAlign: "center",
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "500",
  },
  button: {
    marginTop: Spacing.sm,
    height: 50,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
  },
});

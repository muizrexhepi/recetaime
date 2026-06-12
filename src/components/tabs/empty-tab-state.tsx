import React from "react";
import { StyleSheet } from "react-native";

import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type EmptyTabStateProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
};

export function EmptyTabState({ icon, title, subtitle }: EmptyTabStateProps) {
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
    </ThemedCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxl,
    borderRadius: Radius.xxl,
    alignItems: "center",
    gap: Spacing.md,
  },
  iconWrap: {
    width: 86,
    height: 86,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    textAlign: "center",
  },
  subtitle: {
    maxWidth: 280,
    textAlign: "center",
  },
});

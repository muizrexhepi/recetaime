import React from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Spacing } from "@/constants/theme";

type TabScreenHeaderProps = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

export function TabScreenHeader({
  title,
  subtitle,
  right,
}: TabScreenHeaderProps) {
  return (
    <ThemedView transparent style={styles.container}>
      <View style={styles.textWrap}>
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>

        {subtitle ? (
          <ThemedText
            type="default"
            themeColor="textSecondary"
            style={styles.subtitle}
          >
            {subtitle}
          </ThemedText>
        ) : null}
      </View>

      {right ? <View style={styles.right}>{right}</View> : null}
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
  textWrap: {
    flex: 1,
    gap: Spacing.xs,
  },
  title: {
    fontSize: 38,
    lineHeight: 43,
    fontWeight: "800",
    letterSpacing: -1.05,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "500",
  },
  right: {
    paddingTop: 4,
  },
});

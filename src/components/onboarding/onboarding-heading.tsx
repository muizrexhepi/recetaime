import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Spacing, Typography } from "@/constants/theme";

type OnboardingHeadingProps = {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
};

export function OnboardingHeading({
  title,
  subtitle,
  align: _align = "center",
}: OnboardingHeadingProps) {
  return (
    <ThemedView transparent style={styles.wrap}>
      <ThemedText
        type="subtitle"
        numberOfLines={2}
        style={styles.title}
      >
        {title}
      </ThemedText>

      {subtitle ? (
        <ThemedText
          type="default"
          themeColor="textSecondary"
          numberOfLines={2}
          style={styles.subtitle}
        >
          {subtitle}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  title: {
    ...Typography.h1,
    fontWeight: "900",
    letterSpacing: 0,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.body,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "600",
    textAlign: "center",
  },
});

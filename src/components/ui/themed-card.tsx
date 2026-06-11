import React from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { Layout, Motion, radius, shadows } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type CardVariant =
  | "default"
  | "elevated"
  | "ghost"
  | "highlight"
  | "selected"
  | "locked";

type CardPadding = "none" | "compact" | "default" | "large";

type ThemedCardProps = {
  variant?: CardVariant;
  padding?: CardPadding;
  pressable?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

function paddingValue(padding: CardPadding) {
  switch (padding) {
    case "none":
      return 0;
    case "compact":
      return Layout.cardPaddingCompact;
    case "large":
      return Layout.cardPaddingLarge;
    case "default":
    default:
      return Layout.cardPadding;
  }
}

export function ThemedCard({
  variant = "default",
  padding = "default",
  pressable,
  onPress,
  style,
  children,
}: ThemedCardProps) {
  const theme = useTheme();
  const isPressable = pressable || !!onPress;

  const cardStyle = [
    styles.card,
    {
      padding: paddingValue(padding),
      backgroundColor:
        variant === "ghost"
          ? "transparent"
          : variant === "elevated"
            ? theme.surfaceElevated
            : variant === "highlight" || variant === "selected"
              ? theme.accentSubtle
              : theme.surface,
      borderColor:
        variant === "selected"
          ? theme.accentSoft
          : variant === "highlight"
            ? theme.accentSoft
            : theme.borderLight,
      opacity: variant === "locked" ? 0.72 : 1,
    },
    variant === "elevated" && styles.elevated,
    style,
  ];

  if (!isPressable) {
    return <View style={cardStyle}>{children}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        cardStyle,
        pressed && {
          opacity: 0.76,
          transform: [{ scale: Motion.pressScale }],
        },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  elevated: {
    ...shadows.small,
  },
});

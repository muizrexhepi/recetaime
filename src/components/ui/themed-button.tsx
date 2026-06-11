import { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";

type ThemedButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function ThemedButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  style,
}: ThemedButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const backgroundColor = isDisabled
    ? theme.cardMuted
    : variant === "primary"
      ? theme.primary
      : variant === "secondary"
        ? theme.primarySoft
        : "transparent";

  const borderColor = isDisabled
    ? theme.border
    : variant === "outline"
      ? theme.borderStrong
      : variant === "secondary"
        ? theme.primarySoft
        : "transparent";

  const textColor = isDisabled
    ? theme.textTertiary
    : variant === "primary"
      ? "#FFFFFF"
      : variant === "secondary"
        ? theme.primaryDark
        : variant === "outline"
          ? theme.text
          : theme.primary;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor,
          borderColor,
          opacity: pressed && !isDisabled ? 0.86 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.985 : 1 }],
        },
        variant === "ghost" && styles.ghost,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}

          <Text style={[styles.title, { color: textColor }]}>{title}</Text>

          {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 60,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  ghost: {
    minHeight: 48,
    paddingHorizontal: Spacing.lg,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  title: {
    fontFamily: Fonts.sans,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
  },
});

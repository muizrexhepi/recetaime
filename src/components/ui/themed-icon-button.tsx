import { ReactNode } from "react";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";

import { ThemedView } from "@/components/ui/themed-view";
import { Radius, Shadows } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type ThemedIconButtonProps = {
  icon: ReactNode;
  onPress: () => void;
  size?: number;
  variant?: "paper" | "soft" | "ghost";
  radius?: keyof typeof Radius;
  style?: StyleProp<ViewStyle>;
};

export function ThemedIconButton({
  icon,
  onPress,
  size = 44,
  variant = "paper",
  radius = "lg",
  style,
}: ThemedIconButtonProps) {
  const theme = useTheme();

  const backgroundColor =
    variant === "paper"
      ? theme.paper
      : variant === "soft"
        ? theme.primarySoft
        : "transparent";

  const borderColor = variant === "ghost" ? "transparent" : theme.border;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={14}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
        style,
      ]}
    >
      <ThemedView
        style={[
          styles.button,
          variant === "paper" && styles.shadow,
          {
            width: size,
            height: size,
            borderRadius: Radius[radius],
            backgroundColor,
            borderColor,
            borderWidth: variant === "ghost" ? 0 : 1,
          },
        ]}
      >
        {icon}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
  shadow: {
    ...Shadows.soft,
  },
});

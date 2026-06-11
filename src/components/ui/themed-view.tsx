import { View, type ViewProps } from "react-native";

import { ThemeColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
  transparent?: boolean;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  type,
  transparent = false,
  ...otherProps
}: ThemedViewProps) {
  const theme = useTheme();

  const backgroundColor = transparent
    ? undefined
    : (lightColor ?? darkColor ?? theme[type ?? "background"]);

  return (
    <View
      style={[backgroundColor ? { backgroundColor } : null, style]}
      {...otherProps}
    />
  );
}

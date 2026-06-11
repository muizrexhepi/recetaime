import {
  Platform,
  StyleSheet,
  Text,
  type StyleProp,
  type TextProps,
  type TextStyle,
} from "react-native";

import { Fonts, ThemeColor, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type ThemedTextProps = TextProps & {
  type?:
    | "largeTitle"
    | "h1"
    | "h2"
    | "title"
    | "cardTitle"
    | "body"
    | "bodyMedium"
    | "subhead"
    | "footnote"
    | "caption"
    | "button"
    | "tabLabel"
    | "default"
    | "small"
    | "smallBold"
    | "subtitle"
    | "link"
    | "linkPrimary"
    | "code";
  color?: "primary" | "secondary" | "tertiary" | "muted" | "accent" | "inverse";
  themeColor?: ThemeColor;
  align?: "left" | "center" | "right";
  muted?: boolean;
  style?: StyleProp<TextStyle>;
};

function getTextStyle(type: NonNullable<ThemedTextProps["type"]>) {
  switch (type) {
    case "largeTitle":
      return Typography.largeTitle;
    case "h1":
      return Typography.h1;
    case "h2":
      return Typography.h2;
    case "title":
      return Typography.title;
    case "cardTitle":
      return Typography.cardTitle;
    case "bodyMedium":
      return Typography.bodyMedium;
    case "subhead":
      return Typography.subhead;
    case "footnote":
      return Typography.footnote;
    case "caption":
      return Typography.caption;
    case "button":
      return Typography.button;
    case "tabLabel":
      return Typography.tabLabel;

    // legacy aliases
    case "subtitle":
      return Typography.h2;
    case "small":
      return Typography.footnote;
    case "smallBold":
      return Typography.subhead;
    case "link":
      return Typography.footnote;
    case "linkPrimary":
      return Typography.footnote;
    case "code":
      return styles.code;
    case "default":
    case "body":
    default:
      return Typography.body;
  }
}

export function ThemedText({
  style,
  type = "body",
  color = "primary",
  themeColor,
  align,
  muted = false,
  ...rest
}: ThemedTextProps) {
  const theme = useTheme();

  const resolvedColor = themeColor
    ? theme[themeColor]
    : type === "linkPrimary" || color === "accent"
      ? theme.primary
      : color === "secondary"
        ? theme.textSecondary
        : color === "tertiary"
          ? theme.textTertiary
          : color === "muted"
            ? theme.textMuted
            : color === "inverse"
              ? theme.textInverse
              : theme.text;

  return (
    <Text
      style={[
        getTextStyle(type),
        {
          color: resolvedColor,
          opacity: muted ? 0.72 : 1,
          textAlign: align,
        },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: "700" }) ?? "500",
    fontSize: 12,
    lineHeight: 16,
  },
});

import { Platform } from "react-native";

export const colors = {
  background: "#FAF6EA",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFDF8",
  surfaceMuted: "#F4EFE5",

  textPrimary: "#17130F",
  textSecondary: "#6F685D",
  textTertiary: "#9B9286",
  textMuted: "#B7AEA2",
  textInverse: "#FFFFFF",

  border: "rgba(39, 31, 23, 0.10)",
  borderLight: "rgba(39, 31, 23, 0.065)",
  borderStrong: "rgba(39, 31, 23, 0.16)",

  accent: "#EF4A38",
  accentHover: "#E33F2E",
  accentPressed: "#C93425",
  accentSubtle: "rgba(239, 74, 56, 0.095)",
  accentSoft: "rgba(239, 74, 56, 0.16)",

  success: "#2F8F5B",
  successSubtle: "rgba(47, 143, 91, 0.12)",

  warning: "#F3B64C",
  warningSubtle: "rgba(243, 182, 76, 0.14)",

  error: "#D93D2E",
  errorSubtle: "rgba(217, 61, 46, 0.12)",

  overlay: "rgba(23, 19, 15, 0.48)",
  shadow: "#17130F",

  tabInactive: "#9B9286",

  // old aliases so existing files do not break
  text: "#17130F",
  backgroundElement: "#FFFFFF",
  backgroundSelected: "#FFF1ED",
  paper: "#FFFFFF",
  card: "#FFFFFF",
  cardMuted: "#F4EFE5",
  primary: "#EF4A38",
  primaryDark: "#C93425",
  primarySoft: "rgba(239, 74, 56, 0.095)",
  herbGreen: "#2F8F5B",
  softGreen: "rgba(47, 143, 91, 0.12)",
  blue: "#4F8FEA",
  blueSoft: "rgba(79, 143, 234, 0.12)",
  gold: "#F3B64C",
  goldSoft: "rgba(243, 182, 76, 0.14)",
  danger: "#D93D2E",
} as const;

// Force same light theme for now.
// The app brand/assets look much better light-only.
export const Colors = {
  light: colors,
  dark: colors,
  unspecified: colors,
} as const;

export type ThemeColor = keyof typeof colors;
export type ThemeColors = typeof colors;

export const fonts = {
  regular: "Satoshi-Regular",
  medium: "Satoshi-Medium",
  bold: "Satoshi-Bold",
  mono:
    Platform.select({
      ios: "ui-monospace",
      android: "monospace",
      default: "monospace",
    }) ?? "monospace",
} as const;

export const Fonts = fonts;

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,

  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const spacing = Spacing;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
} as const;

export const radius = Radius;

export const Typography = {
  largeTitle: {
    fontFamily: fonts.bold,
    fontSize: 38,
    lineHeight: 43,
    letterSpacing: -1.05,
  },
  h1: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.75,
  },
  h2: {
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.45,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.25,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 23,
    letterSpacing: -0.12,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: -0.04,
  },
  bodyMedium: {
    fontFamily: fonts.medium,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: -0.04,
  },
  subhead: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: -0.03,
  },
  footnote: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    lineHeight: 18,
    letterSpacing: -0.02,
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.05,
  },
  tabLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: -0.05,
  },
} as const;

export const textStyles = Typography;

export const typography = {
  largeTitle: Typography.largeTitle,
  title: Typography.h1,
  title2: Typography.h2,
  title3: Typography.title,
  headline: Typography.cardTitle,
  body: Typography.body,
  bodyMedium: Typography.bodyMedium,
  subhead: Typography.subhead,
  footnote: Typography.footnote,
  caption: Typography.caption,
  button: Typography.button,
} as const;

export const Layout = {
  screenPadding: 20,
  screenPaddingCompact: 16,
  cardPaddingCompact: 14,
  cardPadding: 18,
  cardPaddingLarge: 22,
  sectionGap: 16,
  cardGap: 12,
  tabBottomPadding: Platform.select({ ios: 118, android: 104, default: 108 }),
  maxContentWidth: 800,
} as const;

export const Motion = {
  pressScale: 0.97,
  fast: 140,
  normal: 200,
  slow: 280,
} as const;

export const Shadows = {
  soft: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.045,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  medium: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
} as const;

export const shadows = {
  small: Shadows.soft,
  medium: Shadows.medium,
  large: Shadows.medium,
};

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
import { Stack } from "expo-router";

import { colors, Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export default function ModalsLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerShadowVisible: false,
        headerTintColor: colors.textPrimary,
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTitleStyle: {
          fontFamily: Fonts.bold,
          fontSize: 17,
        },
        contentStyle: {
          backgroundColor: theme.background,
        },
        gestureEnabled: true,
        animation: "slide_from_bottom",
      }}
    >
      <Stack.Screen name="settings" />

      <Stack.Screen name="add-meal" />

      <Stack.Screen name="add-groceries" />

      <Stack.Screen name="manage-recipe-cookbooks" />

      <Stack.Screen name="add-to-cookbook" />
    </Stack>
  );
}

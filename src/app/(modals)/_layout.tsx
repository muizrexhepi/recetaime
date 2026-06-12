import { Stack } from "expo-router";

import { colors, Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export default function ModalsLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        presentation: "modal",
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
      }}
    >
      <Stack.Screen
        name="add-meal"
        options={{
          title: "Shto vakt",
        }}
      />

      <Stack.Screen
        name="add-groceries"
        options={{
          title: "Shto në listë",
        }}
      />
    </Stack>
  );
}

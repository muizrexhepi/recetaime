import { IconChevronLeft } from "@tabler/icons-react-native";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CreateAccountStep } from "@/components/onboarding/steps/create-account-step";
import { ThemedIconButton } from "@/components/ui/themed-icon-button";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export default function OnboardingCreateAccountScreen() {
  const router = useRouter();
  const theme = useTheme();

  const goBack = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/profile" as any);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView
        edges={["top", "bottom"]}
        style={[styles.safeArea, { backgroundColor: theme.background }]}
      >
        <View style={styles.header}>
          <ThemedIconButton
            onPress={goBack}
            size={38}
            radius="md"
            variant="paper"
            icon={
              <IconChevronLeft
                size={22}
                color={theme.textSecondary}
                strokeWidth={2.6}
              />
            }
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
        >
          <CreateAccountStep />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 54,
    paddingHorizontal: Spacing.xl,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
});

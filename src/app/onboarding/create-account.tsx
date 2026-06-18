import { IconChevronLeft } from "@tabler/icons-react-native";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CreateAccountStep } from "@/components/onboarding/steps/create-account-step";
import { Radius, Spacing } from "@/constants/theme";
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

  const t = theme as any;
  const surface = t.surface ?? "#F7F6F2";
  const borderLight = t.borderLight ?? theme.border;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView
        edges={["top", "bottom"]}
        style={[styles.safeArea, { backgroundColor: theme.background }]}
      >
        <View style={styles.header}>
          <Pressable
            onPress={goBack}
            hitSlop={14}
            accessibilityRole="button"
            accessibilityLabel="Kthehu mbrapa"
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: surface,
                borderColor: borderLight,
                opacity: pressed ? 0.68 : 1,
              },
            ]}
          >
            <IconChevronLeft
              size={23}
              color={theme.textPrimary}
              strokeWidth={2.8}
            />
          </Pressable>
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
    height: 58,
    paddingHorizontal: Spacing.xl,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
});

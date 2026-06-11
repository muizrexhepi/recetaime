import { IconChevronLeft } from "@tabler/icons-react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CreateAccountStep } from "@/components/onboarding/steps/create-account-step";
import { ThemedIconButton } from "@/components/ui/themed-icon-button";
import { ThemedView } from "@/components/ui/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export default function OnboardingCreateAccountScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ThemedView transparent style={styles.header}>
          <ThemedIconButton
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
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
        </ThemedView>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
        >
          <CreateAccountStep />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  content: {
    flexGrow: 1,
  },
});

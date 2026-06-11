import { IconUserFilled } from "@tabler/icons-react-native";
import * as Haptics from "expo-haptics";
import { StyleSheet } from "react-native";

import { OnboardingHeading } from "@/components/onboarding/onboarding-heading";
import { OnboardingOptionCard } from "@/components/onboarding/onboarding-option-card";
import { ThemedView } from "@/components/ui/themed-view";
import { Spacing } from "@/constants/theme";
import {
  AgeRange,
  useOnboardingFlowStore,
} from "@/stores/onboarding-flow-store";

const OPTIONS: AgeRange[] = ["18-24", "25-34", "35-44", "45-54", "55+"];

export function AgeRangeStep() {
  const ageRange = useOnboardingFlowStore((state) => state.ageRange);
  const setAgeRange = useOnboardingFlowStore((state) => state.setAgeRange);

  return (
    <ThemedView transparent style={styles.screen}>
      <OnboardingHeading
        title="Sa vjeç je?"
        subtitle="Përdoret vetëm për ta personalizuar përvojën."
      />

      <ThemedView transparent style={styles.list}>
        {OPTIONS.map((option) => (
          <OnboardingOptionCard
            key={option}
            title={option}
            selected={ageRange === option}
            Icon={IconUserFilled}
            onPress={() => {
              Haptics.selectionAsync();
              setAgeRange(option);
            }}
          />
        ))}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    alignItems: "center",
  },
  list: {
    width: "100%",
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
});

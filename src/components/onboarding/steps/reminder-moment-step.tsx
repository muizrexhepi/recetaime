import { IconClockFilled } from "@tabler/icons-react-native";
import * as Haptics from "expo-haptics";
import { StyleSheet } from "react-native";

import { OnboardingHeading } from "@/components/onboarding/onboarding-heading";
import { OnboardingOptionCard } from "@/components/onboarding/onboarding-option-card";
import { ThemedView } from "@/components/ui/themed-view";
import { Spacing } from "@/constants/theme";
import {
  ReminderMoment,
  useOnboardingFlowStore,
} from "@/stores/onboarding-flow-store";

export function ReminderMomentStep() {
  const selected = useOnboardingFlowStore(
    (state) => state.selectedReminderMoments,
  );
  const toggle = useOnboardingFlowStore((state) => state.toggleReminderMoment);

  const options: {
    value: ReminderMoment;
    title: string;
    subtitle?: string;
  }[] = [
    {
      value: "morning",
      title: "Në mëngjes",
    },
    {
      value: "lunch",
      title: "Rreth drekës",
    },
    {
      value: "afternoon",
      title: "Pasdite",
    },
    {
      value: "evening",
      title: "Në mbrëmje",
    },
    {
      value: "weekend",
      title: "Fundjavë",
    },
  ];

  return (
    <ThemedView transparent style={styles.screen}>
      <OnboardingHeading
        title="Kur mendon zakonisht çfarë të gatuash?"
        subtitle="Do të ta kujtojmë në momentin e duhur, jo rastësisht."
      />

      <ThemedView transparent style={styles.list}>
        {options.map((option) => {
          const isSelected = selected.includes(option.value);

          return (
            <OnboardingOptionCard
              key={option.value}
              title={option.title}
              subtitle={option.subtitle}
              selected={isSelected}
              Icon={IconClockFilled}
              onPress={() => {
                Haptics.selectionAsync();
                toggle(option.value);
              }}
            />
          );
        })}
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

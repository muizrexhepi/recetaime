import {
  IconBookmarkFilled,
  IconCalendarFilled,
  IconFolderFilled,
  IconShoppingCartFilled,
  IconToolsKitchen2Filled,
  IconUserFilled,
} from "@tabler/icons-react-native";
import * as Haptics from "expo-haptics";
import { StyleSheet } from "react-native";

import { OnboardingHeading } from "@/components/onboarding/onboarding-heading";
import { OnboardingOptionCard } from "@/components/onboarding/onboarding-option-card";
import { ThemedView } from "@/components/ui/themed-view";
import { Spacing } from "@/constants/theme";
import {
  OnboardingGoal,
  useOnboardingFlowStore,
} from "@/stores/onboarding-flow-store";

export function GoalsStep() {
  const selected = useOnboardingFlowStore((state) => state.selectedGoals);
  const toggle = useOnboardingFlowStore((state) => state.toggleGoal);

  const options: {
    value: OnboardingGoal;
    title: string;
    subtitle: string;
    Icon: React.ComponentType<{
      size?: number;
      color?: string;
      strokeWidth?: number;
    }>;
  }[] = [
    {
      value: "save_recipes",
      title: "Ruaj receta",
      subtitle: "Mos i humb më",
      Icon: IconBookmarkFilled,
    },
    {
      value: "organize_collections",
      title: "Organizo koleksione",
      subtitle: "Sipas temës ose familjes",
      Icon: IconFolderFilled,
    },
    {
      value: "meal_plan",
      title: "Planifiko vakte",
      subtitle: "Për javën",
      Icon: IconCalendarFilled,
    },
    {
      value: "grocery_lists",
      title: "Lista blerjeje",
      subtitle: "Nga recetat",
      Icon: IconShoppingCartFilled,
    },
    {
      value: "family_recipes",
      title: "Receta familjare",
      subtitle: "Nga WhatsApp ose foto",
      Icon: IconUserFilled,
    },
    {
      value: "cook_more",
      title: "Gatuaj më shpesh",
      subtitle: "Më pak rrëmujë",
      Icon: IconToolsKitchen2Filled,
    },
  ];

  return (
    <ThemedView transparent style={styles.screen}>
      <OnboardingHeading
        title="Çfarë do të bësh me Receta Ime?"
        subtitle="Zgjidh të gjitha që vlejnë për ty."
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
              Icon={option.Icon}
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

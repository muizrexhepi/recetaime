import {
  IconBook2,
  IconBrandTiktokFilled,
  IconCameraFilled,
  IconPencilFilled,
  IconUserFilled,
  IconWorldFilled,
} from "@tabler/icons-react-native";
import * as Haptics from "expo-haptics";
import { StyleSheet } from "react-native";

import { OnboardingHeading } from "@/components/onboarding/onboarding-heading";
import { OnboardingOptionCard } from "@/components/onboarding/onboarding-option-card";
import { ThemedView } from "@/components/ui/themed-view";
import { Spacing } from "@/constants/theme";
import {
  ImportSource,
  useOnboardingFlowStore,
} from "@/stores/onboarding-flow-store";

const OPTIONS: {
  value: ImportSource;
  title: string;
  subtitle: string;
  Icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
}[] = [
  {
    value: "social",
    title: "Rrjete sociale",
    subtitle: "TikTok, Instagram, YouTube",
    Icon: IconBrandTiktokFilled,
  },
  {
    value: "websites",
    title: "Website recetash",
    subtitle: "Linke nga Google ose blogje",
    Icon: IconWorldFilled,
  },
  {
    value: "photo",
    title: "Foto / screenshot",
    subtitle: "Nga galeria",
    Icon: IconCameraFilled,
  },
  {
    value: "family",
    title: "Receta familjare",
    subtitle: "WhatsApp ose mesazhe",
    Icon: IconUserFilled,
  },
  {
    value: "printed",
    title: "Libër ose fletore",
    subtitle: "Të printuara ose me dorë",
    Icon: IconBook2,
  },
  {
    value: "manual",
    title: "Shkruaj vetë",
    subtitle: "Kur receta është në kokë",
    Icon: IconPencilFilled,
  },
];

export function SourcesStep() {
  const selected = useOnboardingFlowStore((state) => state.selectedSources);
  const toggle = useOnboardingFlowStore((state) => state.toggleSource);

  return (
    <ThemedView transparent style={styles.screen}>
      <OnboardingHeading
        title="Prej nga i merr recetat?"
        subtitle="Zgjidh të gjitha që vlejnë për ty."
      />

      <ThemedView transparent style={styles.list}>
        {OPTIONS.map((option) => {
          const isSelected = selected.includes(option.value);

          return (
            <OnboardingOptionCard
              key={option.value}
              title={option.title}
              subtitle={option.subtitle}
              Icon={option.Icon}
              selected={isSelected}
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
    flex: 1,
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

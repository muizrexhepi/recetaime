import {
  IconBrandInstagramFilled,
  IconBrandTiktokFilled,
  IconBrandYoutubeFilled,
  IconHeartHandshake,
  IconSearchFilled,
  IconSparklesFilled,
} from "@tabler/icons-react-native";
import * as Haptics from "expo-haptics";
import { StyleSheet } from "react-native";

import { OnboardingHeading } from "@/components/onboarding/onboarding-heading";
import { OnboardingOptionCard } from "@/components/onboarding/onboarding-option-card";
import { ThemedView } from "@/components/ui/themed-view";
import { Spacing } from "@/constants/theme";
import {
  HeardFrom,
  useOnboardingFlowStore,
} from "@/stores/onboarding-flow-store";

export function HeardFromStep() {
  const heardFrom = useOnboardingFlowStore((state) => state.heardFrom);
  const setHeardFrom = useOnboardingFlowStore((state) => state.setHeardFrom);

  const options: {
    value: HeardFrom;
    title: string;
    Icon: React.ComponentType<{
      size?: number;
      color?: string;
      strokeWidth?: number;
    }>;
  }[] = [
    {
      value: "tiktok",
      title: "TikTok",
      Icon: IconBrandTiktokFilled,
    },
    {
      value: "instagram",
      title: "Instagram",
      Icon: IconBrandInstagramFilled,
    },
    {
      value: "youtube",
      title: "YouTube",
      Icon: IconBrandYoutubeFilled,
    },
    {
      value: "google",
      title: "Google",
      Icon: IconSearchFilled,
    },
    {
      value: "friend",
      title: "Nga një shok/shoqe",
      Icon: IconHeartHandshake,
    },
    {
      value: "other",
      title: "Tjetër",
      Icon: IconSparklesFilled,
    },
  ];

  return (
    <ThemedView transparent style={styles.screen}>
      <OnboardingHeading
        title="Ku dëgjove për Receta Ime?"
        subtitle="Na ndihmon ta përmirësojmë marketingun."
      />

      <ThemedView transparent style={styles.list}>
        {options.map((option) => (
          <OnboardingOptionCard
            key={option.value}
            title={option.title}
            selected={heardFrom === option.value}
            Icon={option.Icon}
            onPress={() => {
              Haptics.selectionAsync();
              setHeardFrom(option.value);
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

import { IconChevronLeft } from "@tabler/icons-react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { ComponentType, useEffect } from "react";
import { ScrollView, StyleSheet } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { AgeRangeStep } from "@/components/onboarding/steps/age-range-step";
import { GoalResponseStep } from "@/components/onboarding/steps/goal-response-step";
import { GoalsStep } from "@/components/onboarding/steps/goals-step";
import { HeardFromStep } from "@/components/onboarding/steps/heard-from-step";
import { NotificationPrimerStep } from "@/components/onboarding/steps/notification-primer-step";
import { OutcomeStep } from "@/components/onboarding/steps/outcome-step";
import { ReminderMomentStep } from "@/components/onboarding/steps/reminder-moment-step";
import { SetupStep } from "@/components/onboarding/steps/setup-step";
import { SourceResponseStep } from "@/components/onboarding/steps/source-response-step";
import { SourcesStep } from "@/components/onboarding/steps/sources-step";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedIconButton } from "@/components/ui/themed-icon-button";
import { ThemedView } from "@/components/ui/themed-view";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useOnboardingFlowStore } from "@/stores/onboarding-flow-store";

type StepRequired = "goals" | "sources" | "reminder" | "heardFrom" | "ageRange";

type OnboardingStepConfig = {
  key: string;
  buttonLabel?: string;
  component: ComponentType;
  required?: StepRequired;
  autoAdvance?: boolean;
};

const STEPS: OnboardingStepConfig[] = [
  {
    key: "goals",
    buttonLabel: "Vazhdo",
    component: GoalsStep,
    required: "goals",
  },
  {
    key: "goal-response",
    buttonLabel: "Vazhdo",
    component: GoalResponseStep,
  },
  {
    key: "reminder",
    buttonLabel: "Vazhdo",
    component: ReminderMomentStep,
    required: "reminder",
  },
  {
    key: "notification-primer",
    component: NotificationPrimerStep,
  },
  {
    key: "heard-from",
    buttonLabel: "Vazhdo",
    component: HeardFromStep,
    required: "heardFrom",
  },
  {
    key: "sources",
    buttonLabel: "Vazhdo",
    component: SourcesStep,
    required: "sources",
  },
  {
    key: "source-response",
    buttonLabel: "Vazhdo",
    component: SourceResponseStep,
  },
  {
    key: "age-range",
    buttonLabel: "Vazhdo",
    component: AgeRangeStep,
    required: "ageRange",
  },
  {
    key: "setup",
    component: SetupStep,
    autoAdvance: true,
  },
  {
    key: "outcome",
    buttonLabel: "Vazhdo",
    component: OutcomeStep,
  },
];

export default function OnboardingFlowScreen() {
  const router = useRouter();
  const theme = useTheme();

  const stepIndex = useOnboardingFlowStore((state) => state.stepIndex);
  const nextStep = useOnboardingFlowStore((state) => state.nextStep);
  const previousStep = useOnboardingFlowStore((state) => state.previousStep);

  const selectedGoals = useOnboardingFlowStore((state) => state.selectedGoals);
  const selectedSources = useOnboardingFlowStore(
    (state) => state.selectedSources,
  );
  const selectedReminderMoments = useOnboardingFlowStore(
    (state) => state.selectedReminderMoments,
  );
  const heardFrom = useOnboardingFlowStore((state) => state.heardFrom);
  const ageRange = useOnboardingFlowStore((state) => state.ageRange);

  const safeStepIndex = Math.min(stepIndex, STEPS.length - 1);
  const step = STEPS[safeStepIndex];
  const StepComponent = step.component;

  const progress = (safeStepIndex + 1) / STEPS.length;

  const disabled =
    (step.required === "goals" && selectedGoals.length === 0) ||
    (step.required === "sources" && selectedSources.length === 0) ||
    (step.required === "reminder" && selectedReminderMoments.length === 0) ||
    (step.required === "heardFrom" && !heardFrom) ||
    (step.required === "ageRange" && !ageRange);

  useEffect(() => {
    if (!step.autoAdvance) return;

    const timer = setTimeout(() => {
      nextStep();
    }, 1200);

    return () => clearTimeout(timer);
  }, [nextStep, step.autoAdvance, step.key]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (safeStepIndex === 0) {
      router.replace("/onboarding" as any);
      return;
    }

    previousStep();
  };

  const handleContinue = () => {
    if (disabled) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (safeStepIndex === STEPS.length - 1) {
      router.push("/onboarding/create-account" as any);
      return;
    }

    nextStep();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ThemedView transparent style={styles.header}>
          <ThemedIconButton
            onPress={handleBack}
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

          <AnimatedProgressBar progress={progress} />
        </ThemedView>

        <ThemedView transparent style={styles.content}>
          <Animated.View
            key={step.key}
            entering={FadeIn.duration(180).easing(Easing.out(Easing.cubic))}
            exiting={FadeOut.duration(100)}
            style={styles.stepWrap}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentInsetAdjustmentBehavior="automatic"
              contentContainerStyle={styles.scrollContent}
            >
              <StepComponent />
            </ScrollView>
          </Animated.View>
        </ThemedView>

        {step.buttonLabel && !step.autoAdvance ? (
          <ThemedView transparent style={styles.footer}>
            <ThemedButton
              title={step.buttonLabel}
              disabled={disabled}
              onPress={handleContinue}
            />
          </ThemedView>
        ) : null}
      </SafeAreaView>
    </ThemedView>
  );
}

function AnimatedProgressBar({ progress }: { progress: number }) {
  const theme = useTheme();
  const width = useSharedValue(progress);

  useEffect(() => {
    width.value = withTiming(progress, {
      duration: 480,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <ThemedView
      style={[styles.progressTrack, { backgroundColor: theme.border }]}
    >
      <Animated.View
        style={[
          styles.progressFill,
          { backgroundColor: theme.primary },
          animatedStyle,
        ]}
      />
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
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: Radius.full,
  },
  content: {
    flex: 1,
  },
  stepWrap: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xxl,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
});

import { useMutation } from "convex/react";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useMemo } from "react";

import { api } from "../../convex/_generated/api";
import { useGuestStore } from "@/stores/guest-store";
import { useOnboardingFlowStore } from "@/stores/onboarding-flow-store";

export function useCompleteOnboarding() {
  const router = useRouter();
  const completeAuthOnboarding = useMutation(api.auth.completeOnboarding);
  const upsertOnboardingProfile = useMutation(
    api.users.upsertOnboardingProfile,
  );

  const guestId = useGuestStore((state) => state.guestId);
  const completeOnboarding = useGuestStore((state) => state.completeOnboarding);
  const expoPushToken = useGuestStore((state) => state.expoPushToken);
  const notificationsEnabled = useGuestStore(
    (state) => state.notificationsEnabled,
  );
  const selectedGoals = useOnboardingFlowStore((state) => state.selectedGoals);
  const selectedSources = useOnboardingFlowStore(
    (state) => state.selectedSources,
  );
  const selectedReminderMoments = useOnboardingFlowStore(
    (state) => state.selectedReminderMoments,
  );
  const heardFrom = useOnboardingFlowStore((state) => state.heardFrom);
  const ageRange = useOnboardingFlowStore((state) => state.ageRange);
  const resetFlow = useOnboardingFlowStore((state) => state.resetFlow);

  const localOnboardingArgs = useMemo(
    () => ({
      guestId,
      selectedGoals,
      selectedSources,
      selectedReminderMoments,
      ...(heardFrom ? { heardFrom } : {}),
      ...(ageRange ? { ageRange } : {}),
      ...(expoPushToken ? { expoPushToken } : {}),
      notificationsEnabled,
    }),
    [
      ageRange,
      expoPushToken,
      guestId,
      heardFrom,
      notificationsEnabled,
      selectedGoals,
      selectedReminderMoments,
      selectedSources,
    ],
  );

  const authOnboardingArgs = useMemo(
    () => ({
      selectedGoals,
      selectedSources,
      selectedReminderMoments,
      ...(heardFrom ? { heardFrom } : {}),
      ...(ageRange ? { ageRange } : {}),
      ...(expoPushToken ? { expoPushToken } : {}),
      notificationsEnabled,
    }),
    [
      ageRange,
      expoPushToken,
      heardFrom,
      notificationsEnabled,
      selectedGoals,
      selectedReminderMoments,
      selectedSources,
    ],
  );

  const goHome = () => {
    completeOnboarding(localOnboardingArgs);
    resetFlow();
    router.replace("/(tabs)/cookbooks" as any);
  };

  const finishGuest = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await upsertOnboardingProfile(localOnboardingArgs);
    } catch {
      // Guest onboarding stays local if Convex is unavailable.
    }

    goHome();
  };

  const finishAccount = async (token: string) => {
    await completeAuthOnboarding({
      token,
      ...authOnboardingArgs,
    });

    goHome();
  };

  return {
    finishAccount,
    finishGuest,
  };
}

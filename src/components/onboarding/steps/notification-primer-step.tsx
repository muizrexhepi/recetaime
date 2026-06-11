import { IconBell, IconChefHatFilled } from "@tabler/icons-react-native";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { useState } from "react";
import { Platform, Pressable, StyleSheet } from "react-native";

import { OnboardingHeading } from "@/components/onboarding/onboarding-heading";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useGuestStore } from "@/stores/guest-store";
import { useOnboardingFlowStore } from "@/stores/onboarding-flow-store";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function NotificationPrimerStep() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const nextStep = useOnboardingFlowStore((state) => state.nextStep);
  const setNotificationPreference = useGuestStore(
    (state) => state.setNotificationPreference,
  );

  const handleActivate = async () => {
    if (loading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setMessage(null);

    try {
      const result = await registerForPushNotificationsAsync();

      setNotificationPreference({
        enabled: result.status === "granted",
        permissionStatus: result.status,
        expoPushToken: result.expoPushToken,
      });

      nextStep();
    } catch (error) {
      setNotificationPreference({
        enabled: false,
        permissionStatus: "error",
      });
      setMessage(
        error instanceof Error
          ? error.message
          : "Nuk mundëm t’i aktivizojmë kujtesat tani.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNotNow = () => {
    Haptics.selectionAsync();
    setNotificationPreference({
      enabled: false,
      permissionStatus: "skipped",
    });
    nextStep();
  };

  return (
    <ThemedView transparent style={styles.screen}>
      <OnboardingHeading
        title="Kujtesa në momentin e duhur"
        subtitle="Mund t’i ndalosh kurdo."
      />

      <ThemedCard variant="outline" style={styles.notificationCard}>
        <ThemedView
          style={[styles.appIcon, { backgroundColor: theme.primarySoft }]}
        >
          <IconChefHatFilled size={30} color={theme.primary} />
        </ThemedView>

        <ThemedView transparent style={styles.notificationText}>
          <ThemedText style={styles.notificationTitle}>
            {'"Receta Ime" dëshiron të të dërgojë kujtesa'}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.body}>
            Për plan vaktesh dhe receta që do t’i gatuash më vonë.
          </ThemedText>
        </ThemedView>

        <ThemedView
          style={[styles.permissionRow, { backgroundColor: theme.cardMuted }]}
        >
          <IconBell size={20} color={theme.textSecondary} strokeWidth={2.4} />
          <ThemedText themeColor="textSecondary" style={styles.permissionText}>
            Do të shfaqet kërkesa zyrtare e telefonit.
          </ThemedText>
        </ThemedView>
      </ThemedCard>

      <ThemedView transparent style={styles.actions}>
        <ThemedButton
          title="Aktivizo kujtesat"
          loading={loading}
          onPress={handleActivate}
        />

        <Pressable onPress={handleNotNow} hitSlop={12} style={styles.notNow}>
          <ThemedText themeColor="textSecondary" style={styles.notNowText}>
            Jo tani
          </ThemedText>
        </Pressable>
      </ThemedView>

      {message ? (
        <ThemedText themeColor="danger" style={styles.message}>
          {message}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("meal-reminders", {
      name: "Kujtesa vaktesh",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180, 120, 180],
      lightColor: "#E94B35",
    });
  }

  const existingPermission = await Notifications.getPermissionsAsync();
  let status = existingPermission.status;

  if (status !== "granted") {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    status = requestedPermission.status;
  }

  if (status !== "granted") {
    return { status };
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    throw new Error("Mungon Expo projectId për push notifications.");
  }

  const expoPushToken = (
    await Notifications.getExpoPushTokenAsync({ projectId })
  ).data;

  return {
    status,
    expoPushToken,
  };
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    alignItems: "center",
  },
  notificationCard: {
    width: "100%",
    marginTop: Spacing.xl,
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.lg,
  },
  appIcon: {
    width: 62,
    height: 62,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationText: {
    gap: Spacing.sm,
  },
  notificationTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "900",
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
    textAlign: "center",
  },
  permissionRow: {
    width: "100%",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  permissionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  actions: {
    width: "100%",
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  notNow: {
    alignSelf: "center",
    paddingVertical: Spacing.sm,
  },
  notNowText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "800",
  },
  message: {
    marginTop: Spacing.md,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    textAlign: "center",
  },
});

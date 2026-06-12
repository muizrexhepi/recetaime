import {
  IconBell,
  IconChevronLeft,
  IconCrown,
  IconHelp,
  IconLanguage,
  IconPalette,
  IconRefresh,
  IconSettings,
  IconShieldLock,
  IconUserPlus,
} from "@tabler/icons-react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SettingsRow } from "@/components/settings/settings-row";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { useGuestStore } from "@/stores/guest-store";
import { useOnboardingFlowStore } from "@/stores/onboarding-flow-store";

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();

  const auth = useAuth() as any;
  const hasAccount = Boolean(
    auth?.isAuthenticated || auth?.user || auth?.token,
  );

  const resetGuest = useGuestStore((state) => state.resetGuest);
  const resetFlow = useOnboardingFlowStore((state) => state.resetFlow);

  const handleResetOnboarding = () => {
    Alert.alert(
      "Rinis onboarding?",
      "Kjo do ta pastrojë testimin lokal dhe do ta hapë onboarding-un nga fillimi.",
      [
        { text: "Anulo", style: "cancel" },
        {
          text: "Rinis",
          style: "destructive",
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            resetFlow();
            resetGuest();
            router.replace("/onboarding" as any);
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert("Dil nga llogaria?", "Do të dalësh nga kjo pajisje.", [
      { text: "Anulo", style: "cancel" },
      {
        text: "Dil",
        style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

          if (typeof auth?.signOut === "function") {
            await auth.signOut();
          } else if (typeof auth?.logout === "function") {
            await auth.logout();
          } else {
            resetGuest();
          }

          router.replace("/onboarding" as any);
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <ThemedView transparent style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            {
              backgroundColor: theme.surface,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <IconChevronLeft
            size={30}
            color={theme.textPrimary}
            strokeWidth={2.6}
          />
        </Pressable>

        <ThemedText type="title" style={styles.headerTitle}>
          Settings
        </ThemedText>

        <ThemedView transparent style={styles.headerSpacer} />
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ThemedView transparent style={styles.section}>
          {!hasAccount ? (
            <SettingsRow
              icon={
                <IconUserPlus
                  size={22}
                  color={theme.textSecondary}
                  strokeWidth={2.2}
                />
              }
              title="Krijo llogari"
              subtitle="Ruaji recetat që të mos humbin."
              onPress={() => router.push("/onboarding/create-account" as any)}
            />
          ) : (
            <SettingsRow
              icon={
                <IconShieldLock
                  size={22}
                  color={theme.textSecondary}
                  strokeWidth={2.2}
                />
              }
              title="Llogaria ime"
              subtitle="Menaxho profilin dhe sigurinë."
            />
          )}

          <SettingsRow
            icon={
              <IconCrown
                size={22}
                color={theme.textSecondary}
                strokeWidth={2.2}
              />
            }
            title="Abonimi im"
          />

          <SettingsRow
            icon={
              <IconLanguage
                size={22}
                color={theme.textSecondary}
                strokeWidth={2.2}
              />
            }
            title="Gjuha"
          />

          <SettingsRow
            icon={
              <IconSettings
                size={22}
                color={theme.textSecondary}
                strokeWidth={2.2}
              />
            }
            title="Preferencat"
          />

          <SettingsRow
            icon={
              <IconPalette
                size={22}
                color={theme.textSecondary}
                strokeWidth={2.2}
              />
            }
            title="Ikona e aplikacionit"
          />

          <SettingsRow
            icon={
              <IconBell
                size={22}
                color={theme.textSecondary}
                strokeWidth={2.2}
              />
            }
            title="Kujtesat"
          />

          <SettingsRow
            icon={
              <IconHelp
                size={22}
                color={theme.textSecondary}
                strokeWidth={2.2}
              />
            }
            title="Ndihmë"
          />
        </ThemedView>

        <ThemedView transparent style={styles.section}>
          <SettingsRow
            icon={
              <IconRefresh size={22} color={theme.primary} strokeWidth={2.2} />
            }
            title="Rinis onboarding"
            subtitle="Për testim gjatë zhvillimit."
            onPress={handleResetOnboarding}
          />

          <SettingsRow
            icon={
              <IconSettings
                size={22}
                color={theme.textSecondary}
                strokeWidth={2.2}
              />
            }
            title="Debug"
            subtitle="Opsione të përkohshme zhvillimi."
          />
        </ThemedView>

        <ThemedButton
          title={hasAccount ? "Dil" : "Pastro testimin"}
          onPress={hasAccount ? handleLogout : handleResetOnboarding}
          variant="primary"
          style={styles.logoutButton}
        />

        <ThemedText
          type="subhead"
          themeColor="textTertiary"
          style={styles.version}
        >
          Version 1.0.0
        </ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 92,
    paddingHorizontal: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(39, 31, 23, 0.10)",
  },
  backButton: {
    width: 58,
    height: 58,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 22,
    lineHeight: 28,
  },
  headerSpacer: {
    width: 58,
    height: 58,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: 140,
  },
  section: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(39, 31, 23, 0.10)",
  },
  logoutButton: {
    marginTop: Spacing.xxxl,
    alignSelf: "center",
    width: "78%",
  },
  version: {
    marginTop: Spacing.xxl,
    textAlign: "center",
  },
});

import {
  IconBell,
  IconChevronRight,
  IconCrown,
  IconHelp,
  IconLanguage,
  IconLogout,
  IconRefresh,
  IconSettings,
  IconShieldLock,
  IconUser,
} from "@tabler/icons-react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet } from "react-native";

import { TabScreenHeader } from "@/components/tabs/tab-screen-header";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { useGuestStore } from "@/stores/guest-store";
import { useOnboardingFlowStore } from "@/stores/onboarding-flow-store";

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useTheme();

  const { isAuthenticated, user } = useAuth();
  const guestId = useGuestStore((state) => state.guestId);
  const resetGuest = useGuestStore((state) => state.resetGuest);
  const resetFlow = useOnboardingFlowStore((state) => state.resetFlow);

  const displayName = isAuthenticated
    ? (user?.email ?? "Llogaria jote")
    : shortGuestName(guestId);

  const resetOnboarding = () => {
    Alert.alert(
      "Rinis onboarding?",
      "Kjo do ta pastrojë testimin lokal dhe do të kthejë aplikacionin në fillim.",
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

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <TabScreenHeader
          title="Profili"
          subtitle="Llogaria, gjuha dhe preferencat."
        />

        <ThemedView transparent style={styles.profileRow}>
          <ThemedView
            style={[styles.avatar, { backgroundColor: theme.primarySoft }]}
          >
            <IconUser size={30} color={theme.primary} strokeWidth={2.1} />
          </ThemedView>

          <ThemedView transparent style={styles.profileText}>
            <ThemedText type="subtitle" style={styles.name} numberOfLines={1}>
              {displayName}
            </ThemedText>

            <Pressable>
              <ThemedText
                type="default"
                style={[styles.createAccount, { color: theme.primary }]}
              >
                {isAuthenticated ? "Llogari aktive" : "Krijo llogari"}
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>

        <ThemedCard style={styles.upgradeCard}>
          <ThemedView
            style={[styles.upgradeIcon, { backgroundColor: theme.goldSoft }]}
          >
            <IconCrown size={22} color={theme.gold} strokeWidth={2.2} />
          </ThemedView>

          <ThemedView transparent style={styles.upgradeText}>
            <ThemedText type="smallBold" style={styles.upgradeTitle}>
              Receta Ime Pro
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Importime pa limit, plan vaktesh dhe lista më të mençura.
            </ThemedText>
          </ThemedView>

          <IconChevronRight
            size={20}
            color={theme.textTertiary}
            strokeWidth={2.1}
          />
        </ThemedCard>

        <ThemedView transparent style={styles.section}>
          <SettingsRow
            icon={
              <IconShieldLock
                size={21}
                color={theme.textSecondary}
                strokeWidth={2.1}
              />
            }
            title="Krijo llogari"
            subtitle="Ruaji recetat që të mos humbin."
          />

          <SettingsRow
            icon={
              <IconCrown
                size={21}
                color={theme.textSecondary}
                strokeWidth={2.1}
              />
            }
            title="Abonimi im"
          />

          <SettingsRow
            icon={
              <IconLanguage
                size={21}
                color={theme.textSecondary}
                strokeWidth={2.1}
              />
            }
            title="Gjuha"
          />

          <SettingsRow
            icon={
              <IconBell
                size={21}
                color={theme.textSecondary}
                strokeWidth={2.1}
              />
            }
            title="Kujtesat"
          />

          <SettingsRow
            icon={
              <IconSettings
                size={21}
                color={theme.textSecondary}
                strokeWidth={2.1}
              />
            }
            title="Preferencat"
          />

          <SettingsRow
            icon={
              <IconHelp
                size={21}
                color={theme.textSecondary}
                strokeWidth={2.1}
              />
            }
            title="Ndihmë"
          />
        </ThemedView>

        <ThemedButton
          title="Rinis onboarding"
          variant="secondary"
          onPress={resetOnboarding}
        />

        <Pressable
          onPress={resetOnboarding}
          style={({ pressed }) => [
            styles.resetButton,
            {
              opacity: pressed ? 0.72 : 1,
            },
          ]}
        >
          <IconRefresh size={19} color={theme.primary} strokeWidth={2.2} />
          <ThemedText
            type="smallBold"
            style={[styles.resetText, { color: theme.primary }]}
          >
            Pastro testimin
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={resetOnboarding}
          style={({ pressed }) => [
            styles.logoutButton,
            {
              opacity: pressed ? 0.72 : 1,
            },
          ]}
        >
          <IconLogout size={19} color={theme.danger} strokeWidth={2.2} />
          <ThemedText
            type="smallBold"
            style={[styles.logoutText, { color: theme.danger }]}
          >
            Dil
          </ThemedText>
        </Pressable>

        <ThemedText
          type="small"
          themeColor="textTertiary"
          style={styles.version}
        >
          Version 1.0.0
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  const theme = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.78 : 1 }]}
    >
      <ThemedView
        style={[styles.rowIcon, { backgroundColor: theme.cardMuted }]}
      >
        {icon}
      </ThemedView>

      <ThemedView transparent style={styles.rowText}>
        <ThemedText type="default" style={styles.rowTitle}>
          {title}
        </ThemedText>

        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </ThemedView>

      <IconChevronRight
        size={19}
        color={theme.textTertiary}
        strokeWidth={2.1}
      />
    </Pressable>
  );
}

function shortGuestName(guestId?: string) {
  if (!guestId) return "Mysafir";
  const suffix = guestId.split("_").at(-1)?.slice(0, 5);
  return suffix ? `mysafir-${suffix}` : "Mysafir";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: 140,
  },
  profileRow: {
    marginTop: Spacing.xxl,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  profileText: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  createAccount: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
  upgradeCard: {
    marginTop: Spacing.xxl,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  upgradeIcon: {
    width: 46,
    height: 46,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeText: {
    flex: 1,
    gap: 2,
  },
  upgradeTitle: {
    fontSize: 17,
    lineHeight: 22,
  },
  section: {
    marginTop: Spacing.xxl,
    gap: Spacing.xs,
  },
  row: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "600",
  },
  resetButton: {
    marginTop: Spacing.lg,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  resetText: {
    fontSize: 15,
    lineHeight: 20,
  },
  logoutButton: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  logoutText: {
    fontSize: 15,
    lineHeight: 20,
  },
  version: {
    marginTop: Spacing.xl,
    textAlign: "center",
  },
});

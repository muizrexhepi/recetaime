import {
  IconBell,
  IconChevronRight,
  IconCrown,
  IconHelp,
  IconLanguage,
  IconRefresh,
  IconShieldLock,
  IconUser,
  IconUserPlus,
} from "@tabler/icons-react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Alert, Pressable, StyleSheet } from "react-native";

import { TabScreen } from "@/components/tabs/tab-screen";
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

  const auth = useAuth() as any;
  const hasAccount = Boolean(
    auth?.isAuthenticated || auth?.user || auth?.token,
  );

  const guestId = useGuestStore((state) => state.guestId);
  const resetGuest = useGuestStore((state) => state.resetGuest);
  const resetFlow = useOnboardingFlowStore((state) => state.resetFlow);

  const displayName = hasAccount
    ? getUserName(auth?.user)
    : getGuestName(guestId);

  const handleCreateAccount = () => {
    router.push("/onboarding/create-account" as any);
  };

  const handleSubscription = () => {
    router.push("/paywall" as any);
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
          }

          router.replace("/onboarding" as any);
        },
      },
    ]);
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      "Rinis onboarding?",
      "Kjo është vetëm për testim gjatë zhvillimit.",
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
    <TabScreen>
      <ThemedView transparent style={styles.profileHeader}>
        <ThemedView
          style={[styles.avatar, { backgroundColor: theme.primarySoft }]}
        >
          <IconUser size={34} color={theme.primary} strokeWidth={2.15} />
        </ThemedView>

        <ThemedText type="title" style={styles.name} numberOfLines={1}>
          {displayName}
        </ThemedText>

        {!hasAccount ? (
          <Pressable onPress={handleCreateAccount} hitSlop={10}>
            <ThemedText type="bodyMedium" style={{ color: theme.primary }}>
              Krijo llogari
            </ThemedText>
          </Pressable>
        ) : (
          <ThemedText type="subhead" themeColor="textSecondary">
            Llogari aktive
          </ThemedText>
        )}
      </ThemedView>

      <Pressable onPress={handleSubscription}>
        <ThemedCard style={styles.proCard}>
          <ThemedView
            style={[styles.proIcon, { backgroundColor: theme.goldSoft }]}
          >
            <IconCrown size={24} color={theme.gold} strokeWidth={2.25} />
          </ThemedView>

          <ThemedView transparent style={styles.proCopy}>
            <ThemedText type="cardTitle">Receta Ime Pro</ThemedText>
            <ThemedText type="subhead" themeColor="textSecondary">
              Importime pa limit, AI më i mirë dhe mjete të avancuara.
            </ThemedText>
          </ThemedView>

          <IconChevronRight
            size={21}
            color={theme.textTertiary}
            strokeWidth={2.2}
          />
        </ThemedCard>
      </Pressable>

      <ThemedView transparent style={styles.section}>
        {!hasAccount ? (
          <ProfileRow
            icon={
              <IconUserPlus
                size={22}
                color={theme.textSecondary}
                strokeWidth={2.2}
              />
            }
            title="Krijo llogari"
            subtitle="Ruaji recetat që të mos humbin."
            onPress={handleCreateAccount}
          />
        ) : null}

        <ProfileRow
          icon={
            <IconShieldLock
              size={22}
              color={theme.textSecondary}
              strokeWidth={2.2}
            />
          }
          title="Abonimi im"
          onPress={handleSubscription}
        />

        <ProfileRow
          icon={
            <IconLanguage
              size={22}
              color={theme.textSecondary}
              strokeWidth={2.2}
            />
          }
          title="Gjuha"
        />

        <ProfileRow
          icon={
            <IconBell size={22} color={theme.textSecondary} strokeWidth={2.2} />
          }
          title="Kujtesat"
        />

        <ProfileRow
          icon={
            <IconHelp size={22} color={theme.textSecondary} strokeWidth={2.2} />
          }
          title="Ndihmë"
        />
      </ThemedView>

      {__DEV__ ? (
        <ThemedView transparent style={styles.section}>
          <ProfileRow
            icon={
              <IconRefresh size={22} color={theme.primary} strokeWidth={2.2} />
            }
            title="Rinis onboarding"
            subtitle="Vetëm për testim gjatë zhvillimit."
            onPress={handleResetOnboarding}
          />
        </ThemedView>
      ) : null}

      {hasAccount ? (
        <ThemedButton
          title="Dil"
          variant="primary"
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      ) : null}

      <ThemedText
        type="subhead"
        themeColor="textTertiary"
        style={styles.version}
      >
        Version 1.0.0
      </ThemedText>
    </TabScreen>
  );
}

function ProfileRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          opacity: pressed ? 0.65 : 1,
        },
      ]}
    >
      <ThemedView style={[styles.rowIcon, { backgroundColor: theme.surface }]}>
        {icon}
      </ThemedView>

      <ThemedView transparent style={styles.rowCopy}>
        <ThemedText type="bodyMedium" style={styles.rowTitle}>
          {title}
        </ThemedText>

        {subtitle ? (
          <ThemedText type="subhead" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </ThemedView>

      <IconChevronRight
        size={20}
        color={theme.textTertiary}
        strokeWidth={2.2}
      />
    </Pressable>
  );
}

function getUserName(user: unknown) {
  const anyUser = user as any;

  return (
    anyUser?.name ?? anyUser?.fullName ?? anyUser?.email ?? "Llogaria jote"
  );
}

function getGuestName(guestId?: string) {
  const suffix = guestId?.split("_").at(-1)?.slice(0, 3);

  if (!suffix) return "mysafir";

  return `mysafir-${suffix}`;
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: "center",
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.xs,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  name: {
    fontSize: 24,
    lineHeight: 30,
    textAlign: "center",
  },
  proCard: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  proIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  proCopy: {
    flex: 1,
    gap: 2,
  },
  section: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(39, 31, 23, 0.10)",
  },
  row: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  rowIcon: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 20,
    lineHeight: 26,
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

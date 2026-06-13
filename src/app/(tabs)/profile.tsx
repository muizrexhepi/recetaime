import {
  IconChevronRight,
  IconCrown,
  IconHelp,
  IconSettings,
  IconShare3,
  IconUser,
} from "@tabler/icons-react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Pressable, Share, StyleSheet, View } from "react-native";

import { TabScreen } from "@/components/tabs/tab-screen";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { useGuestStore } from "@/stores/guest-store";

const APP_URL = "https://recetaime.com";

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useTheme();

  const auth = useAuth() as any;
  const hasAccount = Boolean(
    auth?.isAuthenticated || auth?.user || auth?.token,
  );

  const guestId = useGuestStore((state) => state.guestId);

  const t = theme as any;
  const surface = t.surface ?? "#F7F6F2";
  const primarySoft = t.primarySoft ?? surface;
  const borderLight = t.borderLight ?? theme.border;
  const textSecondary = t.textSecondary ?? "#756F66";
  const textTertiary = t.textTertiary ?? textSecondary;
  const gold = t.gold ?? "#D89A22";
  const goldSoft = t.goldSoft ?? "#FFF4D6";

  const displayName = hasAccount
    ? getUserName(auth?.user)
    : getGuestName(guestId);

  const handleCreateAccount = () => {
    Haptics.selectionAsync();
    router.push("/onboarding/create-account" as any);
  };

  const handleSubscription = () => {
    Haptics.selectionAsync();
    router.push("/paywall" as any);
  };

  const handleSettings = () => {
    Haptics.selectionAsync();
    router.push("/settings" as any);
  };

  const handleHelp = () => {
    Haptics.selectionAsync();
    router.push("/settings" as any);
  };

  const handleShare = async () => {
    Haptics.selectionAsync();

    await Share.share({
      title: "Receta Ime",
      message:
        "Provoje Receta Ime — ruaj receta nga TikTok, Instagram, YouTube, foto ose tekst në një vend.\n\n" +
        APP_URL,
      url: APP_URL,
    });
  };

  return (
    <TabScreen>
      <ThemedView transparent style={styles.profileHeader}>
        <View style={[styles.avatar, { backgroundColor: primarySoft }]}>
          <IconUser size={34} color={theme.primary} strokeWidth={2.15} />
        </View>

        <ThemedText type="title" style={styles.name} numberOfLines={1}>
          {displayName}
        </ThemedText>

        {hasAccount ? (
          <View
            style={[
              styles.statusPill,
              { backgroundColor: surface, borderColor: borderLight },
            ]}
          >
            <ThemedText style={[styles.statusText, { color: textSecondary }]}>
              Llogari aktive
            </ThemedText>
          </View>
        ) : (
          <Pressable onPress={handleCreateAccount} hitSlop={10}>
            <ThemedText
              style={[styles.createAccount, { color: theme.primary }]}
            >
              Krijo llogari
            </ThemedText>
          </Pressable>
        )}
      </ThemedView>

      <View style={[styles.sectionLine, { backgroundColor: borderLight }]} />

      <ProfileRow
        icon={
          <View style={[styles.proIconBox, { backgroundColor: goldSoft }]}>
            <IconCrown size={23} color={gold} strokeWidth={2.25} />
          </View>
        }
        title="Receta Ime Pro"
        subtitle="Importime pa limit, kalori & makro, plan vaktesh."
        onPress={handleSubscription}
        elevated
      />

      <View style={[styles.sectionLine, { backgroundColor: borderLight }]} />

      <ProfileRow
        icon={
          <View style={[styles.iconBox, { backgroundColor: surface }]}>
            <IconShare3 size={21} color={textSecondary} strokeWidth={2.2} />
          </View>
        }
        title="Fto miq"
        subtitle="Dërgo Receta Ime te dikush që ruan receta."
        onPress={handleShare}
      />

      <ProfileRow
        icon={
          <View style={[styles.iconBox, { backgroundColor: surface }]}>
            <IconHelp size={21} color={textSecondary} strokeWidth={2.2} />
          </View>
        }
        title="Ndihmë"
        subtitle="Kontakt, feedback, privacy dhe terms."
        onPress={handleHelp}
      />

      <ProfileRow
        icon={
          <View style={[styles.iconBox, { backgroundColor: surface }]}>
            <IconSettings size={21} color={textSecondary} strokeWidth={2.2} />
          </View>
        }
        title="Cilësimet"
        subtitle="Llogaria, abonimi dhe preferencat."
        onPress={handleSettings}
      />

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
  elevated,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  elevated?: boolean;
}) {
  const theme = useTheme();

  const t = theme as any;
  const borderLight = t.borderLight ?? theme.border;
  const textTertiary = t.textTertiary ?? theme.textSecondary;
  const primarySoft = t.primarySoft ?? "#F7F6F2";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          borderBottomColor: borderLight,
          opacity: pressed ? 0.58 : 1,
        },
        elevated
          ? [
              styles.proRow,
              {
                backgroundColor: primarySoft,
                borderColor: "rgba(239, 74, 56, 0.18)",
              },
            ]
          : null,
      ]}
    >
      {icon}

      <View style={styles.rowCopy}>
        <ThemedText style={styles.rowTitle}>{title}</ThemedText>

        {subtitle ? (
          <ThemedText
            type="subhead"
            themeColor="textSecondary"
            style={styles.rowSubtitle}
          >
            {subtitle}
          </ThemedText>
        ) : null}
      </View>

      <IconChevronRight size={21} color={textTertiary} strokeWidth={2.3} />
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

  if (!suffix) return "Mysafir";

  return `Mysafir-${suffix}`;
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: "center",
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.xs,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  name: {
    maxWidth: "90%",
    fontSize: 31,
    lineHeight: 38,
    textAlign: "center",
  },
  statusPill: {
    marginTop: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  statusText: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "800",
  },
  createAccount: {
    marginTop: Spacing.xs,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "800",
  },
  sectionLine: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: -Spacing.xl,
  },
  row: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  proRow: {
    minHeight: 92,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  proIconBox: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "800",
  },
  rowSubtitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },
  version: {
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xxl,
    textAlign: "center",
  },
});

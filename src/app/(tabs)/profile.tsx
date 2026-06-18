import {
  IconChevronRight,
  IconCrown,
  IconHelp,
  IconSettings,
  IconShare3,
  IconUser,
  IconUserPlus,
} from "@tabler/icons-react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Pressable, Share, StyleSheet, View } from "react-native";

import { TabScreen } from "@/components/tabs/tab-screen";
import { TabScreenHeader } from "@/components/tabs/tab-screen-header";
import { ThemedText } from "@/components/ui/themed-text";
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
  const paper = t.paper ?? "#FFFFFF";
  const primarySoft = t.primarySoft ?? "#FFF0ED";
  const borderLight = t.borderLight ?? theme.border;
  const textSecondary = t.textSecondary ?? "#756F66";
  const textTertiary = t.textTertiary ?? textSecondary;
  const gold = t.gold ?? "#D89A22";
  const goldSoft = t.goldSoft ?? "#FFF4D6";

  const displayName = hasAccount
    ? getUserName(auth?.user)
    : getGuestName(guestId);

  const handleCreateAccount = () => {
    void Haptics.selectionAsync();
    router.push("/onboarding/create-account" as any);
  };

  const handleSubscription = () => {
    void Haptics.selectionAsync();
    router.push("/paywall" as any);
  };

  const handleSettings = () => {
    void Haptics.selectionAsync();
    router.push("/settings" as any);
  };

  const handleHelp = () => {
    void Haptics.selectionAsync();
    router.push("/settings" as any);
  };

  const handleShare = async () => {
    void Haptics.selectionAsync();

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
      <TabScreenHeader title="Profili" />

      <View
        style={[
          styles.accountCard,
          {
            backgroundColor: paper,
            borderColor: borderLight,
          },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: primarySoft }]}>
          <IconUser size={30} color={theme.primary} strokeWidth={2.2} />
        </View>

        <View style={styles.accountCopy}>
          <ThemedText style={styles.name} numberOfLines={1}>
            {displayName}
          </ThemedText>

          <ThemedText
            style={[styles.accountSubtitle, { color: textSecondary }]}
          >
            {hasAccount
              ? "Llogari aktive"
              : "Je duke përdorur aplikacionin si mysafir."}
          </ThemedText>
        </View>
      </View>

      {!hasAccount ? (
        <Pressable
          onPress={handleCreateAccount}
          style={({ pressed }) => [
            styles.createAccountCard,
            {
              backgroundColor: primarySoft,
              borderColor: "rgba(239, 74, 56, 0.18)",
              opacity: pressed ? 0.78 : 1,
            },
          ]}
        >
          <View style={[styles.createIcon, { backgroundColor: theme.primary }]}>
            <IconUserPlus size={22} color="#FFFFFF" strokeWidth={2.3} />
          </View>

          <View style={styles.rowCopy}>
            <ThemedText style={styles.rowTitle}>Krijo llogari</ThemedText>

            <ThemedText style={[styles.rowSubtitle, { color: textSecondary }]}>
              Ruaji recetat në cloud dhe mos i humb.
            </ThemedText>
          </View>

          <IconChevronRight size={21} color={theme.primary} strokeWidth={2.3} />
        </Pressable>
      ) : null}

      <View style={styles.section}>
        <ProfileRow
          icon={
            <View style={[styles.proIconBox, { backgroundColor: goldSoft }]}>
              <IconCrown size={23} color={gold} strokeWidth={2.25} />
            </View>
          }
          title="Receta Ime Pro"
          subtitle="Importime pa limit, koleksione dhe veçori premium."
          onPress={handleSubscription}
          elevated
        />
      </View>

      <View style={styles.section}>
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
          last
        />
      </View>

      <ThemedText style={[styles.version, { color: textTertiary }]}>
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
  last,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  elevated?: boolean;
  last?: boolean;
}) {
  const theme = useTheme();

  const t = theme as any;
  const paper = t.paper ?? "#FFFFFF";
  const borderLight = t.borderLight ?? theme.border;
  const textSecondary = t.textSecondary ?? "#756F66";
  const textTertiary = t.textTertiary ?? theme.textSecondary;
  const primarySoft = t.primarySoft ?? "#FFF0ED";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: elevated ? primarySoft : paper,
          borderBottomColor: last || elevated ? "transparent" : borderLight,
          opacity: pressed ? 0.68 : 1,
        },
        elevated
          ? [
              styles.proRow,
              {
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
          <ThemedText style={[styles.rowSubtitle, { color: textSecondary }]}>
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
  accountCard: {
    marginTop: Spacing.xl,
    minHeight: 88,
    borderRadius: Radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  accountCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  accountSubtitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },
  createAccountCard: {
    marginTop: Spacing.md,
    minHeight: 78,
    borderRadius: Radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  createIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginTop: Spacing.xl,
    borderRadius: Radius.xxl,
    overflow: "hidden",
  },
  row: {
    minHeight: 78,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  proRow: {
    minHeight: 92,
    borderRadius: Radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
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
    minWidth: 0,
    gap: 2,
  },
  rowTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900",
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
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
});

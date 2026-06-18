import {
  IconBell,
  IconChevronRight,
  IconCrown,
  IconHelp,
  IconMail,
  IconRotateClockwise,
  IconShieldLock,
  IconTrash,
  IconUserPlus,
} from "@tabler/icons-react-native";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/themed-text";
import { colors, Fonts, Radius, Shadows, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { registerForPushNotificationsAsync } from "@/lib/notifications";
import { useAuth } from "@/providers/auth-provider";
import { useGuestStore } from "@/stores/guest-store";
import { useOnboardingFlowStore } from "@/stores/onboarding-flow-store";
import { api } from "../../../convex/_generated/api";

const SUPPORT_EMAIL = "support@recetaime.com";
const PRIVACY_URL = "https://recetaime.com/privacy";
const TERMS_URL = "https://recetaime.com/terms";

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();

  const auth = useAuth() as any;
  const hasAccount = Boolean(
    auth?.isAuthenticated || auth?.user || auth?.token,
  );

  const resetGuest = useGuestStore((state) => state.resetGuest);
  const notificationsEnabled = useGuestStore(
    (state) => state.notificationsEnabled,
  );
  const setNotificationPreference = useGuestStore(
    (state) => state.setNotificationPreference,
  );
  const resetFlow = useOnboardingFlowStore((state) => state.resetFlow);
  const updateNotificationSettings = useMutation(
    api.auth.updateNotificationSettings,
  );

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const t = theme as any;
  const paper = t.paper ?? "#FFFFFF";
  const borderLight = t.borderLight ?? "rgba(39,31,23,0.08)";
  const textSecondary = t.textSecondary ?? "#756F66";
  const textTertiary = t.textTertiary ?? "#9B938A";
  const primarySoft = t.primarySoft ?? "#FFF0ED";
  const gold = t.gold ?? "#D89A22";

  const handleCreateAccount = () => {
    void Haptics.selectionAsync();
    router.push("/onboarding/create-account" as any);
  };

  const handleSubscription = () => {
    void Haptics.selectionAsync();
    router.push("/paywall" as any);
  };

  const handleRestorePurchases = async () => {
    void Haptics.selectionAsync();

    if (typeof auth?.restorePurchases === "function") {
      await auth.restorePurchases();
      Alert.alert("U kontrollua", "Blerjet u kontrolluan me sukses.");
      return;
    }

    Alert.alert(
      "Rikthe blerjet",
      "Kjo do të lidhet me RevenueCat kur ta aktivizosh abonimin.",
    );
  };

  const handleNotifications = async () => {
    if (notificationsLoading) return;

    void Haptics.selectionAsync();
    setNotificationsLoading(true);

    try {
      const result = await registerForPushNotificationsAsync();
      const enabled = result.status === "granted";

      setNotificationPreference({
        enabled,
        permissionStatus: result.status,
        expoPushToken: result.expoPushToken,
      });

      if (auth?.token) {
        await updateNotificationSettings({
          token: auth.token,
          notificationsEnabled: enabled,
          permissionStatus: result.status,
          ...(result.expoPushToken
            ? { expoPushToken: result.expoPushToken }
            : {}),
        });
      }

      Alert.alert(
        enabled ? "Kujtesat u aktivizuan" : "Kujtesat nuk u aktivizuan",
        enabled
          ? "Do të mund të marrësh kujtesa për recetat dhe përgatitjen."
          : "Mund t’i lejosh më vonë nga cilësimet e telefonit.",
        enabled
          ? [{ text: "Në rregull" }]
          : [
              { text: "Anulo", style: "cancel" },
              { text: "Hap cilësimet", onPress: () => void Linking.openSettings() },
            ],
      );
    } catch {
      Alert.alert("Nuk u aktivizuan kujtesat", "Provo përsëri pas pak.");
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleSupport = () => {
    void Haptics.selectionAsync();

    const subject = encodeURIComponent("Ndihmë me Receta Ime");
    const body = encodeURIComponent(
      "Përshëndetje,\n\nKam nevojë për ndihmë me Receta Ime.\n\n",
    );

    void Linking.openURL(
      `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`,
    );
  };

  const openUrl = (url: string) => {
    void Haptics.selectionAsync();
    void Linking.openURL(url);
  };

  const performLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      /*
        Clear local guest/onboarding state before auth is cleared.
        Otherwise the root guard can briefly see "signed out + completed guest"
        and keep the user inside tabs.
      */
      resetFlow();
      resetGuest();

      if (typeof auth?.signOut === "function") {
        await auth.signOut();
      } else if (typeof auth?.logout === "function") {
        await auth.logout();
      }

      router.dismissAll();
      setTimeout(() => {
        router.replace("/onboarding" as any);
      }, 0);
    } catch {
      Alert.alert("Nuk dole dot nga llogaria", "Provo përsëri pas pak.");

      setIsLoggingOut(false);
    }
  };

  const handleLogout = () => {
    void Haptics.selectionAsync();

    Alert.alert(
      hasAccount ? "Dil nga llogaria?" : "Dil nga profili mysafir?",
      hasAccount
        ? "Do të kthehesh te ekrani fillestar."
        : "Do të kthehesh te onboarding dhe të dhënat lokale të mysafirit do të pastrohen.",
      [
        { text: "Anulo", style: "cancel" },
        {
          text: "Dil",
          style: "destructive",
          onPress: () => {
            void performLogout();
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    void Haptics.selectionAsync();

    Alert.alert(
      "Fshi llogarinë?",
      "Kjo do të fshijë llogarinë dhe të dhënat e lidhura me të. Ky veprim nuk mund të zhbëhet.",
      [
        { text: "Anulo", style: "cancel" },
        {
          text: "Fshi",
          style: "destructive",
          onPress: async () => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

            if (typeof auth?.deleteAccount === "function") {
              await auth.deleteAccount();
              resetFlow();
              resetGuest();
              router.replace("/onboarding" as any);
              return;
            }

            Alert.alert(
              "Nuk është lidhur ende",
              "Shto auth.deleteAccount() në AuthProvider para dërgimit në App Store.",
            );
          },
        },
      ],
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Cilësimet",
          headerBackTitle: "Mbrapa",
          headerLargeTitle: false,
          headerShadowVisible: false,
          headerTransparent: true,
          headerBlurEffect: undefined,
          headerTintColor: colors.textPrimary,
          headerStyle: {
            backgroundColor: "transparent",
          },
          headerTitleStyle: {
            fontFamily: Fonts.bold,
            fontSize: 17,
          },
          contentStyle: {
            backgroundColor: theme.background,
          },
        }}
      />

      <SafeAreaView
        edges={["bottom"]}
        style={[styles.safeArea, { backgroundColor: theme.background }]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
        >
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: paper,
                borderColor: borderLight,
              },
            ]}
          >
            <View style={[styles.appIcon, { backgroundColor: primarySoft }]}>
              <IconShieldLock
                size={27}
                color={theme.primary}
                strokeWidth={2.4}
              />
            </View>

            <View style={styles.heroCopy}>
              <ThemedText style={styles.heroTitle}>Receta Ime</ThemedText>

              <ThemedText
                style={[styles.heroSubtitle, { color: textSecondary }]}
              >
                Ruaji recetat, koleksionet dhe preferencat e tua.
              </ThemedText>
            </View>
          </View>

          <SettingsSection title="Llogaria">
            {!hasAccount ? (
              <SettingsItem
                icon={
                  <IconUserPlus size={21} color="#FFFFFF" strokeWidth={2.25} />
                }
                iconBackground={theme.primary}
                title="Krijo llogari"
                subtitle="Ruaji recetat që të mos humbin."
                onPress={handleCreateAccount}
                paper={paper}
                borderLight={borderLight}
              />
            ) : (
              <SettingsItem
                icon={
                  <IconShieldLock
                    size={21}
                    color="#FFFFFF"
                    strokeWidth={2.25}
                  />
                }
                iconBackground={theme.primary}
                title="Llogaria ime"
                value="Aktive"
                showChevron={false}
                paper={paper}
                borderLight={borderLight}
              />
            )}

            <SettingsItem
              icon={<IconCrown size={21} color="#FFFFFF" strokeWidth={2.25} />}
              iconBackground={gold}
              title="Abonimi im"
              subtitle="Menaxho planin dhe përfitimet."
              onPress={handleSubscription}
              paper={paper}
              borderLight={borderLight}
            />

            <SettingsItem
              icon={
                <IconRotateClockwise
                  size={21}
                  color="#FFFFFF"
                  strokeWidth={2.25}
                />
              }
              iconBackground="#8E8E93"
              title="Rikthe blerjet"
              subtitle="Rikthe abonimin nga App Store."
              onPress={handleRestorePurchases}
              paper={paper}
              borderLight={borderLight}
              last
            />
          </SettingsSection>

          <SettingsSection title="Preferencat">
            <SettingsItem
              icon={<IconBell size={21} color="#FFFFFF" strokeWidth={2.25} />}
              iconBackground="#EF4A38"
              title={notificationsLoading ? "Duke hapur..." : "Kujtesat"}
              value={notificationsEnabled ? "Aktive" : "Joaktive"}
              onPress={handleNotifications}
              paper={paper}
              borderLight={borderLight}
              disabled={notificationsLoading}
              last
            />
          </SettingsSection>

          <SettingsSection title="Ndihmë">
            <SettingsItem
              icon={<IconHelp size={21} color="#FFFFFF" strokeWidth={2.25} />}
              iconBackground="#8B6FE8"
              title="Ndihmë & feedback"
              subtitle="Na shkruaj për problem ose ide."
              onPress={handleSupport}
              paper={paper}
              borderLight={borderLight}
            />

            <SettingsItem
              icon={<IconMail size={21} color="#FFFFFF" strokeWidth={2.25} />}
              iconBackground="#34A853"
              title="Privacy Policy"
              onPress={() => openUrl(PRIVACY_URL)}
              paper={paper}
              borderLight={borderLight}
            />

            <SettingsItem
              icon={
                <IconShieldLock size={21} color="#FFFFFF" strokeWidth={2.25} />
              }
              iconBackground="#5E5CE6"
              title="Terms of Use"
              onPress={() => openUrl(TERMS_URL)}
              paper={paper}
              borderLight={borderLight}
              last
            />
          </SettingsSection>

          <SettingsSection title="Llogaria">
            <SettingsItem
              icon={
                <IconShieldLock
                  size={21}
                  color="#FFFFFF"
                  strokeWidth={2.25}
                />
              }
              iconBackground="#D9422F"
              title={
                isLoggingOut
                  ? "Duke dalë..."
                  : hasAccount
                    ? "Dil nga llogaria"
                    : "Dil nga profili mysafir"
              }
              subtitle={
                hasAccount
                  ? undefined
                  : "Kthehu te onboarding dhe nis nga fillimi."
              }
              titleColor="#D9422F"
              onPress={handleLogout}
              disabled={isLoggingOut}
              paper={paper}
              borderLight={borderLight}
              last={!hasAccount}
            />

            {hasAccount ? (
              <SettingsItem
                icon={
                  <IconTrash size={21} color="#FFFFFF" strokeWidth={2.25} />
                }
                iconBackground="#D9422F"
                title="Fshi llogarinë"
                titleColor="#D9422F"
                onPress={handleDeleteAccount}
                disabled={isLoggingOut}
                paper={paper}
                borderLight={borderLight}
                last
              />
            ) : null}
          </SettingsSection>

          <ThemedText style={[styles.version, { color: textTertiary }]}>
            Version 1.0.0
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>

      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function SettingsItem({
  icon,
  iconBackground,
  title,
  subtitle,
  value,
  titleColor,
  onPress,
  showChevron = true,
  paper,
  borderLight,
  last,
  disabled,
}: {
  icon: React.ReactNode;
  iconBackground: string;
  title: string;
  subtitle?: string;
  value?: string;
  titleColor?: string;
  onPress?: () => void;
  showChevron?: boolean;
  paper: string;
  borderLight: string;
  last?: boolean;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const t = theme as any;
  const textSecondary = t.textSecondary ?? "#756F66";
  const textTertiary = t.textTertiary ?? "#9B938A";

  const content = (
    <>
      <View style={[styles.rowIcon, { backgroundColor: iconBackground }]}>
        {icon}
      </View>

      <View style={styles.rowCopy}>
        <ThemedText
          style={[styles.rowTitle, titleColor ? { color: titleColor } : null]}
        >
          {title}
        </ThemedText>

        {subtitle ? (
          <ThemedText style={[styles.rowSubtitle, { color: textSecondary }]}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>

      {value ? (
        <ThemedText style={[styles.rowValue, { color: textSecondary }]}>
          {value}
        </ThemedText>
      ) : null}

      {showChevron && onPress ? (
        <IconChevronRight size={19} color={textTertiary} strokeWidth={2.35} />
      ) : null}
    </>
  );

  if (!onPress) {
    return (
      <View
        style={[
          styles.row,
          {
            backgroundColor: paper,
            borderBottomColor: last ? "transparent" : borderLight,
          },
        ]}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: paper,
          borderBottomColor: last ? "transparent" : borderLight,
          opacity: disabled ? 0.45 : pressed ? 0.68 : 1,
        },
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 130,
  },
  heroCard: {
    minHeight: 96,
    borderRadius: Radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    ...Shadows.soft,
  },
  appIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: {
    flex: 1,
    gap: 3,
  },
  heroTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    letterSpacing: -0.35,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    paddingHorizontal: 2,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: "#756F66",
  },
  sectionCard: {
    borderRadius: Radius.xxl,
    overflow: "hidden",
    ...Shadows.soft,
  },
  row: {
    minHeight: 64,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
  },
  rowSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  rowValue: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  version: {
    marginTop: Spacing.xxl,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
});

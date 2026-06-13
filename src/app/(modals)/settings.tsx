import {
  IconBell,
  IconChevronLeft,
  IconCrown,
  IconHelp,
  IconLanguage,
  IconMail,
  IconRotateClockwise,
  IconShieldLock,
  IconTrash,
  IconUserPlus,
} from "@tabler/icons-react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
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
  const resetFlow = useOnboardingFlowStore((state) => state.resetFlow);

  const t = theme as any;
  const borderLight = t.borderLight ?? theme.border;
  const surface = t.surface ?? "#F7F6F2";
  const textSecondary = t.textSecondary ?? "#756F66";
  const gold = t.gold ?? "#D89A22";

  const close = () => {
    Haptics.selectionAsync();
    router.back();
  };

  const handleCreateAccount = () => {
    Haptics.selectionAsync();
    router.push("/onboarding/create-account" as any);
  };

  const handleSubscription = () => {
    Haptics.selectionAsync();
    router.push("/paywall" as any);
  };

  const handleRestorePurchases = async () => {
    Haptics.selectionAsync();

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

  const handleLanguage = () => {
    Haptics.selectionAsync();

    Alert.alert("Gjuha", "Aktualisht aplikacioni është në shqip.", [
      { text: "Në rregull" },
    ]);
  };

  const handleNotifications = () => {
    Haptics.selectionAsync();

    Alert.alert(
      "Kujtesat",
      "Njoftimet do t’i lidhësh me planin e vakteve. Për tani mund të hapësh cilësimet e pajisjes.",
      [
        { text: "Anulo", style: "cancel" },
        {
          text: "Hap cilësimet",
          onPress: () => Linking.openSettings(),
        },
      ],
    );
  };

  const handleSupport = () => {
    Haptics.selectionAsync();

    const subject = encodeURIComponent("Ndihmë me Receta Ime");
    const body = encodeURIComponent(
      "Përshëndetje,\n\nKam nevojë për ndihmë me Receta Ime.\n\n",
    );

    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
  };

  const openUrl = (url: string) => {
    Haptics.selectionAsync();
    Linking.openURL(url);
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

  const handleDeleteAccount = () => {
    Alert.alert(
      "Fshi llogarinë?",
      "Kjo do të fshijë llogarinë dhe të dhënat e lidhura me të. Ky veprim nuk mund të zhbëhet.",
      [
        { text: "Anulo", style: "cancel" },
        {
          text: "Fshi",
          style: "destructive",
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

            if (typeof auth?.deleteAccount === "function") {
              await auth.deleteAccount();
              resetGuest();
              resetFlow();
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
    <SafeAreaView
      edges={["top"]}
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <ThemedView transparent style={styles.header}>
        <Pressable
          onPress={close}
          hitSlop={12}
          style={({ pressed }) => [
            styles.backButton,
            {
              backgroundColor: surface,
              opacity: pressed ? 0.72 : 1,
            },
          ]}
        >
          <IconChevronLeft
            size={28}
            color={theme.textPrimary}
            strokeWidth={2.7}
          />
        </Pressable>

        <ThemedText type="title" style={styles.headerTitle}>
          Cilësimet
        </ThemedText>

        <View style={styles.headerSpacer} />
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <SectionTitle title="Llogaria" />

        <View style={[styles.group, { borderTopColor: borderLight }]}>
          {!hasAccount ? (
            <SettingsRow
              icon={
                <IconUserPlus
                  size={21}
                  color={theme.primary}
                  strokeWidth={2.2}
                />
              }
              title="Krijo llogari"
              subtitle="Ruaji recetat që të mos humbin."
              onPress={handleCreateAccount}
            />
          ) : (
            <SettingsRow
              icon={
                <IconShieldLock
                  size={21}
                  color={textSecondary}
                  strokeWidth={2.2}
                />
              }
              title="Llogaria ime"
              value="Aktive"
              showChevron={false}
            />
          )}

          <SettingsRow
            icon={<IconCrown size={21} color={gold} strokeWidth={2.2} />}
            title="Abonimi im"
            onPress={handleSubscription}
          />

          <SettingsRow
            icon={
              <IconRotateClockwise
                size={21}
                color={textSecondary}
                strokeWidth={2.2}
              />
            }
            title="Rikthe blerjet"
            onPress={handleRestorePurchases}
          />
        </View>

        <SectionTitle title="Preferencat" />

        <View style={[styles.group, { borderTopColor: borderLight }]}>
          <SettingsRow
            icon={
              <IconLanguage size={21} color={textSecondary} strokeWidth={2.2} />
            }
            title="Gjuha"
            value="Shqip"
            onPress={handleLanguage}
          />

          <SettingsRow
            icon={
              <IconBell size={21} color={textSecondary} strokeWidth={2.2} />
            }
            title="Kujtesat"
            value="Joaktive"
            onPress={handleNotifications}
          />
        </View>

        <SectionTitle title="Ndihmë" />

        <View style={[styles.group, { borderTopColor: borderLight }]}>
          <SettingsRow
            icon={
              <IconHelp size={21} color={textSecondary} strokeWidth={2.2} />
            }
            title="Ndihmë & feedback"
            onPress={handleSupport}
          />

          <SettingsRow
            icon={
              <IconMail size={21} color={textSecondary} strokeWidth={2.2} />
            }
            title="Privacy Policy"
            onPress={() => openUrl(PRIVACY_URL)}
          />

          <SettingsRow
            icon={
              <IconShieldLock
                size={21}
                color={textSecondary}
                strokeWidth={2.2}
              />
            }
            title="Terms of Use"
            onPress={() => openUrl(TERMS_URL)}
          />
        </View>

        <View style={styles.actions}>
          {hasAccount ? (
            <>
              <ThemedButton
                title="Dil nga llogaria"
                variant="secondary"
                onPress={handleLogout}
                style={styles.actionButton}
              />

              <Pressable
                onPress={handleDeleteAccount}
                hitSlop={12}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <View style={styles.deleteRow}>
                  <IconTrash size={18} color="#D9422F" strokeWidth={2.3} />
                  <ThemedText style={styles.deleteText}>
                    Fshi llogarinë
                  </ThemedText>
                </View>
              </Pressable>
            </>
          ) : null}
        </View>

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

function SectionTitle({ title }: { title: string }) {
  return (
    <ThemedText
      type="subhead"
      themeColor="textSecondary"
      style={styles.sectionTitle}
    >
      {title}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 68,
    paddingHorizontal: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 23,
    lineHeight: 29,
  },
  headerSpacer: {
    width: 48,
    height: 48,
  },
  content: {
    paddingTop: Spacing.md,
    paddingBottom: 120,
  },
  sectionTitle: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.xl,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  group: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actions: {
    marginTop: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
    alignItems: "center",
  },
  actionButton: {
    width: "100%",
  },
  deleteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  deleteText: {
    color: "#D9422F",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
  },
  version: {
    marginTop: Spacing.xxl,
    textAlign: "center",
  },
});

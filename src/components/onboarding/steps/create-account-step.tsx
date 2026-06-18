import { IconChevronRight, IconMailFilled } from "@tabler/icons-react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useCompleteOnboarding } from "@/hooks/use-complete-onboarding";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";

type LoadingAction = "apple" | "guest" | null;

export function CreateAccountStep() {
  const router = useRouter();
  const theme = useTheme();
  const { signInWithOAuthProfile } = useAuth();
  const { finishAccount, finishGuest } = useCompleteOnboarding();

  const [appleAvailable, setAppleAvailable] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<LoadingAction>(null);

  const t = theme as any;
  const borderLight = t.borderLight ?? theme.border;
  const textSecondary = t.textSecondary ?? "#756F66";

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  const handleApple = async () => {
    if (loading) return;

    setLoading("apple");
    setMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const name = credential.fullName
        ? AppleAuthentication.formatFullName(credential.fullName, "default")
        : undefined;

      const token = await signInWithOAuthProfile({
        provider: "apple",
        providerId: credential.user,
        ...(credential.email ? { email: credential.email } : {}),
        ...(name ? { name } : {}),
      });

      await finishAccount(token);
    } catch (error) {
      if ((error as { code?: string })?.code !== "ERR_REQUEST_CANCELED") {
        setMessage("Apple nuk u lidh dot tani. Provo me email.");
      }
    } finally {
      setLoading(null);
    }
  };

  const handleGuest = async () => {
    if (loading) return;

    setLoading("guest");

    try {
      await finishGuest();
    } finally {
      setLoading(null);
    }
  };

  return (
    <ThemedView transparent style={styles.screen}>
      <View style={styles.main}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>
            Ruaji recetat përgjithmonë
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
            Sinkronizo recetat në çdo pajisje.
          </ThemedText>
        </View>

        <View style={styles.actions}>
          {appleAvailable ? (
            <View style={styles.appleWrap}>
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={
                  AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
                }
                buttonStyle={
                  AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
                cornerRadius={Radius.lg}
                onPress={handleApple}
                style={styles.appleButton}
              />
              {loading === "apple" ? (
                <View style={styles.loadingOverlay} />
              ) : null}
            </View>
          ) : null}

          {appleAvailable ? (
            <View style={styles.dividerRow}>
              <View
                style={[styles.dividerLine, { backgroundColor: borderLight }]}
              />
              <ThemedText style={[styles.dividerText, { color: textSecondary }]}>
                ose
              </ThemedText>
              <View
                style={[styles.dividerLine, { backgroundColor: borderLight }]}
              />
            </View>
          ) : null}

          <ThemedButton
            title="Vazhdo me email"
            variant={appleAvailable ? "outline" : "primary"}
            onPress={() => router.push("/onboarding/email-auth" as any)}
            leftIcon={
              <IconMailFilled
                size={20}
                color={appleAvailable ? theme.text : "#FFFFFF"}
              />
            }
            rightIcon={
              <IconChevronRight
                size={19}
                color={appleAvailable ? theme.textSecondary : "#FFFFFF"}
                strokeWidth={2.7}
              />
            }
            style={styles.control}
          />

          {message ? (
            <ThemedText selectable themeColor="danger" style={styles.message}>
              {message}
            </ThemedText>
          ) : null}
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={handleGuest}
          disabled={loading === "guest"}
          hitSlop={14}
          style={({ pressed }) => [
            styles.guestLink,
            { opacity: loading === "guest" ? 0.48 : pressed ? 0.62 : 1 },
          ]}
        >
          <ThemedText style={[styles.guestText, { color: textSecondary }]}>
            Vazhdo si mysafir
          </ThemedText>
        </Pressable>

        <ThemedText style={[styles.privacy, { color: textSecondary }]}>
          Të dhënat e tua mbeten private.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: Spacing.md,
    paddingBottom: 0,
    justifyContent: "space-between",
  },
  main: {
    gap: Spacing.xxl,
  },
  header: {
    gap: Spacing.sm,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 36,
    lineHeight: 41,
    fontWeight: "900",
    letterSpacing: 0,
  },
  subtitle: {
    maxWidth: 300,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "700",
  },
  actions: {
    gap: Spacing.md,
  },
  appleWrap: {
    height: 58,
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  appleButton: {
    width: "100%",
    height: 58,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.14)",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
  },
  control: {
    minHeight: 58,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  footer: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  guestLink: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
  },
  guestText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "900",
  },
  privacy: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Fonts.medium,
    fontWeight: "700",
    textAlign: "center",
  },
});

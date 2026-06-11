import {
  IconBrandGoogleFilled,
  IconChevronRight,
  IconCloudLock,
  IconMailFilled,
  IconReceipt,
} from "@tabler/icons-react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet } from "react-native";

import { OnboardingHeading } from "@/components/onboarding/onboarding-heading";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Radius, Shadows, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useCompleteOnboarding } from "@/hooks/use-complete-onboarding";
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
      <ThemedView transparent style={styles.hero}>
        <ThemedView
          style={[
            styles.heroOrb,
            {
              backgroundColor: theme.primarySoft,
              borderColor: theme.border,
            },
          ]}
        >
          <ThemedView
            style={[
              styles.recipeCard,
              {
                backgroundColor: theme.paper,
                borderColor: theme.borderStrong,
              },
            ]}
          >
            <ThemedView
              style={[styles.iconTile, { backgroundColor: theme.primarySoft }]}
            >
              <IconReceipt size={25} color={theme.primary} strokeWidth={2.6} />
            </ThemedView>
            <ThemedView transparent style={styles.heroLines}>
              <ThemedView
                style={[styles.heroLineStrong, { backgroundColor: theme.text }]}
              />
              <ThemedView
                style={[
                  styles.heroLineMuted,
                  { backgroundColor: theme.borderStrong },
                ]}
              />
            </ThemedView>
          </ThemedView>

          <ThemedView
            style={[
              styles.lockBadge,
              {
                backgroundColor: theme.paper,
                borderColor: theme.border,
              },
            ]}
          >
            <IconCloudLock size={20} color={theme.primary} strokeWidth={2.5} />
          </ThemedView>
        </ThemedView>
      </ThemedView>

      <OnboardingHeading
        title="Ruaji recetat përgjithmonë."
        subtitle="Krijo llogari që të mos humbin kur ndërron telefon."
      />

      <ThemedView transparent style={styles.actions}>
        {appleAvailable ? (
          <ThemedView transparent style={styles.nativeButtonWrap}>
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
              <ThemedView
                style={[
                  styles.loadingOverlay,
                  { backgroundColor: "rgba(0,0,0,0.14)" },
                ]}
              />
            ) : null}
          </ThemedView>
        ) : null}

        <ThemedButton
          title="Vazhdo me email"
          variant={appleAvailable ? "outline" : "primary"}
          onPress={() => router.push("/onboarding/email-auth" as any)}
          leftIcon={<IconMailFilled size={20} color={appleAvailable ? theme.text : "#FFFFFF"} />}
          rightIcon={
            <IconChevronRight
              size={19}
              color={appleAvailable ? theme.textSecondary : "#FFFFFF"}
              strokeWidth={2.7}
            />
          }
        />

        <SocialVisualButton
          title="Vazhdo me Google"
          subtitle="Do ta lidhim më vonë"
        />
      </ThemedView>

      {message ? (
        <ThemedText themeColor="danger" style={styles.message}>
          {message}
        </ThemedText>
      ) : null}

      <Pressable
        onPress={handleGuest}
        disabled={loading === "guest"}
        hitSlop={14}
        style={({ pressed }) => [
          styles.guestLink,
          { opacity: loading === "guest" ? 0.48 : pressed ? 0.62 : 1 },
        ]}
      >
        <ThemedText themeColor="textSecondary" style={styles.guestText}>
          Vazhdo si mysafir
        </ThemedText>
      </Pressable>

      <ThemedText themeColor="textSecondary" style={styles.privacy}>
        Informacioni yt ruhet privat. Nuk e shesim të dhënat personale.
      </ThemedText>
    </ThemedView>
  );
}

function SocialVisualButton({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  const theme = useTheme();

  return (
    <ThemedView
      style={[
        styles.socialButton,
        {
          backgroundColor: theme.paper,
          borderColor: theme.border,
        },
      ]}
    >
      <ThemedView
        style={[styles.socialIcon, { backgroundColor: theme.cardMuted }]}
      >
        <IconBrandGoogleFilled size={20} color={theme.textSecondary} />
      </ThemedView>
      <ThemedView transparent style={styles.socialTextWrap}>
        <ThemedText style={styles.socialText}>{title}</ThemedText>
        <ThemedText themeColor="textTertiary" style={styles.socialSubtitle}>
          {subtitle}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    justifyContent: "center",
  },
  hero: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  heroOrb: {
    width: 132,
    height: 132,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  recipeCard: {
    width: 102,
    minHeight: 88,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
    shadowColor: Shadows.soft.shadowColor,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  iconTile: {
    width: 42,
    height: 42,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  heroLines: {
    gap: Spacing.xs,
  },
  heroLineStrong: {
    width: "74%",
    height: 7,
    borderRadius: Radius.full,
    opacity: 0.76,
  },
  heroLineMuted: {
    width: "94%",
    height: 7,
    borderRadius: Radius.full,
  },
  lockBadge: {
    position: "absolute",
    right: 2,
    bottom: 6,
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  nativeButtonWrap: {
    height: 58,
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  appleButton: {
    width: "100%",
    height: 58,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  socialButton: {
    minHeight: 58,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  socialIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  socialTextWrap: {
    flex: 1,
    gap: 1,
  },
  socialText: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
  },
  socialSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  message: {
    marginTop: Spacing.md,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  guestLink: {
    alignSelf: "center",
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  guestText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "800",
  },
  privacy: {
    marginTop: Spacing.sm,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
    textAlign: "center",
  },
});

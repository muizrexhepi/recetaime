import { IconLockFilled, IconMailFilled } from "@tabler/icons-react-native";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput } from "react-native";

import { OnboardingHeading } from "@/components/onboarding/onboarding-heading";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useCompleteOnboarding } from "@/hooks/use-complete-onboarding";
import { useAuth } from "@/providers/auth-provider";

type EmailMode = "register" | "login";

export function EmailAuthStep() {
  const theme = useTheme();
  const { registerWithEmailPassword, signInWithEmailPassword } = useAuth();
  const { finishAccount } = useCompleteOnboarding();

  const [mode, setMode] = useState<EmailMode>("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit =
    email.trim().length > 3 &&
    password.length >= 8 &&
    (mode === "login" || name.trim().length > 1);

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;

    setLoading(true);
    setMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const token =
        mode === "register"
          ? await registerWithEmailPassword({
              email: email.trim(),
              password,
              name: name.trim(),
            })
          : await signInWithEmailPassword({
              email: email.trim(),
              password,
            });

      await finishAccount(token);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Nuk mundëm të vazhdojmë me email tani.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView transparent style={styles.screen}>
      <ThemedView
        style={[
          styles.iconHalo,
          { backgroundColor: theme.primarySoft, borderColor: theme.border },
        ]}
      >
        <IconMailFilled size={28} color={theme.primary} />
      </ThemedView>

      <OnboardingHeading
        title={mode === "register" ? "Krijo llogarinë." : "Mirë se u ktheve."}
        subtitle="Emaili ruan recetat dhe preferencat e tua."
      />

      <ThemedCard
        variant="outline"
        style={styles.card}
        contentStyle={styles.cardContent}
      >
        <ThemedView
          style={[styles.segment, { backgroundColor: theme.cardMuted }]}
        >
          <ModeButton
            title="Regjistrohu"
            active={mode === "register"}
            onPress={() => setMode("register")}
          />
          <ModeButton
            title="Hyr"
            active={mode === "login"}
            onPress={() => setMode("login")}
          />
        </ThemedView>

        {mode === "register" ? (
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Emri"
            placeholderTextColor={theme.textTertiary}
            autoCapitalize="words"
            textContentType="name"
            style={[
              styles.input,
              {
                borderColor: theme.border,
                color: theme.text,
                backgroundColor: theme.backgroundElement,
              },
            ]}
          />
        ) : null}

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={theme.textTertiary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          style={[
            styles.input,
            {
              borderColor: theme.border,
              color: theme.text,
              backgroundColor: theme.backgroundElement,
            },
          ]}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Fjalëkalimi"
          placeholderTextColor={theme.textTertiary}
          secureTextEntry
          autoCapitalize="none"
          autoComplete={mode === "register" ? "new-password" : "password"}
          textContentType={mode === "register" ? "newPassword" : "password"}
          style={[
            styles.input,
            {
              borderColor: theme.border,
              color: theme.text,
              backgroundColor: theme.backgroundElement,
            },
          ]}
        />

        <ThemedButton
          title={mode === "register" ? "Krijo llogari" : "Hyr me email"}
          onPress={handleSubmit}
          loading={loading}
          disabled={!canSubmit}
          leftIcon={<IconLockFilled size={18} color="#FFFFFF" />}
        />

        {message ? (
          <ThemedText themeColor="danger" style={styles.message}>
            {message}
          </ThemedText>
        ) : null}
      </ThemedCard>

      <ThemedText themeColor="textSecondary" style={styles.privacy}>
        Fjalëkalimi duhet të ketë të paktën 8 karaktere.
      </ThemedText>
    </ThemedView>
  );
}

function ModeButton({
  title,
  active,
  onPress,
}: {
  title: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.modeButton,
        { backgroundColor: active ? theme.paper : "transparent" },
      ]}
    >
      <ThemedText
        style={[
          styles.modeText,
          { color: active ? theme.text : theme.textSecondary },
        ]}
      >
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    justifyContent: "center",
  },
  iconHalo: {
    width: 62,
    height: 62,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  card: {
    marginTop: Spacing.xl,
  },
  cardContent: {
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  segment: {
    minHeight: 44,
    borderRadius: Radius.lg,
    padding: Spacing.xs,
    flexDirection: "row",
    gap: Spacing.xs,
  },
  modeButton: {
    flex: 1,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  modeText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "900",
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    fontWeight: "600",
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  privacy: {
    marginTop: Spacing.lg,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
    textAlign: "center",
  },
});

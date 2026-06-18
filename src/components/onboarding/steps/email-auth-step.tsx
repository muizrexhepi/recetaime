import { IconChevronRight } from "@tabler/icons-react-native";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useCompleteOnboarding } from "@/hooks/use-complete-onboarding";
import { useTheme } from "@/hooks/use-theme";
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

  const t = theme as any;
  const paper = t.paper ?? "#FFFFFF";
  const textSecondary = t.textSecondary ?? "#756F66";

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

  const switchMode = (nextMode: EmailMode) => {
    void Haptics.selectionAsync();
    setMode(nextMode);
    setMessage(null);
  };

  return (
    <ThemedView transparent style={styles.screen}>
      <View style={styles.main}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>
            {mode === "register" ? "Krijo llogari" : "Hyr me email"}
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
            {mode === "register"
              ? "Ruaji recetat në cloud."
              : "Vazhdo aty ku e le."}
          </ThemedText>
        </View>

        <View style={[styles.segment, { backgroundColor: theme.cardMuted }]}>
          <ModeButton
            title="Regjistrohu"
            active={mode === "register"}
            onPress={() => switchMode("register")}
          />
          <ModeButton
            title="Hyr"
            active={mode === "login"}
            onPress={() => switchMode("login")}
          />
        </View>

        <View style={styles.form}>
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
                  backgroundColor: paper,
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
                backgroundColor: paper,
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
                backgroundColor: paper,
              },
            ]}
          />

          <ThemedButton
            title={mode === "register" ? "Krijo llogari" : "Hyr"}
            onPress={handleSubmit}
            loading={loading}
            disabled={!canSubmit}
            rightIcon={<IconChevronRight size={18} color="#FFFFFF" />}
            style={styles.control}
          />
        </View>

        {message ? (
          <ThemedText selectable themeColor="danger" style={styles.message}>
            {message}
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.footer}>
        <ThemedText style={[styles.footerText, { color: textSecondary }]}>
          Fjalëkalimi duhet të ketë të paktën 8 karaktere.
        </ThemedText>
      </View>
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    justifyContent: "space-between",
  },
  main: {
    gap: Spacing.xl,
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
  segment: {
    height: 48,
    borderRadius: Radius.lg,
    padding: 4,
    flexDirection: "row",
    gap: 4,
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
  form: {
    gap: Spacing.md,
  },
  input: {
    height: 58,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    fontWeight: "700",
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
  },
  footerText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    textAlign: "center",
  },
});

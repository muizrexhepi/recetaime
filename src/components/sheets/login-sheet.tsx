import {
  BottomSheetModal,
  BottomSheetScrollView,
} from "@expo/ui/community/bottom-sheet";
import { IconChevronRight } from "@tabler/icons-react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedText } from "@/components/ui/themed-text";
import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";

export type LoginSheetRef = {
  present: () => void;
  dismiss: () => void;
};

type LoadingAction = "apple" | "email" | null;

export const LoginSheet = forwardRef<LoginSheetRef>(
  function LoginSheet(_props, ref) {
    const router = useRouter();
    const theme = useTheme();
    const sheetRef = useRef<BottomSheetModal>(null);
    const { signInWithEmailPassword, signInWithOAuthProfile } = useAuth();

    const [appleAvailable, setAppleAvailable] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState<LoadingAction>(null);

    const t = theme as any;
    const paper = t.paper ?? "#FFFFFF";
    const borderLight = t.borderLight ?? theme.border;
    const textSecondary = t.textSecondary ?? "#756F66";

    const canSubmit = email.trim().length > 3 && password.length >= 8;

    useEffect(() => {
      AppleAuthentication.isAvailableAsync()
        .then(setAppleAvailable)
        .catch(() => setAppleAvailable(false));
    }, []);

    useImperativeHandle(ref, () => ({
      present: () => {
        setMessage(null);
        sheetRef.current?.present();
      },
      dismiss: () => {
        sheetRef.current?.dismiss();
      },
    }));

    const finishLogin = () => {
      sheetRef.current?.dismiss();
      router.replace("/(tabs)/cookbooks" as any);
    };

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

        await signInWithOAuthProfile({
          provider: "apple",
          providerId: credential.user,
          ...(credential.email ? { email: credential.email } : {}),
          ...(name ? { name } : {}),
        });

        finishLogin();
      } catch (error) {
        if ((error as { code?: string })?.code !== "ERR_REQUEST_CANCELED") {
          setMessage("Apple nuk u lidh dot tani. Provo me email.");
        }
      } finally {
        setLoading(null);
      }
    };

    const handleEmail = async () => {
      if (!canSubmit || loading) return;

      setLoading("email");
      setMessage(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      try {
        await signInWithEmailPassword({
          email: email.trim(),
          password,
        });

        finishLogin();
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Nuk mundëm të hynim me email tani.",
        );
      } finally {
        setLoading(null);
      }
    };

    return (
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={["60%"]}
        enablePanDownToClose
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboard}
        >
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            <View style={styles.header}>
              <ThemedText style={styles.title}>Hyr në Receta Ime</ThemedText>
              <ThemedText
                style={[styles.subtitle, { color: textSecondary }]}
                align="center"
              >
                Vazhdo aty ku i ke lënë recetat, koleksionet dhe importet.
              </ThemedText>
            </View>

            {appleAvailable ? (
              <View style={styles.appleWrap}>
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={
                    AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
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
                <ThemedText
                  style={[styles.dividerText, { color: textSecondary }]}
                >
                  ose
                </ThemedText>
                <View
                  style={[styles.dividerLine, { backgroundColor: borderLight }]}
                />
              </View>
            ) : null}

            <View style={styles.emailFields}>
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
                autoComplete="password"
                textContentType="password"
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
                title="Hyr"
                onPress={handleEmail}
                loading={loading === "email"}
                disabled={!canSubmit}
                rightIcon={<IconChevronRight size={18} color="#FFFFFF" />}
                style={styles.loginButton}
              />
            </View>

            {message ? (
              <ThemedText selectable themeColor="danger" style={styles.message}>
                {message}
              </ThemedText>
            ) : null}
          </BottomSheetScrollView>
        </KeyboardAvoidingView>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  header: {
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    maxWidth: 315,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
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
  emailFields: {
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
  loginButton: {
    minHeight: 58,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    textAlign: "center",
  },
});

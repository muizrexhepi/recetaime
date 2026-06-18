import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { ImageBackground, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OnboardingHeading } from "@/components/onboarding/onboarding-heading";
import { LoginSheet, type LoginSheetRef } from "@/components/sheets/login-sheet";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useOnboardingFlowStore } from "@/stores/onboarding-flow-store";

export default function OnboardingWelcomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const loginSheetRef = useRef<LoginSheetRef>(null);
  const resetFlow = useOnboardingFlowStore((state) => state.resetFlow);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetFlow();
    router.push("/onboarding/flow" as any);
  };

  return (
    <>
      <ThemedView style={styles.container}>
        <ImageBackground
          source={require("@/assets/images/welcome-bg.png")}
          style={styles.background}
          imageStyle={styles.backgroundImage}
          resizeMode="contain"
        >
          <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
            <ThemedView transparent style={styles.header}>
              <OnboardingHeading
                title="Receta Ime"
                subtitle="Ruaj. Organizo. Gatuaj më mirë."
              />
            </ThemedView>

            <ThemedView transparent style={styles.footer}>
              <ThemedButton title="Fillo" onPress={handleStart} />

              <Pressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  loginSheetRef.current?.present();
                }}
                hitSlop={12}
                style={({ pressed }) => [
                  styles.loginButton,
                  { opacity: pressed ? 0.62 : 1 },
                ]}
              >
                <ThemedText
                  style={[styles.loginText, { color: theme.primary }]}
                >
                  Kam llogari
                </ThemedText>
              </Pressable>
            </ThemedView>
          </SafeAreaView>
        </ImageBackground>
      </ThemedView>

      <LoginSheet ref={loginSheetRef} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
  },
  footer: {
    marginTop: "auto",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  loginButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  loginText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
  },
});

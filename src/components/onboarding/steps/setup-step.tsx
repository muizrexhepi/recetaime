import { IconChefHatFilled, IconSparkles } from "@tabler/icons-react-native";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { OnboardingHeading } from "@/components/onboarding/onboarding-heading";
import { ThemedView } from "@/components/ui/themed-view";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export function SetupStep() {
  const theme = useTheme();
  const scale = useSharedValue(0.96);
  const glow = useSharedValue(0.35);
  const dot = useSharedValue(0.35);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 560, easing: Easing.out(Easing.cubic) }),
        withTiming(0.96, { duration: 560, easing: Easing.inOut(Easing.cubic) }),
      ),
      -1,
      true,
    );
    glow.value = withRepeat(
      withSequence(withTiming(0.85, { duration: 560 }), withTiming(0.35, { duration: 560 })),
      -1,
      true,
    );
    dot.value = withRepeat(
      withSequence(withTiming(1, { duration: 420 }), withTiming(0.35, { duration: 420 })),
      -1,
      true,
    );
  }, [dot, glow, scale]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <ThemedView transparent style={styles.screen}>
      <OnboardingHeading
        title="Po e përgatisim për ty"
        subtitle="Po rregullojmë kuzhinën tënde."
      />

      <ThemedView transparent style={styles.visual}>
        <Animated.View
          style={[
            styles.glow,
            { backgroundColor: theme.primarySoft },
            glowStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.iconWrap,
            { backgroundColor: theme.primarySoft },
            iconStyle,
          ]}
        >
          <IconChefHatFilled size={66} color={theme.primary} />
        </Animated.View>
        <ThemedView
          style={[styles.sparkle, { backgroundColor: theme.paper }]}
        >
          <IconSparkles size={18} color={theme.primary} strokeWidth={2.6} />
        </ThemedView>
      </ThemedView>

      <ThemedView transparent style={styles.dots}>
        <LoadingDot delay={0} value={dot} />
        <LoadingDot delay={120} value={dot} />
        <LoadingDot delay={240} value={dot} />
      </ThemedView>
    </ThemedView>
  );
}

function LoadingDot({
  value,
  delay,
}: {
  value: SharedValue<number>;
  delay: number;
}) {
  const theme = useTheme();
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withDelay(delay, withTiming(value.value, { duration: 180 })),
  }));

  return (
    <Animated.View
      style={[styles.dot, { backgroundColor: theme.primary }, animatedStyle]}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.huge,
    alignItems: "center",
    justifyContent: "center",
  },
  visual: {
    width: 180,
    height: 180,
    marginTop: Spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: Radius.full,
  },
  iconWrap: {
    width: 122,
    height: 122,
    borderRadius: Radius.xxl,
    alignItems: "center",
    justifyContent: "center",
  },
  sparkle: {
    position: "absolute",
    right: 22,
    top: 28,
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    marginTop: Spacing.lg,
    flexDirection: "row",
    gap: Spacing.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: Radius.full,
  },
});

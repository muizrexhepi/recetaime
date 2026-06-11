import {
  IconChefHatFilled,
  IconClipboardList,
  IconShoppingCartFilled,
  IconSparkles,
} from "@tabler/icons-react-native";
import { StyleSheet } from "react-native";

import { OnboardingHeading } from "@/components/onboarding/onboarding-heading";
import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useOnboardingFlowStore } from "@/stores/onboarding-flow-store";

export function GoalResponseStep() {
  const selectedGoals = useOnboardingFlowStore((state) => state.selectedGoals);

  return (
    <ThemedView transparent style={styles.screen}>
      <OnboardingHeading {...getPersonalMessage(selectedGoals)} />

      <ThemedCard variant="outline" style={styles.card}>
        <ThemedView transparent style={styles.visual}>
          <RecipeCardPreview />
          <FloatingBadge />
        </ThemedView>

        <ThemedView transparent style={styles.copy}>
          <ThemedText style={styles.title}>
            Recetat, listat dhe plani në një vend.
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Më pak kërkim. Më shumë gatim.
          </ThemedText>
        </ThemedView>
      </ThemedCard>
    </ThemedView>
  );
}

function getPersonalMessage(goals: string[]) {
  if (goals.includes("family_recipes")) {
    return {
      title: "Perfekt.",
      subtitle: "Recetat familjare ruhen pastër.",
    };
  }

  if (goals.includes("meal_plan")) {
    return {
      title: "Shumë mirë.",
      subtitle: "Plani i javës bëhet më i lehtë.",
    };
  }

  return {
    title: "Perfekt.",
    subtitle: "Do ta përshtatim për mënyrën si gatuan ti.",
  };
}

function RecipeCardPreview() {
  const theme = useTheme();

  return (
    <ThemedView
      style={[
        styles.recipeCard,
        { backgroundColor: theme.paper, borderColor: theme.borderStrong },
      ]}
    >
      <ThemedView
        style={[styles.heroIcon, { backgroundColor: theme.primarySoft }]}
      >
        <IconChefHatFilled size={34} color={theme.primary} />
      </ThemedView>

      <ThemedView transparent style={styles.recipeText}>
        <ThemedText style={styles.recipeTitle}>Tavë familjare</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.recipeMeta}>
          35 min • 4 persona
        </ThemedText>
      </ThemedView>

      <ThemedView transparent style={styles.lineStack}>
        <Line width="92%" />
        <Line width="74%" />
      </ThemedView>
    </ThemedView>
  );
}

function FloatingBadge() {
  const theme = useTheme();

  return (
    <ThemedView
      style={[
        styles.badge,
        {
          backgroundColor: theme.primarySoft,
          borderColor: theme.borderStrong,
        },
      ]}
    >
      <IconShoppingCartFilled size={18} color={theme.primary} />
      <IconClipboardList size={18} color={theme.primary} strokeWidth={2.5} />
      <IconSparkles size={18} color={theme.primary} strokeWidth={2.5} />
    </ThemedView>
  );
}

function Line({ width }: { width: `${number}%` }) {
  const theme = useTheme();

  return (
    <ThemedView
      style={[styles.line, { width, backgroundColor: theme.border }]}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    alignItems: "center",
  },
  card: {
    width: "100%",
    marginTop: Spacing.xl,
    backgroundColor: "#FFFDF7",
  },
  visual: {
    minHeight: 210,
    alignItems: "center",
    justifyContent: "center",
  },
  recipeCard: {
    width: "86%",
    minHeight: 158,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  recipeText: {
    gap: 2,
  },
  recipeTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "900",
  },
  recipeMeta: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  lineStack: {
    gap: Spacing.xs,
  },
  line: {
    height: 6,
    borderRadius: Radius.full,
  },
  badge: {
    position: "absolute",
    right: Spacing.lg,
    bottom: Spacing.lg,
    minHeight: 46,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  copy: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
    textAlign: "center",
  },
});

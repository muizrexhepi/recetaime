import {
  IconCameraFilled,
  IconChefHatFilled,
  IconLink,
  IconPhotoFilled,
  IconSparklesFilled,
} from "@tabler/icons-react-native";
import { type ReactNode } from "react";
import { StyleSheet } from "react-native";

import { OnboardingHeading } from "@/components/onboarding/onboarding-heading";
import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Radius, Shadows, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export function OutcomeStep() {
  return (
    <ThemedView transparent style={styles.screen}>
      <OnboardingHeading
        title="Recetat bëhen të qarta."
        subtitle="Nga foto e linke në karta gati për gatim."
      />

      <ThemedCard
        variant="outline"
        style={styles.card}
        contentStyle={styles.cardContent}
      >
        <ThemedView transparent style={styles.illustration}>
          <MessyLayer />
          <TransformationGlow />
          <OrganizedRecipe />
        </ThemedView>
      </ThemedCard>
    </ThemedView>
  );
}

function MessyLayer() {
  const theme = useTheme();

  return (
    <ThemedView transparent style={styles.messyLayer}>
      <MiniArtifact
        icon={<IconPhotoFilled size={18} color={theme.textSecondary} />}
        width={116}
        rotate="-9deg"
        top={0}
        left={18}
      />
      <MiniArtifact
        icon={<IconCameraFilled size={18} color={theme.textSecondary} />}
        width={132}
        rotate="6deg"
        top={36}
        left={96}
      />
      <MiniArtifact
        icon={<IconLink size={18} color={theme.textSecondary} strokeWidth={2.5} />}
        width={124}
        rotate="-4deg"
        top={70}
        left={36}
      />
    </ThemedView>
  );
}

function MiniArtifact({
  icon,
  width,
  rotate,
  top,
  left,
}: {
  icon: ReactNode;
  width: number;
  rotate: string;
  top: number;
  left: number;
}) {
  const theme = useTheme();

  return (
    <ThemedView
      style={[
        styles.miniArtifact,
        {
          width,
          top,
          left,
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
          transform: [{ rotate }],
        },
      ]}
    >
      <ThemedView
        style={[styles.artifactIcon, { backgroundColor: theme.cardMuted }]}
      >
        {icon}
      </ThemedView>
      <ThemedView transparent style={styles.artifactLines}>
        <ThemedView
          style={[styles.artifactLineStrong, { backgroundColor: theme.borderStrong }]}
        />
        <ThemedView
          style={[styles.artifactLine, { backgroundColor: theme.border }]}
        />
      </ThemedView>
    </ThemedView>
  );
}

function TransformationGlow() {
  const theme = useTheme();

  return (
    <ThemedView
      style={[
        styles.glow,
        {
          backgroundColor: theme.primarySoft,
          borderColor: theme.border,
        },
      ]}
    >
      <IconSparklesFilled size={22} color={theme.primary} />
    </ThemedView>
  );
}

function OrganizedRecipe() {
  const theme = useTheme();

  return (
    <ThemedView
      style={[
        styles.organizedCard,
        {
          backgroundColor: theme.paper,
          borderColor: theme.borderStrong,
        },
      ]}
    >
      <ThemedView transparent style={styles.recipeHeader}>
        <ThemedView
          style={[styles.recipeIcon, { backgroundColor: theme.primarySoft }]}
        >
          <IconChefHatFilled size={27} color={theme.primary} />
        </ThemedView>
        <ThemedView transparent style={styles.recipeHeaderText}>
          <ThemedText style={styles.recipeTitle}>Recetë e pastër</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.recipeMeta}>
            6 përbërës • 4 hapa
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView transparent style={styles.section}>
        <ThemedView
          style={[styles.sectionTitle, { backgroundColor: theme.primary }]}
        />
        <ThemedView style={[styles.sectionLine, { backgroundColor: theme.border }]} />
        <ThemedView
          style={[styles.sectionLineShort, { backgroundColor: theme.border }]}
        />
      </ThemedView>
    </ThemedView>
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
  },
  cardContent: {
    padding: Spacing.lg,
  },
  illustration: {
    minHeight: 360,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  messyLayer: {
    position: "absolute",
    top: 4,
    width: "100%",
    height: 146,
  },
  miniArtifact: {
    position: "absolute",
    minHeight: 52,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    shadowColor: Shadows.soft.shadowColor,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 1,
  },
  artifactIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  artifactLines: {
    flex: 1,
    gap: Spacing.xs,
  },
  artifactLineStrong: {
    width: "72%",
    height: 6,
    borderRadius: Radius.full,
  },
  artifactLine: {
    width: "92%",
    height: 6,
    borderRadius: Radius.full,
  },
  glow: {
    position: "absolute",
    top: 132,
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  organizedCard: {
    width: "100%",
    minHeight: 188,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.lg,
    shadowColor: Shadows.medium.shadowColor,
    shadowOpacity: 0.09,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  recipeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  recipeIcon: {
    width: 54,
    height: 54,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  recipeHeaderText: {
    flex: 1,
    gap: 1,
  },
  recipeTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "900",
  },
  recipeMeta: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    width: "36%",
    height: 8,
    borderRadius: Radius.full,
    opacity: 0.82,
  },
  sectionLine: {
    width: "96%",
    height: 9,
    borderRadius: Radius.full,
  },
  sectionLineShort: {
    width: "68%",
    height: 9,
    borderRadius: Radius.full,
  },
});

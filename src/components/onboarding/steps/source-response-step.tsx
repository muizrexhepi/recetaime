import {
  IconArrowDown,
  IconBrandTiktokFilled,
  IconChefHatFilled,
  IconClipboardList,
  IconPhotoFilled,
  IconShare3,
  IconSparklesFilled,
} from "@tabler/icons-react-native";
import { StyleSheet } from "react-native";

import { OnboardingHeading } from "@/components/onboarding/onboarding-heading";
import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Radius, Shadows, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useOnboardingFlowStore } from "@/stores/onboarding-flow-store";

export function SourceResponseStep() {
  const selectedSources = useOnboardingFlowStore(
    (state) => state.selectedSources,
  );

  return (
    <ThemedView transparent style={styles.screen}>
      <OnboardingHeading
        title="Ktheje në kartë të pastër."
        subtitle={getSourceSentence(selectedSources)}
      />

      <ThemedCard
        variant="outline"
        style={styles.card}
        contentStyle={styles.cardContent}
      >
        <ThemedView transparent style={styles.canvas}>
          <ThemedView transparent style={styles.inputCluster}>
            <FloatingSource type="social" rotate="-8deg" offset={-14} />
            <FloatingSource type="photo" rotate="7deg" offset={20} />
          </ThemedView>

          <ThemedView transparent style={styles.connectorWrap}>
            <Connector />
          </ThemedView>

          <CleanRecipeCard />
        </ThemedView>

        <ThemedView transparent style={styles.steps}>
          <StepRow icon="share" title="Shpërndaje recetën" />
          <StepRow icon="spark" title="Zgjidh Receta Ime" />
          <StepRow icon="card" title="Ruaje si kartë" />
        </ThemedView>
      </ThemedCard>
    </ThemedView>
  );
}

function getSourceSentence(sources: string[]) {
  if (sources.includes("social")) {
    return "Nga TikTok, Instagram ose YouTube në një recetë të qartë.";
  }

  if (sources.includes("photo") || sources.includes("family")) {
    return "Foto dhe receta familjare ruhen pa rrëmujë.";
  }

  return "Importo nga vendet ku i gjen më shpesh.";
}

function FloatingSource({
  type,
  rotate,
  offset,
}: {
  type: "social" | "photo";
  rotate: string;
  offset: number;
}) {
  const theme = useTheme();
  const isSocial = type === "social";

  return (
    <ThemedView
      style={[
        styles.floatingSource,
        {
          backgroundColor: isSocial ? theme.primarySoft : theme.paper,
          borderColor: isSocial ? theme.borderStrong : theme.border,
          transform: [{ rotate }, { translateX: offset }],
        },
      ]}
    >
      <ThemedView
        style={[
          styles.sourceIcon,
          { backgroundColor: isSocial ? theme.paper : theme.cardMuted },
        ]}
      >
        {isSocial ? (
          <IconBrandTiktokFilled size={22} color={theme.primary} />
        ) : (
          <IconPhotoFilled size={22} color={theme.textSecondary} />
        )}
      </ThemedView>
      <ThemedView transparent style={styles.sourceLines}>
        <ThemedView
          style={[
            styles.sourceLineStrong,
            { backgroundColor: isSocial ? theme.primary : theme.textSecondary },
          ]}
        />
        <ThemedView
          style={[styles.sourceLine, { backgroundColor: theme.borderStrong }]}
        />
      </ThemedView>
    </ThemedView>
  );
}

function Connector() {
  const theme = useTheme();

  return (
    <ThemedView
      style={[
        styles.connector,
        {
          backgroundColor: theme.primarySoft,
          borderColor: theme.border,
        },
      ]}
    >
      <IconArrowDown size={22} color={theme.primary} strokeWidth={2.8} />
    </ThemedView>
  );
}

function CleanRecipeCard() {
  const theme = useTheme();

  return (
    <ThemedView
      style={[
        styles.recipeCard,
        {
          backgroundColor: theme.paper,
          borderColor: theme.borderStrong,
        },
      ]}
    >
      <ThemedView transparent style={styles.recipeTop}>
        <ThemedView
          style={[styles.recipeIcon, { backgroundColor: theme.primarySoft }]}
        >
          <IconChefHatFilled size={24} color={theme.primary} />
        </ThemedView>
        <ThemedView transparent style={styles.recipeTitleBlock}>
          <ThemedText style={styles.recipeTitle}>Tavë shtëpie</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.recipeMeta}>
            Përbërës • Hapa • Listë
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView transparent style={styles.recipeLines}>
        <ThemedView
          style={[styles.lineLong, { backgroundColor: theme.borderStrong }]}
        />
        <ThemedView style={[styles.lineMid, { backgroundColor: theme.border }]} />
        <ThemedView
          style={[styles.lineShort, { backgroundColor: theme.border }]}
        />
      </ThemedView>
    </ThemedView>
  );
}

function StepRow({
  icon,
  title,
}: {
  icon: "share" | "spark" | "card";
  title: string;
}) {
  const theme = useTheme();
  const Icon =
    icon === "share"
      ? IconShare3
      : icon === "spark"
        ? IconSparklesFilled
        : IconClipboardList;

  return (
    <ThemedView
      style={[
        styles.stepRow,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}
    >
      <ThemedView
        style={[styles.stepIcon, { backgroundColor: theme.primarySoft }]}
      >
        <Icon size={17} color={theme.primary} strokeWidth={2.5} />
      </ThemedView>
      <ThemedText style={styles.stepText}>{title}</ThemedText>
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
    gap: Spacing.xl,
    padding: Spacing.lg,
  },
  canvas: {
    minHeight: 290,
    alignItems: "center",
    justifyContent: "center",
  },
  inputCluster: {
    height: 104,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingSource: {
    width: 154,
    minHeight: 64,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    position: "absolute",
    shadowColor: Shadows.soft.shadowColor,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  sourceIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  sourceLines: {
    flex: 1,
    gap: Spacing.xs,
  },
  sourceLineStrong: {
    width: "62%",
    height: 7,
    borderRadius: Radius.full,
    opacity: 0.82,
  },
  sourceLine: {
    width: "88%",
    height: 7,
    borderRadius: Radius.full,
  },
  connectorWrap: {
    height: 52,
    justifyContent: "center",
  },
  connector: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  recipeCard: {
    width: "100%",
    minHeight: 132,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
    shadowColor: Shadows.soft.shadowColor,
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 2,
  },
  recipeTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  recipeIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  recipeTitleBlock: {
    flex: 1,
    gap: 1,
  },
  recipeTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
  },
  recipeMeta: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  recipeLines: {
    gap: Spacing.sm,
  },
  lineLong: {
    width: "96%",
    height: 8,
    borderRadius: Radius.full,
  },
  lineMid: {
    width: "78%",
    height: 8,
    borderRadius: Radius.full,
  },
  lineShort: {
    width: "52%",
    height: 8,
    borderRadius: Radius.full,
  },
  steps: {
    gap: Spacing.sm,
  },
  stepRow: {
    minHeight: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  stepIcon: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "900",
  },
});

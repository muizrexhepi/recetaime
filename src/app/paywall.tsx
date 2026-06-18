import { IconCheck, IconX } from "@tabler/icons-react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type PlanId = "monthly" | "yearly";

type Plan = {
  id: PlanId;
  title: string;
  price: string;
  period: string;
  helper: string;
  badge?: string;
  hasTrial: boolean;
};

const TERMS_URL = "https://recetaime.com/terms";
const PRIVACY_URL = "https://recetaime.com/privacy";

const PLANS: Plan[] = [
  {
    id: "monthly",
    title: "Mujore",
    price: "€4.99",
    period: "/ muaj",
    helper: "Pa provë falas",
    hasTrial: false,
  },
  {
    id: "yearly",
    title: "Vjetore",
    price: "€2.49",
    period: "/ muaj",
    helper: "€29.99/vit pas provës",
    badge: "Kursen 50%",
    hasTrial: true,
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [selectedPlan, setSelectedPlan] = useState<PlanId>("yearly");

  const t = theme as any;
  const surface = t.surface ?? "#F7F6F2";
  const borderLight = t.borderLight ?? "#E8E4DC";
  const textSecondary = t.textSecondary ?? "#756F66";
  const textTertiary = t.textTertiary ?? "#9B938A";

  const selected = useMemo(
    () => PLANS.find((plan) => plan.id === selectedPlan) ?? PLANS[1],
    [selectedPlan],
  );

  const isYearly = selectedPlan === "yearly";

  const handleClose = () => {
    void Haptics.selectionAsync();

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/cookbooks" as any);
  };

  const handleRestore = () => {
    void Haptics.selectionAsync();
    Alert.alert("Rikthe blerjet", "Kjo do të lidhet me RevenueCat.");
  };

  const handleContinue = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // TODO:
    // selectedPlan === "yearly" -> purchase yearly package with trial
    // selectedPlan === "monthly" -> purchase monthly package without trial
    router.back();
  };

  const openUrl = (url: string) => {
    void Haptics.selectionAsync();
    void Linking.openURL(url);
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={handleClose}
            hitSlop={12}
            style={({ pressed }) => [
              styles.closeButton,
              {
                backgroundColor: surface,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <IconX size={20} color={textSecondary} strokeWidth={2.7} />
          </Pressable>

          <Pressable
            onPress={handleRestore}
            hitSlop={12}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <ThemedText style={[styles.restoreText, { color: textSecondary }]}>
              Rikthe
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
        >
          <View style={styles.headlineWrap}>
            {isYearly ? (
              <Animated.View
                key="yearly-title"
                entering={FadeIn.duration(180)}
                exiting={FadeOut.duration(120)}
                style={styles.titleAnimation}
              >
                <ThemedText style={styles.headline}>Java e parë,</ThemedText>

                <ThemedText
                  style={[styles.headlineAccent, { color: theme.primary }]}
                >
                  falas.
                </ThemedText>
              </Animated.View>
            ) : (
              <Animated.View
                key="monthly-title"
                entering={FadeIn.duration(180)}
                exiting={FadeOut.duration(120)}
                style={styles.titleAnimation}
              >
                <ThemedText style={styles.headline}>Zhblloko</ThemedText>

                <ThemedText
                  style={[styles.headlineAccent, { color: theme.primary }]}
                >
                  Pro.
                </ThemedText>
              </Animated.View>
            )}

            <ThemedText style={[styles.subhead, { color: textSecondary }]}>
              {isYearly
                ? "Anulo kurdo, pa pyetje."
                : "Çdo veçori, pa kufij, nga sot."}
            </ThemedText>
          </View>

          <View style={styles.switcherSlot}>
            {isYearly ? (
              <Animated.View
                key="trial-timeline"
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(120)}
                style={styles.switcherContent}
              >
                <TrialTimeline />
              </Animated.View>
            ) : (
              <Animated.View
                key="feature-list"
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(120)}
                style={styles.switcherContent}
              >
                <FeatureList />
              </Animated.View>
            )}
          </View>

          <View style={styles.plans}>
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                selected={selectedPlan === plan.id}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setSelectedPlan(plan.id);
                }}
              />
            ))}
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.background,
              borderTopColor: borderLight,
            },
          ]}
        >
          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.88 : 1,
                transform: [{ scale: pressed ? 0.985 : 1 }],
              },
            ]}
          >
            <ThemedText style={styles.ctaText}>
              {isYearly ? "Nis provën 7-ditore" : "Vazhdo me Pro"}
            </ThemedText>
          </Pressable>

          <ThemedText style={[styles.footerSub, { color: textSecondary }]}>
            {isYearly
              ? "Pa pagesë sot. Pastaj €29.99/vit. Anulo kurdo."
              : `${selected.price}${selected.period}. Pa provë falas.`}
          </ThemedText>

          <View style={styles.links}>
            <Pressable onPress={() => openUrl(TERMS_URL)} hitSlop={10}>
              <ThemedText style={[styles.link, { color: textTertiary }]}>
                Kushtet
              </ThemedText>
            </Pressable>

            <Dot color={textTertiary} />

            <Pressable onPress={() => openUrl(PRIVACY_URL)} hitSlop={10}>
              <ThemedText style={[styles.link, { color: textTertiary }]}>
                Privatësia
              </ThemedText>
            </Pressable>

            <Dot color={textTertiary} />

            <Pressable onPress={handleRestore} hitSlop={10}>
              <ThemedText style={[styles.link, { color: textTertiary }]}>
                Rikthe
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function TrialTimeline() {
  const theme = useTheme();

  const t = theme as any;
  const textSecondary = t.textSecondary ?? "#756F66";
  const borderLight = t.borderLight ?? "#E8E4DC";

  return (
    <View style={styles.timeline}>
      <View style={styles.rail}>
        <View style={[styles.railActive, { backgroundColor: theme.primary }]} />
        <View style={[styles.railSoft, { backgroundColor: borderLight }]} />
      </View>

      <View style={styles.rows}>
        <InfoRow
          marker="1"
          title="Sot"
          text="Qasje e plotë menjëherë, pa kufizime."
          markerActive
        />

        <InfoRow
          marker="5"
          title="Dita 5"
          text="Kujtesë e but para se prova të mbarojë."
        />

        <InfoRow
          marker="7"
          title="Dita 7"
          text="Fillon abonimi. Anulo kurdo, pa pyetje."
          mutedColor={textSecondary}
        />
      </View>
    </View>
  );
}

function FeatureList() {
  return (
    <View style={styles.featureList}>
      <InfoRow
        marker="∞"
        title="Importime pa limit"
        text="Ruaj receta nga link, foto ose tekst."
        markerActive
      />

      <InfoRow
        marker="✓"
        title="Koleksione pa limit"
        text="Organizo recetat si të duash."
      />

      <InfoRow
        marker="+"
        title="Plan dhe listë blerjeje"
        text="Mbaji përbërësit në një vend."
      />
    </View>
  );
}

function InfoRow({
  marker,
  title,
  text,
  markerActive,
  mutedColor,
}: {
  marker: string;
  title: string;
  text: string;
  markerActive?: boolean;
  mutedColor?: string;
}) {
  const theme = useTheme();

  const t = theme as any;
  const primarySoft = t.primarySoft ?? "#FFF0ED";
  const textSecondary = mutedColor ?? t.textSecondary ?? "#756F66";

  return (
    <View style={styles.infoRow}>
      <View
        style={[
          styles.marker,
          {
            backgroundColor: markerActive ? theme.primary : primarySoft,
          },
        ]}
      >
        <ThemedText
          style={[
            styles.markerText,
            { color: markerActive ? "#FFFFFF" : theme.primary },
          ]}
        >
          {marker}
        </ThemedText>
      </View>

      <View style={styles.infoCopy}>
        <ThemedText style={styles.infoTitle}>{title}</ThemedText>

        <ThemedText style={[styles.infoText, { color: textSecondary }]}>
          {text}
        </ThemedText>
      </View>
    </View>
  );
}

function PlanCard({
  plan,
  selected,
  onPress,
}: {
  plan: Plan;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  const t = theme as any;
  const paper = t.paper ?? "#FFFFFF";
  const surface = t.surface ?? "#F7F6F2";
  const borderLight = t.borderLight ?? "#E8E4DC";
  const textSecondary = t.textSecondary ?? "#756F66";
  const primarySoft = t.primarySoft ?? "#FFF0ED";

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View
          style={[
            styles.planCard,
            {
              backgroundColor: selected ? primarySoft : paper,
              borderColor: selected ? theme.primary : borderLight,
              borderWidth: selected ? 2 : 1.5,
              opacity: pressed ? 0.88 : 1,
              transform: [{ scale: pressed ? 0.99 : 1 }],
            },
            selected ? styles.planCardSelected : null,
          ]}
        >
          <View
            style={[
              styles.radio,
              {
                borderColor: selected ? theme.primary : borderLight,
                backgroundColor: selected ? theme.primary : surface,
              },
            ]}
          >
            {selected ? (
              <IconCheck size={13} color="#FFFFFF" strokeWidth={3.2} />
            ) : null}
          </View>

          <View style={styles.planLeft}>
            <View style={styles.planTitleRow}>
              <ThemedText style={styles.planTitle}>{plan.title}</ThemedText>

              {plan.badge ? (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: theme.primary,
                    },
                  ]}
                >
                  <ThemedText style={styles.badgeText}>{plan.badge}</ThemedText>
                </View>
              ) : null}
            </View>

            <ThemedText style={[styles.planHelper, { color: textSecondary }]}>
              {plan.helper}
            </ThemedText>
          </View>

          <View style={styles.planRight}>
            <View style={styles.priceRow}>
              <ThemedText style={styles.price}>{plan.price}</ThemedText>

              <ThemedText style={[styles.period, { color: textSecondary }]}>
                {plan.period}
              </ThemedText>
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
}

function Dot({ color }: { color: string }) {
  return <View style={[styles.dot, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    height: 54,
    paddingHorizontal: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  restoreText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: 210,
  },
  headlineWrap: {
    minHeight: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  titleAnimation: {
    alignItems: "center",
  },
  headline: {
    fontFamily: Fonts.bold,
    fontSize: 34,
    lineHeight: 39,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.8,
  },
  headlineAccent: {
    marginTop: 1,
    fontFamily: Fonts.bold,
    fontSize: 35,
    lineHeight: 40,
    fontWeight: "900",
    fontStyle: "italic",
    textAlign: "center",
    letterSpacing: -0.8,
  },
  subhead: {
    marginTop: Spacing.sm,
    fontFamily: Fonts.medium,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    textAlign: "center",
  },
  switcherSlot: {
    height: 184,
    marginTop: Spacing.xxl ?? 28,
    position: "relative",
  },
  switcherContent: {
    ...StyleSheet.absoluteFillObject,
  },
  timeline: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
  },
  rail: {
    width: 32,
    alignItems: "center",
    paddingTop: 9,
  },
  railActive: {
    width: 7,
    height: 68,
    borderRadius: Radius.full,
  },
  railSoft: {
    marginTop: 4,
    width: 7,
    flex: 1,
    borderRadius: Radius.full,
    opacity: 0.6,
  },
  rows: {
    flex: 1,
    justifyContent: "space-between",
  },
  featureList: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    justifyContent: "space-between",
  },
  infoRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  marker: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  markerText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "900",
  },
  infoCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  infoTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
  },
  infoText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  plans: {
    marginTop: Spacing.lg ?? 20,
    gap: Spacing.sm,
  },
  planCard: {
    minHeight: 76,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  planCardSelected: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  planLeft: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  planTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  planTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
  },
  badge: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  badgeText: {
    color: "#FFFFFF",
    fontFamily: Fonts.bold,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "900",
  },
  planHelper: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  planRight: {
    alignItems: "flex-end",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
  },
  price: {
    fontFamily: Fonts.bold,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "900",
  },
  period: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    lineHeight: 18,
    fontWeight: "700",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cta: {
    minHeight: 58,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 4,
  },
  ctaText: {
    color: "#FFFFFF",
    fontFamily: Fonts.bold,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "900",
    letterSpacing: -0.25,
  },
  footerSub: {
    marginTop: Spacing.sm,
    fontFamily: Fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  links: {
    marginTop: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  link: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: Radius.full,
    opacity: 0.55,
  },
});

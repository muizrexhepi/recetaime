import {
  IconBoltFilled,
  IconCalendar,
  IconCameraFilled,
  IconCheck,
  IconChefHat,
  IconClipboardList,
  IconPhoto,
  IconShoppingCart,
  IconSparkles,
  IconX,
} from "@tabler/icons-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Fonts, Radius, Shadows, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type PlanId = "monthly" | "yearly";

type Plan = {
  id: PlanId;
  title: string;
  subtitle: string;
  price: string;
  period: string;
  badge?: string;
  helper: string;
};

const PLANS: Plan[] = [
  {
    id: "monthly",
    title: "Mujore",
    subtitle: "Fleksibile",
    price: "€2.99",
    period: "/ muaj",
    helper: "Anulo kurdo.",
  },
  {
    id: "yearly",
    title: "Vjetore",
    subtitle: "Më e mira",
    price: "€25.99",
    period: "/ vit",
    badge: "7 ditë provë falas",
    helper: "Rreth €2.17 në muaj.",
  },
];

const FEATURES = [
  {
    title: "Importime pa limit",
    subtitle:
      "Ruaj receta nga Instagram, TikTok, YouTube, web, foto dhe tekst.",
    icon: "imports",
  },
  {
    title: "Lista blerjeje",
    subtitle: "Kthe përbërësit në listë të organizuar për market.",
    icon: "groceries",
  },
  {
    title: "Plan vaktesh",
    subtitle: "Planifiko javën me receta të ruajtura.",
    icon: "calendar",
  },
  {
    title: "Cook mode",
    subtitle: "Gatuaj me hapa të pastër dhe të lehtë për t’u ndjekur.",
    icon: "cook",
  },
  {
    title: "Import nga foto",
    subtitle: "Përdor screenshot ose foto kur nuk ke link të plotë.",
    icon: "photo",
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [selectedPlan, setSelectedPlan] = useState<PlanId>("yearly");

  const t = theme as any;
  const paper = t.paper ?? theme.background;
  const surface = t.surface ?? "#F7F6F2";
  const surfaceMuted = t.surfaceMuted ?? surface;
  const cardMuted = t.cardMuted ?? surface;
  const border = t.border ?? "#E8E4DC";
  const borderLight = t.borderLight ?? border;
  const borderStrong = t.borderStrong ?? border;
  const primarySoft = t.primarySoft ?? surface;
  const primaryDark = t.primaryDark ?? theme.primary;
  const textSecondary = t.textSecondary ?? "#756F66";
  const textTertiary = t.textTertiary ?? textSecondary;

  const currentPlan = useMemo(
    () => PLANS.find((plan) => plan.id === selectedPlan) ?? PLANS[1],
    [selectedPlan],
  );

  const handleContinue = () => {
    // TODO: connect this to RevenueCat purchasePackage(...)
    router.back();
  };

  const handleRestore = () => {
    // TODO: connect this to RevenueCat restorePurchases()
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => [
              styles.closeButton,
              {
                backgroundColor: cardMuted,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <IconX size={22} color={textSecondary} strokeWidth={2.4} />
          </Pressable>

          <Pressable onPress={handleRestore} hitSlop={10}>
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
          <LinearGradient
            colors={["#FFF2EE", "#FFFFFF"]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroCard, { borderColor: borderLight }]}
          >
            <View style={[styles.heroIcon, { backgroundColor: primarySoft }]}>
              <IconChefHat size={42} color={theme.primary} strokeWidth={2.1} />
            </View>

            <View style={styles.heroCopy}>
              <ThemedText style={styles.eyebrow}>RECETA IME PRO</ThemedText>

              <ThemedText style={styles.title}>
                Ruaj çdo recetë pa kufizime
              </ThemedText>

              <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
                Importo nga link, foto ose tekst. Organizo përbërësit, planin
                javor dhe listën e blerjes në një vend.
              </ThemedText>
            </View>

            <View style={styles.heroStats}>
              <MiniStat value="∞" label="importe" />
              <MiniStat value="5+" label="mjete" />
              <MiniStat value="7d" label="provë" />
            </View>
          </LinearGradient>

          <View style={styles.freeUsageCard}>
            <View
              style={[styles.freeUsageIcon, { backgroundColor: primarySoft }]}
            >
              <IconBoltFilled size={22} color={theme.primary} />
            </View>

            <View style={styles.freeUsageCopy}>
              <ThemedText style={styles.freeUsageTitle}>
                Falas: 5 importe në javë
              </ThemedText>

              <ThemedText
                style={[styles.freeUsageSubtitle, { color: textSecondary }]}
              >
                Pro zhbllokon importe pa limit dhe rrjedhë më të shpejtë.
              </ThemedText>
            </View>
          </View>

          <View style={styles.plans}>
            {PLANS.map((plan) => {
              const selected = selectedPlan === plan.id;

              return (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  selected={selected}
                  onPress={() => setSelectedPlan(plan.id)}
                />
              );
            })}
          </View>

          <ThemedCard
            variant="outline"
            style={[
              styles.featureCard,
              {
                backgroundColor: paper,
                borderColor: borderLight,
              },
            ]}
          >
            <View style={styles.featureHeader}>
              <View
                style={[
                  styles.featureHeaderIcon,
                  { backgroundColor: primarySoft },
                ]}
              >
                <IconSparkles
                  size={20}
                  color={theme.primary}
                  strokeWidth={2.3}
                />
              </View>

              <View style={styles.featureHeaderCopy}>
                <ThemedText style={styles.featureHeaderTitle}>
                  Çfarë merr me Pro
                </ThemedText>

                <ThemedText
                  style={[
                    styles.featureHeaderSubtitle,
                    { color: textSecondary },
                  ]}
                >
                  Gjithçka që duhet për të ndërtuar bibliotekën tënde të
                  recetave.
                </ThemedText>
              </View>
            </View>

            <View style={styles.featureList}>
              {FEATURES.map((feature) => (
                <FeatureRow key={feature.title} feature={feature} />
              ))}
            </View>
          </ThemedCard>

          <ThemedCard
            variant="outline"
            style={[
              styles.guaranteeCard,
              {
                backgroundColor: surfaceMuted,
                borderColor: borderLight,
              },
            ]}
          >
            <IconCheck size={20} color={theme.primary} strokeWidth={2.6} />

            <ThemedText
              style={[styles.guaranteeText, { color: textSecondary }]}
            >
              Pa pagesë sot me planin vjetor. Mund ta anulosh provën kurdo.
            </ThemedText>
          </ThemedCard>
        </ScrollView>

        <ThemedView
          style={[
            styles.footer,
            {
              backgroundColor: theme.background,
              borderTopColor: borderLight,
            },
          ]}
        >
          <View style={styles.footerCopy}>
            <ThemedText style={styles.footerTitle}>
              {selectedPlan === "yearly"
                ? "7 ditë provë falas"
                : currentPlan.price}
            </ThemedText>

            <ThemedText
              style={[styles.footerSubtitle, { color: textSecondary }]}
            >
              {selectedPlan === "yearly"
                ? "Pastaj €25.99/vit. Anulo kurdo."
                : "Faturohet çdo muaj. Anulo kurdo."}
            </ThemedText>
          </View>

          <ThemedButton
            title={
              selectedPlan === "yearly"
                ? "Fillo provën falas"
                : "Vazhdo me planin mujor"
            }
            onPress={handleContinue}
            style={styles.cta}
          />

          <ThemedText style={[styles.legal, { color: textTertiary }]}>
            Duke vazhduar pranon kushtet e përdorimit dhe privatësinë.
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
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
  const paper = t.paper ?? theme.background;
  const surface = t.surface ?? "#F7F6F2";
  const border = t.border ?? "#E8E4DC";
  const primarySoft = t.primarySoft ?? surface;
  const textSecondary = t.textSecondary ?? "#756F66";

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <ThemedCard
          variant={selected ? "selected" : "outline"}
          style={[
            styles.planCard,
            {
              backgroundColor: paper,
              borderColor: selected ? theme.primary : border,
              opacity: pressed ? 0.82 : 1,
              transform: [{ scale: pressed ? 0.99 : 1 }],
            },
          ]}
        >
          <View style={styles.planTop}>
            <View style={styles.planTitleWrap}>
              <ThemedText style={styles.planTitle}>{plan.title}</ThemedText>

              <ThemedText
                style={[styles.planSubtitle, { color: textSecondary }]}
              >
                {plan.subtitle}
              </ThemedText>
            </View>

            <View
              style={[
                styles.radio,
                {
                  borderColor: selected ? theme.primary : border,
                  backgroundColor: selected ? theme.primary : "transparent",
                },
              ]}
            >
              {selected ? (
                <IconCheck size={15} color="#FFFFFF" strokeWidth={3.2} />
              ) : null}
            </View>
          </View>

          {plan.badge ? (
            <View style={[styles.badge, { backgroundColor: primarySoft }]}>
              <ThemedText style={[styles.badgeText, { color: theme.primary }]}>
                {plan.badge}
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.priceRow}>
            <ThemedText style={styles.price}>{plan.price}</ThemedText>

            <ThemedText style={[styles.period, { color: textSecondary }]}>
              {plan.period}
            </ThemedText>
          </View>

          <ThemedText style={[styles.planHelper, { color: textSecondary }]}>
            {plan.helper}
          </ThemedText>
        </ThemedCard>
      )}
    </Pressable>
  );
}

function FeatureRow({
  feature,
}: {
  feature: {
    title: string;
    subtitle: string;
    icon: string;
  };
}) {
  const theme = useTheme();

  const t = theme as any;
  const primarySoft = t.primarySoft ?? "#F7F6F2";
  const textSecondary = t.textSecondary ?? "#756F66";

  return (
    <View style={styles.featureRow}>
      <View style={[styles.featureIcon, { backgroundColor: primarySoft }]}>
        <FeatureIcon type={feature.icon} color={theme.primary} />
      </View>

      <View style={styles.featureCopy}>
        <ThemedText style={styles.featureTitle}>{feature.title}</ThemedText>

        <ThemedText style={[styles.featureSubtitle, { color: textSecondary }]}>
          {feature.subtitle}
        </ThemedText>
      </View>
    </View>
  );
}

function FeatureIcon({ type, color }: { type: string; color: string }) {
  if (type === "imports") {
    return <IconClipboardList size={20} color={color} strokeWidth={2.3} />;
  }

  if (type === "groceries") {
    return <IconShoppingCart size={20} color={color} strokeWidth={2.3} />;
  }

  if (type === "calendar") {
    return <IconCalendar size={20} color={color} strokeWidth={2.3} />;
  }

  if (type === "cook") {
    return <IconChefHat size={20} color={color} strokeWidth={2.3} />;
  }

  if (type === "photo") {
    return <IconPhoto size={20} color={color} strokeWidth={2.3} />;
  }

  return <IconCameraFilled size={20} color={color} />;
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.miniStat}>
      <ThemedText style={styles.miniStatValue}>{value}</ThemedText>
      <ThemedText style={styles.miniStatLabel}>{label}</ThemedText>
    </View>
  );
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
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  restoreText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: 210,
  },
  heroCard: {
    width: "100%",
    borderRadius: 34,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    alignItems: "center",
    ...Shadows.soft,
  },
  heroIcon: {
    width: 92,
    height: 92,
    borderRadius: Radius.xxl,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: {
    marginTop: Spacing.xl,
    alignItems: "center",
    gap: Spacing.sm,
  },
  eyebrow: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: "#EF4A38",
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "900",
    letterSpacing: -1,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "600",
    textAlign: "center",
  },
  heroStats: {
    width: "100%",
    marginTop: Spacing.xl,
    flexDirection: "row",
    gap: Spacing.sm,
  },
  miniStat: {
    flex: 1,
    minHeight: 72,
    borderRadius: Radius.xl,
    backgroundColor: "rgba(255,255,255,0.72)",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  miniStatValue: {
    fontFamily: Fonts.bold,
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "900",
  },
  miniStatLabel: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: "#756F66",
  },
  freeUsageCard: {
    marginTop: Spacing.lg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    backgroundColor: "#FFF8D8",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  freeUsageIcon: {
    width: 46,
    height: 46,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  freeUsageCopy: {
    flex: 1,
    gap: 2,
  },
  freeUsageTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "900",
  },
  freeUsageSubtitle: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  plans: {
    width: "100%",
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  planCard: {
    padding: Spacing.lg,
    borderRadius: Radius.xxl,
    borderWidth: 1.5,
    gap: Spacing.md,
  },
  planTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  planTitleWrap: {
    flex: 1,
    gap: 2,
  },
  planTitle: {
    fontFamily: Fonts.bold,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "900",
  },
  planSubtitle: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  radio: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  badgeText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.xs,
  },
  price: {
    fontFamily: Fonts.bold,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  period: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    lineHeight: 25,
    fontWeight: "700",
  },
  planHelper: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  featureCard: {
    width: "100%",
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    gap: Spacing.lg,
  },
  featureHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  featureHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  featureHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  featureHeaderTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
  },
  featureHeaderSubtitle: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  featureList: {
    gap: Spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  featureCopy: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
  },
  featureSubtitle: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  guaranteeCard: {
    width: "100%",
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  guaranteeText: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerCopy: {
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: 2,
  },
  footerTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
  },
  footerSubtitle: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  cta: {
    minHeight: 58,
  },
  legal: {
    marginTop: Spacing.sm,
    fontFamily: Fonts.medium,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});

import {
  IconBoltFilled,
  IconCalendar,
  IconCameraFilled,
  IconCheck,
  IconChefHat,
  IconClipboardList,
  IconCrown,
  IconPhoto,
  IconShoppingCart,
  IconSparkles,
  IconX,
} from "@tabler/icons-react-native";
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

const TERMS_URL = "https://recetaime.com/terms";
const PRIVACY_URL = "https://recetaime.com/privacy";

const PLANS: Plan[] = [
  {
    id: "monthly",
    title: "Mujore",
    subtitle: "Fleksibile",
    price: "€3.99",
    period: "/ muaj",
    helper: "Pa provë falas. Anulo kurdo.",
  },
  {
    id: "yearly",
    title: "Vjetore",
    subtitle: "Më e mira",
    price: "€29.99",
    period: "/ vit",
    badge: "7 ditë provë falas",
    helper: "Vetëm €2.49 në muaj.",
  },
];

const FEATURES = [
  {
    title: "Importime pa limit",
    subtitle: "Nga TikTok, Instagram, YouTube, web, foto dhe tekst.",
    icon: "imports",
  },
  {
    title: "Kalori & makro",
    subtitle: "Vlerësime për kalori, proteina, karbohidrate dhe yndyra.",
    icon: "nutrition",
  },
  {
    title: "Lista blerjeje",
    subtitle: "Kthe përbërësit në listë të organizuar.",
    icon: "groceries",
  },
  {
    title: "Plan vaktesh",
    subtitle: "Planifiko javën me recetat e tua.",
    icon: "calendar",
  },
  {
    title: "Cook mode",
    subtitle: "Hapa të pastër kur je duke gatuar.",
    icon: "cook",
  },
  {
    title: "Import nga foto",
    subtitle: "Përdor screenshot ose foto kur nuk ke link.",
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
  const textSecondary = t.textSecondary ?? "#756F66";
  const textTertiary = t.textTertiary ?? textSecondary;
  const primarySoft = t.primarySoft ?? "#FFF0ED";
  const primaryDark = t.primaryDark ?? theme.primary;

  const currentPlan = useMemo(
    () => PLANS.find((plan) => plan.id === selectedPlan) ?? PLANS[1],
    [selectedPlan],
  );

  const isYearly = selectedPlan === "yearly";

  const handleClose = () => {
    Haptics.selectionAsync();
    router.back();
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // TODO: connect to RevenueCat purchasePackage(...)
    router.back();
  };

  const handleRestore = () => {
    Haptics.selectionAsync();

    // TODO: connect to RevenueCat restorePurchases()
    Alert.alert("Rikthe blerjet", "Kjo do të lidhet me RevenueCat.");
  };

  const openUrl = (url: string) => {
    Haptics.selectionAsync();
    Linking.openURL(url);
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
                backgroundColor: cardMuted,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <IconX size={24} color={textSecondary} strokeWidth={2.7} />
          </Pressable>

          <Pressable onPress={handleRestore} hitSlop={12}>
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
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: "#FFF0ED",
                borderColor: borderLight,
              },
            ]}
          >
            <View
              style={[
                styles.heroIcon,
                { backgroundColor: "rgba(239, 74, 56, 0.10)" },
              ]}
            >
              <IconChefHat size={42} color={theme.primary} strokeWidth={2.15} />
            </View>

            <View style={styles.heroCopy}>
              <ThemedText style={[styles.eyebrow, { color: theme.primary }]}>
                RECETA IME PRO
              </ThemedText>

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
              <MiniStat
                value={isYearly ? "7d" : "€3.99"}
                label={isYearly ? "provë" : "muaj"}
              />
            </View>
          </View>

          <View
            style={[
              styles.freeUsageCard,
              {
                backgroundColor: "#FFF8D8",
              },
            ]}
          >
            <View
              style={[styles.freeUsageIcon, { backgroundColor: "#FFE7BF" }]}
            >
              <IconBoltFilled size={23} color={theme.primary} />
            </View>

            <View style={styles.freeUsageCopy}>
              <ThemedText style={styles.freeUsageTitle}>
                Falas: 5 importe në javë
              </ThemedText>

              <ThemedText
                style={[styles.freeUsageSubtitle, { color: textSecondary }]}
              >
                Pro zhbllokon importe pa limit dhe veçori të avancuara.
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
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedPlan(plan.id);
                  }}
                />
              );
            })}
          </View>

          {isYearly ? (
            <ThemedCard
              variant="outline"
              style={[
                styles.trialCard,
                {
                  backgroundColor: paper,
                  borderColor: borderLight,
                },
              ]}
            >
              <View style={styles.trialHeader}>
                <View
                  style={[styles.trialIcon, { backgroundColor: primarySoft }]}
                >
                  <IconSparkles
                    size={21}
                    color={theme.primary}
                    strokeWidth={2.35}
                  />
                </View>

                <View style={styles.trialHeaderCopy}>
                  <ThemedText style={styles.trialTitle}>
                    Si funksionon prova falas
                  </ThemedText>

                  <ThemedText
                    style={[styles.trialSubtitle, { color: textSecondary }]}
                  >
                    Nuk paguan sot.
                  </ThemedText>
                </View>
              </View>

              <View style={styles.trialSteps}>
                <TrialStep
                  number="1"
                  title="Sot"
                  text="Zhbllokon të gjitha veçoritë Pro."
                />

                <TrialStep
                  number="2"
                  title="Para përfundimit"
                  text="Mund ta anulosh para se të fillojë pagesa."
                />

                <TrialStep
                  number="3"
                  title="Pas 7 ditësh"
                  text="Pastaj €29.99/vit nëse vazhdon."
                  last
                />
              </View>
            </ThemedCard>
          ) : null}

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
                <IconCrown size={20} color={theme.primary} strokeWidth={2.35} />
              </View>

              <View style={styles.featureHeaderCopy}>
                <ThemedText style={styles.featureHeaderTitle}>
                  Çfarë zhbllokon
                </ThemedText>

                <ThemedText
                  style={[
                    styles.featureHeaderSubtitle,
                    { color: textSecondary },
                  ]}
                >
                  Gjithçka për të ruajtur, planifikuar dhe gatuar më lehtë.
                </ThemedText>
              </View>
            </View>

            <View style={styles.featureGrid}>
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
            <IconCheck size={20} color={theme.primary} strokeWidth={2.8} />

            <ThemedText
              style={[styles.guaranteeText, { color: textSecondary }]}
            >
              {isYearly
                ? "Pa pagesë sot me planin vjetor. Mund ta anulosh kurdo para përfundimit të provës."
                : "Plani mujor nuk ka provë falas. Mund ta anulosh kurdo."}
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
              {isYearly
                ? "7 ditë provë falas"
                : `${currentPlan.price} ${currentPlan.period}`}
            </ThemedText>

            <ThemedText
              style={[styles.footerSubtitle, { color: textSecondary }]}
            >
              {isYearly
                ? "Pastaj €29.99/vit. Anulo kurdo."
                : "Pa provë falas. Anulo kurdo."}
            </ThemedText>
          </View>

          <ThemedButton
            title={isYearly ? "Fillo provën falas" : "Vazhdo me planin mujor"}
            onPress={handleContinue}
            style={styles.cta}
          />

          <ThemedText style={[styles.legal, { color: textTertiary }]}>
            {isYearly
              ? "Pa pagesë sot. Duke vazhduar pranon kushtet e përdorimit dhe privatësinë."
              : "Duke vazhduar pranon kushtet e përdorimit dhe privatësinë."}
          </ThemedText>

          <View style={styles.footerLinks}>
            <Pressable onPress={() => openUrl(TERMS_URL)} hitSlop={10}>
              <ThemedText style={[styles.footerLink, { color: textTertiary }]}>
                Terms
              </ThemedText>
            </Pressable>

            <View
              style={[styles.footerDot, { backgroundColor: textTertiary }]}
            />

            <Pressable onPress={() => openUrl(PRIVACY_URL)} hitSlop={10}>
              <ThemedText style={[styles.footerLink, { color: textTertiary }]}>
                Privacy
              </ThemedText>
            </Pressable>

            <View
              style={[styles.footerDot, { backgroundColor: textTertiary }]}
            />

            <Pressable onPress={handleRestore} hitSlop={10}>
              <ThemedText style={[styles.footerLink, { color: textTertiary }]}>
                Restore
              </ThemedText>
            </Pressable>
          </View>
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

function TrialStep({
  number,
  title,
  text,
  last,
}: {
  number: string;
  title: string;
  text: string;
  last?: boolean;
}) {
  const theme = useTheme();

  const t = theme as any;
  const primarySoft = t.primarySoft ?? "#FFF0ED";
  const textSecondary = t.textSecondary ?? "#756F66";
  const borderLight = t.borderLight ?? theme.border;

  return (
    <View style={styles.trialStep}>
      <View style={styles.trialNumberWrap}>
        {!last ? (
          <View style={[styles.trialLine, { backgroundColor: borderLight }]} />
        ) : null}

        <View style={[styles.trialNumber, { backgroundColor: primarySoft }]}>
          <ThemedText
            style={[styles.trialNumberText, { color: theme.primary }]}
          >
            {number}
          </ThemedText>
        </View>
      </View>

      <View style={styles.trialStepCopy}>
        <ThemedText style={styles.trialStepTitle}>{title}</ThemedText>
        <ThemedText style={[styles.trialStepText, { color: textSecondary }]}>
          {text}
        </ThemedText>
      </View>
    </View>
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
  const primarySoft = t.primarySoft ?? "#FFF0ED";
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
    return <IconClipboardList size={19} color={color} strokeWidth={2.3} />;
  }

  if (type === "nutrition") {
    return <IconSparkles size={19} color={color} strokeWidth={2.3} />;
  }

  if (type === "groceries") {
    return <IconShoppingCart size={19} color={color} strokeWidth={2.3} />;
  }

  if (type === "calendar") {
    return <IconCalendar size={19} color={color} strokeWidth={2.3} />;
  }

  if (type === "cook") {
    return <IconChefHat size={19} color={color} strokeWidth={2.3} />;
  }

  if (type === "photo") {
    return <IconPhoto size={19} color={color} strokeWidth={2.3} />;
  }

  return <IconCameraFilled size={19} color={color} />;
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
    height: 58,
    paddingHorizontal: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    width: 46,
    height: 46,
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
    paddingTop: Spacing.sm,
    paddingBottom: 260,
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
    width: 88,
    height: 88,
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
    letterSpacing: 1.4,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    letterSpacing: -1,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "700",
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
    minHeight: 68,
    borderRadius: Radius.xl,
    backgroundColor: "rgba(255,255,255,0.58)",
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
    fontWeight: "800",
    color: "#756F66",
  },
  freeUsageCard: {
    marginTop: Spacing.lg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  freeUsageIcon: {
    width: 48,
    height: 48,
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
    fontWeight: "700",
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
  trialCard: {
    width: "100%",
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: Radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.lg,
    ...Shadows.soft,
  },
  trialHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  trialIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  trialHeaderCopy: {
    flex: 1,
    gap: 1,
  },
  trialTitle: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
  },
  trialSubtitle: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  trialSteps: {
    gap: Spacing.md,
  },
  trialStep: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  trialNumberWrap: {
    width: 36,
    alignItems: "center",
  },
  trialLine: {
    position: "absolute",
    top: 31,
    bottom: -18,
    width: 2,
    borderRadius: Radius.full,
  },
  trialNumber: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  trialNumberText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "900",
  },
  trialStepCopy: {
    flex: 1,
    gap: 1,
  },
  trialStepTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
  },
  trialStepText: {
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
    fontWeight: "700",
  },
  featureGrid: {
    gap: Spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  featureCopy: {
    flex: 1,
    gap: 1,
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
    fontWeight: "700",
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
    paddingBottom: Spacing.lg,
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
    fontWeight: "700",
  },
  cta: {
    minHeight: 58,
  },
  legal: {
    marginTop: Spacing.sm,
    fontFamily: Fonts.medium,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  footerLinks: {
    marginTop: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  footerLink: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: Radius.full,
    opacity: 0.55,
  },
});

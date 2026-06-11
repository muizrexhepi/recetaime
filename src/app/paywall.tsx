import {
  IconCalendar,
  IconChefHat,
  IconClipboardList,
  IconPhoto,
  IconShoppingCart,
} from "@tabler/icons-react-native";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const FEATURES = [
  "Importime pa limit",
  "Lista blerjeje",
  "Plan vaktesh",
  "Cook mode",
  "Import nga foto/link/tekst",
];

export default function PaywallScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
        >
          <ThemedView
            style={[styles.heroIcon, { backgroundColor: theme.primarySoft }]}
          >
            <IconChefHat size={46} color={theme.primary} strokeWidth={2.1} />
          </ThemedView>

          <ThemedText style={styles.title}>Receta Ime Pro</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Më shumë hapësirë për receta, plan dhe lista kur të jesh gati.
          </ThemedText>

          <ThemedView transparent style={styles.plans}>
            <PlanCard title="Monthly" price="€2.99" />
            <PlanCard title="Yearly" price="€25.99" badge="7 ditë provë falas" />
          </ThemedView>

          <ThemedCard variant="outline" style={styles.featureCard}>
            {FEATURES.map((feature, index) => (
              <ThemedView key={feature} transparent style={styles.featureRow}>
                <FeatureIcon index={index} />
                <ThemedText style={styles.featureText}>{feature}</ThemedText>
              </ThemedView>
            ))}
          </ThemedCard>

          <ThemedView transparent style={styles.copyStack}>
            <ThemedText style={styles.today}>Pa pagesë sot</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.cancel}>
              Anulo kurdo
            </ThemedText>
          </ThemedView>
        </ScrollView>

        <ThemedView transparent style={styles.footer}>
          <ThemedButton title="Vazhdo" onPress={() => router.back()} />
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

function PlanCard({
  title,
  price,
  badge,
}: {
  title: string;
  price: string;
  badge?: string;
}) {
  const theme = useTheme();

  return (
    <ThemedCard
      variant={badge ? "selected" : "outline"}
      style={[
        styles.planCard,
        badge ? { borderColor: theme.primary } : null,
      ]}
    >
      {badge ? (
        <ThemedView
          style={[styles.badge, { backgroundColor: theme.primarySoft }]}
        >
          <ThemedText style={[styles.badgeText, { color: theme.primary }]}>
            {badge}
          </ThemedText>
        </ThemedView>
      ) : null}
      <ThemedText style={styles.planTitle}>{title}</ThemedText>
      <ThemedText style={styles.price}>{price}</ThemedText>
    </ThemedCard>
  );
}

function FeatureIcon({ index }: { index: number }) {
  const theme = useTheme();
  const color = theme.primary;
  const icon =
    index === 0 ? (
      <IconClipboardList size={20} color={color} />
    ) : index === 1 ? (
      <IconShoppingCart size={20} color={color} />
    ) : index === 2 ? (
      <IconCalendar size={20} color={color} />
    ) : index === 3 ? (
      <IconChefHat size={20} color={color} />
    ) : (
      <IconPhoto size={20} color={color} />
    );

  return (
    <ThemedView style={[styles.featureIcon, { backgroundColor: theme.primarySoft }]}>
      {icon}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxl,
    alignItems: "center",
  },
  heroIcon: {
    width: 96,
    height: 96,
    borderRadius: Radius.xxl,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: Spacing.xl,
    fontSize: 38,
    lineHeight: 44,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    marginTop: Spacing.sm,
    fontSize: 17,
    lineHeight: 25,
    fontWeight: "600",
    textAlign: "center",
  },
  plans: {
    width: "100%",
    marginTop: Spacing.xxl,
    gap: Spacing.md,
  },
  planCard: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    gap: Spacing.sm,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  badgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
  },
  planTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "800",
  },
  price: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
  },
  featureCard: {
    width: "100%",
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
  },
  copyStack: {
    marginTop: Spacing.xl,
    alignItems: "center",
    gap: Spacing.xs,
  },
  today: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "900",
  },
  cancel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
});

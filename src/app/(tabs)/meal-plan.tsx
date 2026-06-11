import {
  IconCalendar,
  IconChefHat,
  IconPlus,
} from "@tabler/icons-react-native";
import { Pressable, ScrollView, StyleSheet } from "react-native";

import { EmptyTabState } from "@/components/tabs/empty-tab-state";
import { TabScreenHeader } from "@/components/tabs/tab-screen-header";
import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const DAYS = [
  "E hënë",
  "E martë",
  "E mërkurë",
  "E enjte",
  "E premte",
  "E shtunë",
  "E diel",
];

export default function MealPlanScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <TabScreenHeader
          title="Plani"
          subtitle="Planifiko çfarë do të gatuash gjatë javës."
        />

        <ThemedView transparent style={styles.days}>
          {DAYS.map((day) => (
            <ThemedCard key={day} style={styles.dayCard}>
              <ThemedView transparent style={styles.dayLeft}>
                <ThemedView
                  style={[
                    styles.dayIcon,
                    { backgroundColor: theme.primarySoft },
                  ]}
                >
                  <IconCalendar
                    size={20}
                    color={theme.primary}
                    strokeWidth={2.2}
                  />
                </ThemedView>

                <ThemedView transparent style={styles.dayText}>
                  <ThemedText type="smallBold" style={styles.dayTitle}>
                    {day}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Nuk ka vakt të planifikuar
                  </ThemedText>
                </ThemedView>
              </ThemedView>

              <Pressable
                style={({ pressed }) => [
                  styles.addButton,
                  {
                    backgroundColor: theme.cardMuted,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <IconPlus
                  size={19}
                  color={theme.textSecondary}
                  strokeWidth={2.3}
                />
              </Pressable>
            </ThemedCard>
          ))}
        </ThemedView>

        <EmptyTabState
          icon={
            <IconChefHat size={40} color={theme.herbGreen} strokeWidth={2.1} />
          }
          title="Planifikim më i lehtë"
          subtitle="Më vonë këtu mund të krijosh plan nga recetat që ke ruajtur."
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: 140,
  },
  days: {
    marginTop: Spacing.xxl,
    gap: Spacing.md,
  },
  dayCard: {
    padding: Spacing.md,
    borderRadius: Radius.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  dayLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  dayIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    flex: 1,
    gap: 2,
  },
  dayTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});

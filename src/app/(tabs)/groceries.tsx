import {
  IconChefHat,
  IconShoppingCart,
  IconSparkles,
} from "@tabler/icons-react-native";
import { StyleSheet } from "react-native";

import { EmptyTabState } from "@/components/tabs/empty-tab-state";
import { TabScreen } from "@/components/tabs/tab-screen";
import { TabScreenHeader } from "@/components/tabs/tab-screen-header";
import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export default function GroceriesScreen() {
  const theme = useTheme();

  return (
    <TabScreen>
      <TabScreenHeader
        title="Lista"
        subtitle="Përbërësit nga recetat do të kthehen në listë blerjeje."
      />

      <EmptyTabState
        icon={
          <IconShoppingCart size={42} color={theme.primary} strokeWidth={2.1} />
        }
        title="Lista është bosh"
        subtitle="Kur të ruash ose planifikosh receta, përbërësit mund t’i shtosh këtu."
      />

      <ThemedCard style={styles.smartCard}>
        <ThemedView
          style={[styles.smartIcon, { backgroundColor: theme.softGreen }]}
        >
          <IconSparkles size={22} color={theme.herbGreen} strokeWidth={2.2} />
        </ThemedView>

        <ThemedView transparent style={styles.smartCopy}>
          <ThemedText type="smallBold" style={styles.smartTitle}>
            Lista inteligjente
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Bashko përbërësit e njëjtë dhe hiq gjërat që i ke tashmë.
          </ThemedText>
        </ThemedView>

        <IconChefHat size={20} color={theme.textTertiary} strokeWidth={2.1} />
      </ThemedCard>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  smartCard: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  smartIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  smartCopy: {
    flex: 1,
    gap: 2,
  },
  smartTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
});

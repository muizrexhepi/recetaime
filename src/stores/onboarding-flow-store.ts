import { create } from "zustand";

export type OnboardingGoal =
  | "save_recipes"
  | "organize_collections"
  | "meal_plan"
  | "grocery_lists"
  | "family_recipes"
  | "cook_more";

export type ImportSource =
  | "social"
  | "websites"
  | "photo"
  | "family"
  | "printed"
  | "manual";

export type ReminderMoment =
  | "morning"
  | "lunch"
  | "afternoon"
  | "evening"
  | "weekend";

export type HeardFrom =
  | "tiktok"
  | "instagram"
  | "youtube"
  | "google"
  | "friend"
  | "other";

export type AgeRange = "18-24" | "25-34" | "35-44" | "45-54" | "55+";

type OnboardingFlowState = {
  stepIndex: number;
  selectedGoals: OnboardingGoal[];
  selectedSources: ImportSource[];
  selectedReminderMoments: ReminderMoment[];
  heardFrom?: HeardFrom;
  ageRange?: AgeRange;
  nextStep: () => void;
  previousStep: () => void;
  setStepIndex: (index: number) => void;
  toggleGoal: (goal: OnboardingGoal) => void;
  toggleSource: (source: ImportSource) => void;
  toggleReminderMoment: (moment: ReminderMoment) => void;
  setHeardFrom: (value: HeardFrom) => void;
  setAgeRange: (value: AgeRange) => void;
  resetFlow: () => void;
};

const initialState = {
  stepIndex: 0,
  selectedGoals: [],
  selectedSources: [],
  selectedReminderMoments: [],
  heardFrom: undefined,
  ageRange: undefined,
};

export const useOnboardingFlowStore = create<OnboardingFlowState>()((set) => ({
  ...initialState,

  nextStep: () =>
    set((state) => ({
      stepIndex: state.stepIndex + 1,
    })),

  previousStep: () =>
    set((state) => ({
      stepIndex: Math.max(0, state.stepIndex - 1),
    })),

  setStepIndex: (index) =>
    set({
      stepIndex: Math.max(0, index),
    }),

  toggleGoal: (goal) =>
    set((state) => ({
      selectedGoals: state.selectedGoals.includes(goal)
        ? state.selectedGoals.filter((item) => item !== goal)
        : [...state.selectedGoals, goal],
    })),

  toggleSource: (source) =>
    set((state) => ({
      selectedSources: state.selectedSources.includes(source)
        ? state.selectedSources.filter((item) => item !== source)
        : [...state.selectedSources, source],
    })),

  toggleReminderMoment: (moment) =>
    set((state) => ({
      selectedReminderMoments: state.selectedReminderMoments.includes(moment)
        ? state.selectedReminderMoments.filter((item) => item !== moment)
        : [...state.selectedReminderMoments, moment],
    })),

  setHeardFrom: (value) =>
    set({
      heardFrom: value,
    }),

  setAgeRange: (value) =>
    set({
      ageRange: value,
    }),

  resetFlow: () => set(initialState),
}));

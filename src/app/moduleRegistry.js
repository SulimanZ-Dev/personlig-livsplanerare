import { isThisWeek, localISO } from "../core/dates/dateUtils";
import { economyTotal } from "../modules/economy/economyModel";

const number = (value, options = {}) => new Intl.NumberFormat("sv-SE", options).format(value);

export const MODULE_REGISTRY = [
  {
    id: "economy",
    label: "Ekonomi",
    icon: "wallet",
    color: "#3ddc84",
    summary: (state) => `${number(economyTotal(state.modules.economy), { maximumFractionDigits: 0 })} kr`,
    detail: (state) => `${Object.values(state.modules.economy.accounts).filter((account) => !account.archived).length} aktiva konton`,
  },
  {
    id: "habits",
    label: "Rutiner",
    icon: "check",
    color: "#f0b429",
    summary: (state) => {
      const today = localISO();
      const done = state.modules.habits.checkIns.filter((entry) => entry.date === today && entry.done).length;
      return `${done}/${state.modules.habits.habits.length} idag`;
    },
    detail: (state) => state.modules.habits.habits.length ? "Never zero" : "Skapa din första rutin",
  },
  {
    id: "gym",
    label: "Gym",
    icon: "dumbbell",
    color: "#5eb1ff",
    summary: (state) => `${state.modules.gym.workouts.filter((workout) => isThisWeek(workout.date)).length} pass`,
    detail: () => "den här veckan",
  },
  {
    id: "studies",
    label: "Studier",
    icon: "book",
    color: "#a78bfa",
    summary: (state) => {
      const minutes = state.modules.studies.sessions.filter((session) => isThisWeek(session.startedAt)).reduce((sum, session) => sum + session.durationMinutes, 0);
      return minutes < 60 ? `${minutes} min` : `${(minutes / 60).toFixed(1)} h`;
    },
    detail: (state) => state.modules.studies.activeSession ? "Session pågår" : "deep work denna vecka",
  },
  {
    id: "reviews",
    label: "Review",
    icon: "review",
    color: "#f472b6",
    summary: (state) => `${state.modules.reviews.entries.length} gjorda`,
    detail: () => "se mönster och justera",
  },
];

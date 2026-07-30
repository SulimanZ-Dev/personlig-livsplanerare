import { isThisWeek, localISO } from "../../core/dates/dateUtils";
import { Icon } from "../../components/ui/Icon";

export function DashboardView({ state, onNavigate }) {
  const today = localISO();
  const economy = state.modules.economy;
  const total = Object.values(economy.accounts).reduce((sum, account) => sum + account.balance, 0);
  const nextMilestone = economy.milestones.find((item) => item.target > total);
  const habits = state.modules.habits.habits;
  const doneToday = habits.filter((habit) => state.modules.habits.checkIns.some((check) => check.habitId === habit.id && check.date === today && check.done));
  const weeklyMinutes = state.modules.studies.sessions.filter((session) => isThisWeek(session.startedAt)).reduce((sum, session) => sum + session.durationMinutes, 0);
  const workouts = state.modules.gym.workouts.filter((workout) => isThisWeek(workout.date));

  return (
    <div className="page dashboard">
      <header className="hero">
        <div className="eyebrow">LIVSSYSTEM · {today}</div>
        <h1>Kontrollpanelen</h1>
        <p>En tydlig blick på det som flyttar livet framåt.</p>
      </header>

      <section className="today-card card">
        <div className="row-between"><div><div className="eyebrow">IDAG</div><h2>{doneToday.length}/{habits.length} rutiner klara</h2></div><span className="score-ring">{habits.length ? Math.round(doneToday.length / habits.length * 100) : 0}<small>%</small></span></div>
        <div className="habit-dots">{habits.map((habit) => <button key={habit.id} onClick={() => onNavigate("habits")} className={doneToday.includes(habit) ? "done" : ""} style={{ "--habit-color": habit.color }}><Icon name="check" size={15} /><span>{habit.name}</span></button>)}</div>
      </section>

      <div className="dashboard-grid">
        <button className="card module-card economy-card" onClick={() => onNavigate("economy")}>
          <div className="module-icon"><Icon name="wallet" /></div><span>EKONOMI</span>
          <strong>{new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 }).format(total)} kr</strong>
          <small>{nextMilestone ? `${Math.ceil(nextMilestone.target - total).toLocaleString("sv-SE")} kr till ${nextMilestone.label}` : "Planen är nådd"}</small>
        </button>
        <button className="card module-card" onClick={() => onNavigate("gym")}>
          <div className="module-icon blue"><Icon name="dumbbell" /></div><span>GYM</span>
          <strong>{workouts.length} pass</strong><small>den här veckan</small>
        </button>
        <button className="card module-card" onClick={() => onNavigate("studies")}>
          <div className="module-icon purple"><Icon name="book" /></div><span>STUDIER</span>
          <strong>{(weeklyMinutes / 60).toFixed(1)} h</strong><small>deep work i veckan</small>
        </button>
        <button className="card module-card" onClick={() => onNavigate("reviews")}>
          <div className="module-icon amber"><Icon name="review" /></div><span>REVIEW</span>
          <strong>{state.modules.reviews.entries.length}</strong><small>sparade reflektioner</small>
        </button>
      </div>

      <section className="section">
        <div className="section-title"><span>NÄSTA STEG</span></div>
        <button className="next-action card" onClick={() => onNavigate("goals")}><Icon name="target" /><div><strong>Fortsätt mot dina mål</strong><small>{Object.values(state.goals).filter((goal) => goal.status === "active").length} aktiva mål väntar</small></div><span>→</span></button>
      </section>
    </div>
  );
}


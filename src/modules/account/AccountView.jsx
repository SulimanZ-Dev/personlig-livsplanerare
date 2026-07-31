import { useState } from "react";
import { Icon } from "../../components/ui/Icon";
import { useAuth } from "../../core/sync/AuthContext";

export function AccountView({ state, onUpdateProfile }) {
  const { user, firebaseEnabled, authError, login, register, logout, reset } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: state.profile.displayName || "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (mode === "register") {
        await register(form.name, form.email, form.password);
        if (form.name.trim()) onUpdateProfile(form.name.trim());
      } else {
        await login(form.email, form.password);
      }
    } catch {
      // AuthContext owns the user-facing error.
    } finally {
      setBusy(false);
    }
  };

  if (user) {
    return (
      <div className="page">
        <header className="page-header"><div className="eyebrow">KONTO & SYNK</div><h1>Din profil</h1><p>Samma plan följer dig mellan telefon, webb och Windows.</p></header>
        <section className="card signed-in-card"><span className="profile-avatar"><Icon name="user" size={26} /></span><div><strong>{user.displayName || state.profile.displayName || "Livsbyggare"}</strong><span>{user.email}</span><small><i /> Molnsynk aktiv</small></div></section>
        <section className="card sync-explainer"><Icon name="swap" /><div><strong>Local-first synk</strong><p>Ändringar sparas omedelbart på enheten och skickas sedan krypterat över HTTPS till ditt privata konto. Om nätet försvinner fortsätter appen fungera och synkar senare.</p></div></section>
        <button className="secondary-button logout-button" onClick={logout}><Icon name="logout" size={17} /> Logga ut</button>
      </div>
    );
  }

  return (
    <div className="page auth-page">
      <header className="page-header"><div className="eyebrow">ETT LIV · ALLA ENHETER</div><h1>{mode === "register" ? "Skapa konto" : "Logga in"}</h1><p>Gratis synk med e-post och lösenord. Din data är endast tillgänglig för ditt konto.</p></header>
      {!firebaseEnabled ? <div className="card setup-warning"><Icon name="pulse" /><div><strong>Molnsynk väntar på konfiguration</strong><p>Appen fungerar lokalt. Firebase-miljön behöver kopplas innan konton kan skapas.</p></div></div> : (
        <form className="card auth-form form-stack" onSubmit={submit}>
          {mode === "register" && <label>Namn<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Vad ska coachen kalla dig?" required /></label>}
          <label>E-post<input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="du@exempel.se" required /></label>
          <label>Lösenord<input type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} minLength="6" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Minst 6 tecken" required /></label>
          {authError && <div className="form-error">{authError}</div>}
          {message && <div className="form-success">{message}</div>}
          <button className="primary-button" disabled={busy}>{busy ? "Arbetar…" : mode === "register" ? "Skapa gratis konto" : "Logga in och synka"}</button>
          <button type="button" className="text-button" onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Ny här? Skapa konto" : "Har du redan konto? Logga in"}</button>
          {mode === "login" && <button type="button" className="text-button muted-link" onClick={async () => { if (!form.email) { setMessage("Skriv din e-post först."); return; } try { await reset(form.email); setMessage("Återställningsmejl skickat."); } catch { /* Context displays error. */ } }}>Glömt lösenordet?</button>}
        </form>
      )}
      <aside className="privacy-note"><Icon name="check" size={15} /><span>Ingen reklam, ingen AI, ingen försäljning av data.</span></aside>
    </div>
  );
}

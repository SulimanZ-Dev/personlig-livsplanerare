import { useRef, useState } from "react";
import { Icon } from "../../components/ui/Icon";
import { Modal } from "../../components/ui/Modal";
import { useAuth } from "../../core/sync/AuthContext";
import { hasLocalPin, removeLocalPin, setLocalPin } from "../../core/security/localLock";

export function SettingsView({ state, onUpdateProfile, onImport, onReset, onReplayIntro, onLockNow }) {
  const { user, logout } = useAuth();
  const fileRef = useRef(null);
  const [confirmText, setConfirmText] = useState("");
  const [resetScope, setResetScope] = useState(user ? "cloud" : "local");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [backups, setBackups] = useState(() => { try { return JSON.parse(window.localStorage.getItem("life-planner:backups") || "[]"); } catch { return []; } });

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `livssystem-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Backup nedladdad.");
  };

  const download = (name, content, type = "text/csv") => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url; link.download = name; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const csv = (rows) => {
    if (!rows.length) return "";
    const keys = [...new Set(rows.flatMap((row) => Object.keys(row).filter((key) => typeof row[key] !== "object")))];
    const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    return [keys.join(","), ...rows.map((row) => keys.map((key) => escape(row[key])).join(","))].join("\n");
  };
  const exportModule = (moduleId) => {
    const sources = { economy: state.modules.economy.transactions, nutrition: state.modules.nutrition.intakeLogs, gym: state.modules.gym.workouts.map((item) => ({ id: item.id, date: item.date, type: item.type, exercises: item.exercises.map((entry) => entry.name).join(" | ") })), studies: state.modules.studies.sessions, habits: state.modules.habits.checkIns };
    download(`livssystem-${moduleId}-${new Date().toISOString().slice(0, 10)}.csv`, csv(sources[moduleId] || []));
  };
  const enableNotifications = async () => {
    if (!("Notification" in window)) { setMessage("Webbläsaren stöder inte lokala notiser."); return; }
    const permission = await Notification.requestPermission();
    onUpdateProfile({ notificationsEnabled: permission === "granted" });
    setMessage(permission === "granted" ? "Lokala PWA-notiser är aktiverade." : "Notiser tilläts inte av webbläsaren.");
  };

  const importJson = (text) => {
    try {
      const parsed = JSON.parse(text);
      if (!parsed.modules || !parsed.goals || !parsed.profile) throw new Error("shape");
      onImport(parsed);
      setMessage("Backup importerad och kontrollerad.");
      setPasteOpen(false);
      setPasteText("");
    } catch {
      setMessage("Filen är inte en giltig Livssystem-backup.");
    }
  };

  const importData = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) importJson(await file.text());
  };

  const purge = async () => {
    if (confirmText !== "RADERA") return;
    setBusy(true);
    try {
      if (resetScope === "local" && user) {
        await logout();
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }
      await onReset({ syncCloud: resetScope === "cloud" && Boolean(user) });
    } finally {
      setBusy(false);
      setConfirmText("");
    }
  };

  return <div className="page settings-page"><header className="page-header"><div className="eyebrow">KONTROLLRUM</div><h1>Inställningar</h1><p>Utseende, backup, diskreta indikatorer och data — med tydliga säkerhetsräcken.</p></header>
    <section className="settings-stack">
      <article className="card setting-card"><span className="setting-icon"><Icon name="sun" /></span><div><strong>Tema</strong><p>Mörkt är standard, ljust är byggt för dagsljus.</p></div><button className="secondary-button compact-button" onClick={() => onUpdateProfile({ theme: state.profile.theme === "light" ? "dark" : "light" })}>{state.profile.theme === "light" ? "Mörkt" : "Ljust"}</button></article>
      <article className="card setting-card"><span className="setting-icon"><Icon name="bell" /></span><div><strong>Diskreta indikatorer</strong><p>Små badges i appen för two-miss-risk och reviews. Inga pushnotiser, ljud eller spam.</p></div><button className={`secondary-button compact-button ${state.profile.quietIndicatorsEnabled ? "active" : ""}`} onClick={() => onUpdateProfile({ quietIndicatorsEnabled: !state.profile.quietIndicatorsEnabled })}>{state.profile.quietIndicatorsEnabled ? "På" : "Av"}</button></article>
      <article className="card setting-card"><span className="setting-icon"><Icon name="bell" /></span><div><strong>Lokala PWA-notiser</strong><p>Varnar för streak-risk och kommande reviews när appen är installerad eller aktiv.</p></div><button className={`secondary-button compact-button ${state.profile.notificationsEnabled ? "active" : ""}`} onClick={enableNotifications}>{state.profile.notificationsEnabled ? "Aktiva" : "Aktivera"}</button></article>
      <article className="card setting-card"><span className="setting-icon"><Icon name="pulse" /></span><div><strong>Onboarding</strong><p>Spela upp den korta introduktionen igen.</p></div><button className="secondary-button compact-button" onClick={onReplayIntro}>Visa intro</button></article>
      <article className="card setting-card"><span className="setting-icon"><Icon name="shield" /></span><div><strong>Lokalt PIN-lås</strong><p>PIN-hashen stannar på enheten och skickas inte till molnet.</p></div><button className="secondary-button compact-button" onClick={() => hasLocalPin() ? onLockNow() : setPinOpen(true)}>{hasLocalPin() ? "Lås nu" : "Skapa PIN"}</button>{hasLocalPin() && <button className="text-button" onClick={() => { removeLocalPin(); onUpdateProfile({ localLockEnabled: false }); setMessage("PIN-låset har tagits bort."); }}>Ta bort</button>}</article>
    </section>

    <section className="section"><div className="section-title"><span>VISNING & TILLGÄNGLIGHET</span></div><div className="appearance-grid"><article className="card"><strong>Densitet</strong><div className="segmented"><button className={state.profile.density !== "compact" ? "active" : ""} onClick={() => onUpdateProfile({ density: "comfortable" })}>Luftig</button><button className={state.profile.density === "compact" ? "active" : ""} onClick={() => onUpdateProfile({ density: "compact" })}>Kompakt</button></div></article><article className="card"><strong>Textstorlek</strong><div className="segmented">{[["normal", "Normal"], ["large", "Stor"], ["xlarge", "Extra stor"]].map(([id, label]) => <button className={state.profile.textScale === id ? "active" : ""} key={id} onClick={() => onUpdateProfile({ textScale: id })}>{label}</button>)}</div></article><article className="card"><strong>Kontrast</strong><button className={`secondary-button ${state.profile.highContrast ? "active" : ""}`} onClick={() => onUpdateProfile({ highContrast: !state.profile.highContrast })}>{state.profile.highContrast ? "Hög kontrast" : "Standard"}</button></article></div></section>
    <section className="section"><div className="section-title"><span>GESTER · IDAG-VYN</span></div><div className="appearance-grid gesture-settings">{[["swipeRight", "Svep höger"], ["swipeLeft", "Svep vänster"], ["doubleTap", "Dubbeltryck"]].map(([key, label]) => <article className="card" key={key}><strong>{label}</strong><select value={state.profile.gestures?.[key] || "off"} onChange={(event) => onUpdateProfile({ gestures: { ...(state.profile.gestures || {}), [key]: event.target.value } })}><option value="complete">Klar/återöppna</option><option value="skip">Hoppa över</option><option value="off">Ingen handling</option></select></article>)}</div></section>

    <section className="section"><div className="section-title"><span>BACKUP · JSON & CSV</span></div><div className="backup-grid"><button className="card backup-action" onClick={exportData}><Icon name="download" /><strong>Exportera allt</strong><small>Ladda ned en portabel JSON-backup.</small></button><button className="card backup-action" onClick={() => fileRef.current?.click()}><Icon name="upload" /><strong>Importera fil</strong><small>Ersätter nuvarande data efter validering.</small></button><button className="card backup-action backup-paste" onClick={() => setPasteOpen(true)}><Icon name="edit" /><strong>Klistra in JSON</strong><small>Smidigt på telefon eller från GitHub.</small></button><input ref={fileRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={importData} /></div><div className="csv-buttons">{[["economy", "Ekonomi"], ["nutrition", "Nutrition"], ["gym", "Gym"], ["studies", "Studier"], ["habits", "Rutiner"]].map(([id, label]) => <button className="secondary-button" key={id} onClick={() => exportModule(id)}><Icon name="download" size={14} /> {label} CSV</button>)}</div>{message && <div className="form-success settings-message">{message}</div>}</section>

    <section className="section"><div className="section-title"><span>AUTOMATISKA LOKALA BACKUPER</span><small>senaste fem</small></div><div className="history-list">{backups.map((backup) => <div className="history-row" key={backup.id}><Icon name="shield" /><div><strong>{backup.label}</strong><small>{new Date(backup.createdAt).toLocaleString("sv-SE")}</small></div><button className="secondary-button compact-button" onClick={() => { onImport(backup.state, `Återställd: ${backup.label}`); setBackups(JSON.parse(window.localStorage.getItem("life-planner:backups") || "[]")); }}>Återställ</button></div>)}{!backups.length && <div className="empty-state">Backuper skapas automatiskt när du loggar eller ändrar data.</div>}</div></section>

    <section className="danger-zone card"><div className="eyebrow">DANGER ZONE</div><h2>Töm all data</h2><p>Detta tar bort mål, transaktioner, pass, rutiner, sessionshistorik och reviews. En lokal reset loggar först ut så att molnkopian inte påverkas.</p>{user && <div className="reset-scope"><label><input type="radio" name="scope" value="local" checked={resetScope === "local"} onChange={() => setResetScope("local")} /> Bara denna enhet</label><label><input type="radio" name="scope" value="cloud" checked={resetScope === "cloud"} onChange={() => setResetScope("cloud")} /> Denna enhet + molnet</label></div>}<label>Skriv <strong>RADERA</strong> för att låsa upp<input value={confirmText} onChange={(event) => setConfirmText(event.target.value)} placeholder="RADERA" autoComplete="off" /></label><button className="danger-button" disabled={confirmText !== "RADERA" || busy} onClick={purge}><Icon name="trash" size={17} /> {busy ? "Tömmer…" : "Töm all data"}</button></section>
    {pasteOpen && <Modal title="Klistra in backup-JSON" onClose={() => setPasteOpen(false)}><form className="form-stack" onSubmit={(event) => { event.preventDefault(); importJson(pasteText); }}><p className="paste-help">Innehållet valideras och normaliseras innan det ersätter nuvarande data.</p><label>JSON<textarea rows="10" value={pasteText} onChange={(event) => setPasteText(event.target.value)} placeholder={'{"schemaVersion": 6, …}'} autoFocus /></label><button className="primary-button" disabled={!pasteText.trim()}>Importera och ersätt</button></form></Modal>}
    {pinOpen && <Modal title="Skapa lokalt PIN-lås" onClose={() => setPinOpen(false)}><form className="form-stack" onSubmit={async (event) => { event.preventDefault(); if (!/^\d{4,12}$/.test(pin)) return; await setLocalPin(pin); onUpdateProfile({ localLockEnabled: true }); setPin(""); setPinOpen(false); setMessage("PIN-lås aktiverat på den här enheten."); }}><p>Välj 4–12 siffror. Om du glömmer koden behöver du rensa webbplatsdata på enheten.</p><label>PIN<input autoFocus type="password" inputMode="numeric" pattern="[0-9]*" minLength="4" maxLength="12" value={pin} onChange={(event) => setPin(event.target.value)} /></label><button className="primary-button" disabled={!/^\d{4,12}$/.test(pin)}>Aktivera lås</button></form></Modal>}
  </div>;
}

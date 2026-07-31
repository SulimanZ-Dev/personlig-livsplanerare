import { useRef, useState } from "react";
import { Icon } from "../../components/ui/Icon";
import { Modal } from "../../components/ui/Modal";
import { useAuth } from "../../core/sync/AuthContext";

export function SettingsView({ state, onUpdateProfile, onImport, onReset, onReplayIntro }) {
  const { user, logout } = useAuth();
  const fileRef = useRef(null);
  const [confirmText, setConfirmText] = useState("");
  const [resetScope, setResetScope] = useState(user ? "cloud" : "local");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

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
      <article className="card setting-card"><span className="setting-icon"><Icon name="pulse" /></span><div><strong>Onboarding</strong><p>Spela upp den korta introduktionen igen.</p></div><button className="secondary-button compact-button" onClick={onReplayIntro}>Visa intro</button></article>
    </section>

    <section className="section"><div className="section-title"><span>BACKUP · JSON</span></div><div className="backup-grid"><button className="card backup-action" onClick={exportData}><Icon name="download" /><strong>Exportera allt</strong><small>Ladda ned en portabel backup.</small></button><button className="card backup-action" onClick={() => fileRef.current?.click()}><Icon name="upload" /><strong>Importera fil</strong><small>Ersätter nuvarande data efter validering.</small></button><button className="card backup-action backup-paste" onClick={() => setPasteOpen(true)}><Icon name="edit" /><strong>Klistra in JSON</strong><small>Smidigt på telefon eller från GitHub.</small></button><input ref={fileRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={importData} /></div>{message && <div className="form-success settings-message">{message}</div>}</section>

    <section className="danger-zone card"><div className="eyebrow">DANGER ZONE</div><h2>Töm all data</h2><p>Detta tar bort mål, transaktioner, pass, rutiner, sessionshistorik och reviews. En lokal reset loggar först ut så att molnkopian inte påverkas.</p>{user && <div className="reset-scope"><label><input type="radio" name="scope" value="local" checked={resetScope === "local"} onChange={() => setResetScope("local")} /> Bara denna enhet</label><label><input type="radio" name="scope" value="cloud" checked={resetScope === "cloud"} onChange={() => setResetScope("cloud")} /> Denna enhet + molnet</label></div>}<label>Skriv <strong>RADERA</strong> för att låsa upp<input value={confirmText} onChange={(event) => setConfirmText(event.target.value)} placeholder="RADERA" autoComplete="off" /></label><button className="danger-button" disabled={confirmText !== "RADERA" || busy} onClick={purge}><Icon name="trash" size={17} /> {busy ? "Tömmer…" : "Töm all data"}</button></section>
    {pasteOpen && <Modal title="Klistra in backup-JSON" onClose={() => setPasteOpen(false)}><form className="form-stack" onSubmit={(event) => { event.preventDefault(); importJson(pasteText); }}><p className="paste-help">Innehållet valideras och normaliseras innan det ersätter nuvarande data.</p><label>JSON<textarea rows="10" value={pasteText} onChange={(event) => setPasteText(event.target.value)} placeholder={'{"schemaVersion": 4, …}'} autoFocus /></label><button className="primary-button" disabled={!pasteText.trim()}>Importera och ersätt</button></form></Modal>}
  </div>;
}

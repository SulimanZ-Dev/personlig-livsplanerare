import { useEffect, useState } from "react";
import { Icon } from "../../components/ui/Icon";
import { isThisWeek } from "../../core/dates/dateUtils";

const clock = (seconds) => `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor(seconds % 3600 / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

export function StudiesView({ data, onStart, onStop, onToggleRoadmap, onAddRoadmap, onRemoveRoadmap }) {
  const [subject, setSubject] = useState("");
  const [roadmapName, setRoadmapName] = useState("");
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!data.activeSession) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [data.activeSession]);
  const elapsed = data.activeSession ? Math.max(0, Math.floor((now - new Date(data.activeSession.startedAt).getTime()) / 1000)) : 0;
  const weekly = data.sessions.filter((session) => isThisWeek(session.startedAt));
  const minutes = weekly.reduce((sum, session) => sum + session.durationMinutes, 0);
  const days = [1, 2, 3, 4, 5, 6, 0].map((day) => weekly.filter((session) => new Date(session.startedAt).getDay() === day).reduce((sum, session) => sum + session.durationMinutes, 0));
  const max = Math.max(60, ...days);
  const roadmap = data.roadmap || [];
  const roadmapDone = roadmap.filter((item) => item.done).length;
  return (
    <div className="page">
      <header className="page-header"><div className="eyebrow">DEEP WORK</div><h1>Studier</h1><p>Skydda tiden. Gör en sak ordentligt.</p></header>
      {data.blocks?.length > 0 && <section className="study-blocks">{data.blocks.map((block) => <article className="card" key={block.start}><span>{block.start}–{block.end}</span><strong>{block.label}</strong></article>)}<p>{data.noteStyle}</p></section>}
      <section className={`timer-card card ${data.activeSession ? "running" : ""}`}><div className="timer-orbit"><Icon name="clock" size={30} /><strong>{clock(elapsed)}</strong><span>{data.activeSession?.subject || "REDO ATT FOKUSERA"}</span></div>{data.activeSession ? <button className="danger-button" onClick={() => onStop(elapsed)}>Avsluta och spara</button> : <div className="timer-start"><input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Vad ska du studera?" /><button className="primary-button blue-button" onClick={() => { if (subject.trim()) { onStart(subject.trim()); setSubject(""); } }}>Starta session</button></div>}</section>
      <section className="card weekly-card"><div className="row-between"><div><span className="eyebrow">DEN HÄR VECKAN</span><strong>{minutes < 60 ? minutes : (minutes / 60).toFixed(1)} <small>{minutes < 60 ? "minuter" : "timmar"}</small></strong></div><span className="positive mono">{weekly.length} BLOCK</span></div><div className="bar-chart">{days.map((value, index) => <div key={index}><i style={{ height: `${Math.max(4, value / max * 100)}%` }} /><span>{["M", "T", "O", "T", "F", "L", "S"][index]}</span></div>)}</div></section>
      <section className="section roadmap-section"><div className="section-title"><span>ROADMAP · FRI ORDNING</span><small>{roadmapDone}/{roadmap.length} klara</small></div><div className="card roadmap-card">{roadmap.length > 0 && <div className="roadmap-progress"><i style={{ width: `${roadmapDone / roadmap.length * 100}%` }} /></div>}<div className="roadmap-list">{roadmap.map((item) => <div className={`roadmap-row ${item.done ? "done" : ""}`} key={item.id}><button className="roadmap-check" aria-label={`${item.done ? "Återöppna" : "Slutför"} ${item.name}`} onClick={() => onToggleRoadmap(item.id)}><Icon name="check" size={15} /></button><div><strong>{item.name}</strong><small>{item.done ? "Klar" : item.note || "Kan göras när timingen är rätt"}</small></div><button className="roadmap-remove" aria-label={`Ta bort ${item.name}`} onClick={() => onRemoveRoadmap(item.id)}><Icon name="close" size={14} /></button></div>)}</div><form className="roadmap-add" onSubmit={(event) => { event.preventDefault(); if (!roadmapName.trim()) return; onAddRoadmap(roadmapName.trim()); setRoadmapName(""); }}><input value={roadmapName} onChange={(event) => setRoadmapName(event.target.value)} placeholder="Lägg till certifiering eller steg" /><button className="secondary-button" aria-label="Lägg till roadmap-steg"><Icon name="plus" size={16} /></button></form></div></section>
      <section className="section"><div className="section-title"><span>SENASTE SESSIONER</span></div><div className="history-list">{data.sessions.slice().reverse().slice(0, 10).map((session) => <div className="history-row" key={session.id}><Icon name="book" size={17} /><div><strong>{session.subject}</strong><small>{new Date(session.startedAt).toLocaleDateString("sv-SE")}</small></div><b className="mono">{session.durationMinutes} min</b></div>)}</div></section>
    </div>
  );
}

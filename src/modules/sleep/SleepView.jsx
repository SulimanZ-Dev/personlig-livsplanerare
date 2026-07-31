import { useMemo, useState } from "react";
import { Icon } from "../../components/ui/Icon";
import { localISO } from "../../core/dates/dateUtils";

const durationHours = (bedtime, wakeTime) => {
  if (!bedtime || !wakeTime) return 0;
  const [bedHour, bedMinute] = bedtime.split(":").map(Number);
  const [wakeHour, wakeMinute] = wakeTime.split(":").map(Number);
  let minutes = wakeHour * 60 + wakeMinute - (bedHour * 60 + bedMinute);
  if (minutes <= 0) minutes += 24 * 60;
  return minutes / 60;
};

export function SleepView({ data, onSave }) {
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ date: localISO(), bedtime: data.targetBedtime || "23:00", wakeTime: data.targetWakeTime || "07:00", quality: 3, restingHeartRate: "", note: "" });
  const filtered = useMemo(() => data.logs.slice().reverse().filter((log) => `${log.date} ${log.note || ""}`.toLowerCase().includes(query.toLowerCase())), [data.logs, query]);
  const average = data.logs.length ? data.logs.reduce((sum, log) => sum + durationHours(log.bedtime, log.wakeTime), 0) / data.logs.length : 0;

  return <div className="page"><header className="page-header"><div className="eyebrow">ÅTERHÄMTNING · RYTM</div><h1>Sömn</h1><p>Logga rytm, kvalitet och vilopuls. Samma uppvakningstid är floor-versionen.</p></header>
    <section className="sleep-summary"><article className="card"><span>SNITT</span><strong>{average ? average.toFixed(1) : "0"} h</strong><small>{data.logs.length} nätter</small></article><article className="card"><span>MÅLRYTM</span><strong>{data.targetBedtime || "—"}–{data.targetWakeTime || "—"}</strong><small>läggdags · uppvakning</small></article></section>
    <form className="card form-stack sleep-form" onSubmit={(event) => { event.preventDefault(); onSave({ id: `sleep-${crypto.randomUUID()}`, ...form, quality: Number(form.quality), restingHeartRate: form.restingHeartRate ? Number(form.restingHeartRate) : null, durationHours: durationHours(form.bedtime, form.wakeTime), createdAt: new Date().toISOString() }); setForm({ ...form, date: localISO(), restingHeartRate: "", note: "" }); }}><div className="field-grid"><label>Datum<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label><label>Kvalitet · 1–5<input type="number" min="1" max="5" value={form.quality} onChange={(event) => setForm({ ...form, quality: event.target.value })} /></label></div><div className="field-grid"><label>Somnade<input type="time" value={form.bedtime} onChange={(event) => setForm({ ...form, bedtime: event.target.value })} /></label><label>Vaknade<input type="time" value={form.wakeTime} onChange={(event) => setForm({ ...form, wakeTime: event.target.value })} /></label></div><label>Vilopuls · valfritt<input type="number" min="30" max="180" value={form.restingHeartRate} onChange={(event) => setForm({ ...form, restingHeartRate: event.target.value })} placeholder="bpm" /></label><label>Anteckning<input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Energi, uppvaknanden, skärmtid…" /></label><button className="primary-button"><Icon name="moon" size={16} /> Spara natt</button></form>
    <section className="section"><div className="section-title"><span>SÖMNHISTORIK</span><small>{filtered.length} poster</small></div><div className="search-field sleep-search"><Icon name="search" size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sök datum eller anteckning" /></div><div className="history-list">{filtered.map((log) => <article className="history-row" key={log.id}><Icon name="moon" size={17} /><div><strong>{log.bedtime}–{log.wakeTime} · {log.durationHours.toFixed(1)} h</strong><small>{log.date} · kvalitet {log.quality}/5{log.note ? ` · ${log.note}` : ""}</small></div>{log.restingHeartRate && <b className="mono">{log.restingHeartRate} bpm</b>}</article>)}</div></section>
  </div>;
}


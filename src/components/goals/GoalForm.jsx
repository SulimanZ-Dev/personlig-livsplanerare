import { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";

const emptyGoal = {
  name: "", moduleId: "personal", type: "number", startValue: 0, targetValue: 1,
  deadline: "", category: "", color: "#3ddc84", unit: "", checklistText: "",
};

export function GoalForm({ goal, onSave, onClose }) {
  const [form, setForm] = useState(emptyGoal);
  useEffect(() => {
    if (goal) setForm({ ...emptyGoal, ...goal, checklistText: (goal.checklistItems || []).map((item) => item.label).join("\n") });
  }, [goal]);
  const field = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    onSave({
      ...form,
      id: goal?.id || `goal-${crypto.randomUUID()}`,
      name: form.name.trim(),
      startValue: Number(form.startValue) || 0,
      targetValue: Number(form.targetValue) || 1,
      checklistItems: form.type === "checklist"
        ? form.checklistText.split("\n").filter(Boolean).map((label, index) => ({ id: goal?.checklistItems?.[index]?.id || `item-${crypto.randomUUID()}`, label, done: goal?.checklistItems?.[index]?.done || false }))
        : [],
      status: goal?.status || "active",
      createdAt: goal?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <Modal title={goal ? "Redigera mål" : "Skapa nytt mål"} onClose={onClose}>
      <form className="form-stack" onSubmit={submit}>
        <label>Namn<input value={form.name} onChange={field("name")} placeholder="Vad vill du uppnå?" autoFocus /></label>
        <div className="field-grid">
          <label>Typ<select value={form.type} onChange={field("type")}><option value="number">Siffra att nå</option><option value="checklist">Checklista</option><option value="streak">Streak</option></select></label>
          <label>Område<select value={form.moduleId} onChange={field("moduleId")}><option value="personal">Personligt</option><option value="economy">Ekonomi</option><option value="gym">Gym</option><option value="habits">Rutiner</option><option value="studies">Studier</option></select></label>
        </div>
        {form.type === "checklist" ? (
          <label>Delmål, ett per rad<textarea rows="4" value={form.checklistText} onChange={field("checklistText")} placeholder={"Första steget\nAndra steget"} /></label>
        ) : (
          <div className="field-grid">
            <label>Startvärde<input type="number" inputMode="decimal" value={form.startValue} onChange={field("startValue")} /></label>
            <label>Målvärde<input type="number" inputMode="decimal" value={form.targetValue} onChange={field("targetValue")} /></label>
          </div>
        )}
        <div className="field-grid">
          <label>Deadline<input type="date" value={form.deadline || ""} onChange={field("deadline")} /></label>
          <label>Enhet<input value={form.unit || ""} onChange={field("unit")} placeholder="kr, kg, h…" /></label>
        </div>
        <div className="field-grid">
          <label>Kategori<input value={form.category || ""} onChange={field("category")} placeholder="Valfri" /></label>
          <label>Färg<input type="color" value={form.color} onChange={field("color")} /></label>
        </div>
        <button className="primary-button" type="submit">Spara mål</button>
      </form>
    </Modal>
  );
}


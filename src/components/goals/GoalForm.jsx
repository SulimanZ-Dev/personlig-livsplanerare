import { useMemo, useState } from "react";
import { GOAL_TEMPLATES } from "../../core/storage/schema";
import { localISO } from "../../core/dates/dateUtils";
import { Icon } from "../ui/Icon";
import { Modal } from "../ui/Modal";

const emptyGoal = {
  templateId: "custom",
  name: "",
  moduleId: "personal",
  source: "manual",
  sourceId: "",
  type: "number",
  direction: "increase",
  startValue: 0,
  targetValue: 1,
  deadline: "",
  category: "Personligt",
  color: "#3ddc84",
  unit: "",
  checklistText: "",
  actionLabel: "",
};

const formFromGoal = (goal) => goal ? {
  ...emptyGoal,
  ...goal,
  templateId: "custom",
  checklistText: (goal.checklistItems || []).map((item) => item.label).join("\n"),
} : emptyGoal;

export function GoalForm({ goal, state, onSave, onClose }) {
  const [form, setForm] = useState(() => formFromGoal(goal));
  const [formError, setFormError] = useState("");
  const accounts = Object.values(state.modules.economy.accounts).filter((account) => !account.archived);

  const selectedTemplate = useMemo(
    () => GOAL_TEMPLATES.find((template) => template.id === form.templateId) || GOAL_TEMPLATES.at(-1),
    [form.templateId],
  );
  const field = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const chooseTemplate = (template) => {
    setForm((current) => ({
      ...current,
      templateId: template.id,
      moduleId: template.moduleId,
      source: template.source,
      type: template.type,
      direction: template.direction,
      unit: template.unit,
      color: template.color,
      category: template.label,
      name: current.name || (template.id === "custom" ? "" : template.label),
    }));
  };

  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setFormError("Ge målet ett namn.");
      return;
    }
    const startValue = Number(form.startValue) || 0;
    const targetValue = Number(form.targetValue) || 0;
    if (form.type === "number" && form.source === "manual") {
      const invalidIncrease = form.direction === "increase" && targetValue <= startValue;
      const invalidDecrease = form.direction === "decrease" && targetValue >= startValue;
      if (invalidIncrease || invalidDecrease) {
        setFormError(form.direction === "increase"
          ? "För ett ökningsmål måste målvärdet vara högre än startvärdet."
          : "För ett minskningsmål måste målvärdet vara lägre än startvärdet.");
        return;
      }
    }
    setFormError("");
    onSave({
      ...form,
      id: goal?.id || `goal-${crypto.randomUUID()}`,
      name: form.name.trim(),
      startValue,
      targetValue,
      checklistItems: form.type === "checklist"
        ? form.checklistText.split("\n").map((label) => label.trim()).filter(Boolean).map((label, index) => ({
          id: goal?.checklistItems?.[index]?.id || `item-${crypto.randomUUID()}`,
          label,
          done: goal?.checklistItems?.[index]?.done || false,
        }))
        : [],
      status: goal?.status || "active",
      startDate: goal?.startDate || localISO(),
      createdAt: goal?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      achievedAt: goal?.achievedAt || null,
    });
    onClose();
  };

  return (
    <Modal title={goal ? "Redigera mål" : "Skapa ett mål"} onClose={onClose}>
      <form className="form-stack goal-form" onSubmit={submit}>
        {!goal && (
          <div className="template-strip" aria-label="Målmallar">
            {GOAL_TEMPLATES.map((template) => (
              <button type="button" key={template.id} className={form.templateId === template.id ? "active" : ""} onClick={() => chooseTemplate(template)}>
                <Icon name={template.icon} size={17} />
                <span>{template.label}</span>
              </button>
            ))}
          </div>
        )}

        <label>Målets namn<input value={form.name} onChange={field("name")} placeholder="T.ex. Väg 80 kg" autoFocus /></label>

        <div className="field-grid">
          <label>Typ
            <select value={form.type} onChange={field("type")}>
              <option value="number">Mätbart värde</option>
              <option value="checklist">Projekt/checklista</option>
              <option value="streak">Streak</option>
            </select>
          </label>
          <label>Område
            <select value={form.moduleId} onChange={field("moduleId")}>
              <option value="personal">Personligt</option>
              <option value="economy">Ekonomi</option>
              <option value="gym">Gym</option>
              <option value="habits">Rutiner</option>
              <option value="studies">Studier</option>
            </select>
          </label>
        </div>

        {form.type === "number" && (
          <>
            <div className="field-grid">
              <label>Riktning
                <select value={form.direction} onChange={field("direction")}>
                  <option value="increase">Öka till målet</option>
                  <option value="decrease">Minska till målet</option>
                </select>
              </label>
              <label>Datakälla
                <select value={form.source} onChange={field("source")}>
                  <option value="manual">Jag loggar värdet</option>
                  <option value="economy_total">Totalt sparande</option>
                  <option value="economy_account">Ett ekonomiskt konto</option>
                  <option value="study_weekly">Studietid denna vecka</option>
                </select>
              </label>
            </div>
            {form.source === "economy_account" && (
              <label>Konto<select value={form.sourceId} onChange={field("sourceId")} required><option value="">Välj konto</option>{accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}</select></label>
            )}
            <div className="field-grid three">
              <label>Start<input type="number" inputMode="decimal" value={form.startValue} onChange={field("startValue")} disabled={form.source !== "manual"} /></label>
              <label>Mål<input type="number" inputMode="decimal" value={form.targetValue} onChange={field("targetValue")} required /></label>
              <label>Enhet<input value={form.unit} onChange={field("unit")} placeholder="kg, kr…" /></label>
            </div>
          </>
        )}

        {form.type === "checklist" && <label>Delmål, ett per rad<textarea rows="5" value={form.checklistText} onChange={field("checklistText")} placeholder={"Planera\nGenomföra\nUtvärdera"} required /></label>}

        {form.type === "streak" && <div className="field-grid"><label>Mål i dagar<input type="number" min="1" value={form.targetValue} onChange={field("targetValue")} /></label><label>Enhet<input value={form.unit} onChange={field("unit")} /></label></div>}

        <div className="field-grid">
          <label>Deadline<input type="date" min={localISO()} value={form.deadline || ""} onChange={field("deadline")} /></label>
          <label>Kategori<input value={form.category || selectedTemplate.label} onChange={field("category")} /></label>
        </div>
        <label>Din konkreta handling<input value={form.actionLabel} onChange={field("actionLabel")} placeholder="Valfritt, t.ex. väg mig varje söndag" /></label>
        <div className="color-row"><span>Accent</span>{["#3ddc84", "#5eb1ff", "#a78bfa", "#f0b429", "#f0704a", "#f472b6"].map((color) => <button type="button" aria-label={`Välj färg ${color}`} className={form.color === color ? "active" : ""} style={{ background: color }} key={color} onClick={() => setForm({ ...form, color })} />)}</div>
        {formError && <div className="form-error" role="alert">{formError}</div>}
        <button className="primary-button" type="submit">{goal ? "Spara ändringar" : "Skapa mål"}</button>
      </form>
    </Modal>
  );
}

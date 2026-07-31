import { useState } from "react";
import { getGoalProgress } from "../../core/goals/goalEngine";
import { Modal } from "../ui/Modal";

export function QuickGoalUpdate({ state, goal, onSave, onClose }) {
  const progress = getGoalProgress(state, goal);
  const [value, setValue] = useState(String(progress.value));
  const [note, setNote] = useState("");
  return (
    <Modal title={`Logga · ${goal.name}`} onClose={onClose}>
      <form className="form-stack quick-update-form" onSubmit={(event) => {
        event.preventDefault();
        const parsed = Number(String(value).replace(",", "."));
        if (Number.isNaN(parsed)) return;
        onSave(goal, parsed, note.trim());
        onClose();
      }}>
        <div className="current-measure"><span>Nuvarande</span><strong>{progress.value.toLocaleString("sv-SE", { maximumFractionDigits: 2 })} <small>{goal.unit}</small></strong></div>
        <label>Nytt värde<input type="number" inputMode="decimal" step="any" value={value} onChange={(event) => setValue(event.target.value)} autoFocus /></label>
        <label>Anteckning<input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Vad förändrades?" /></label>
        <button className="primary-button">Spara progress</button>
      </form>
    </Modal>
  );
}

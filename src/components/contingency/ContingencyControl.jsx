import { useState } from "react";
import { Icon } from "../ui/Icon";
import { Modal } from "../ui/Modal";
import { localISO } from "../../core/dates/dateUtils";

export function ContingencyControl({ state, onActivate, onDeactivate }) {
  const [open, setOpen] = useState(false);
  const active = state.today?.contingency?.date === localISO() ? state.today.contingency : null;

  if (active) {
    return <aside className="card contingency-active"><span><Icon name="shield" /></span><div><strong>Floor-läge · {active.label}</strong><small>Idag räknas som contingency, inte som en vanlig miss.</small></div><button onClick={onDeactivate}>Avsluta</button></aside>;
  }

  return <>
    <button className="contingency-trigger" onClick={() => setOpen(true)}><Icon name="shield" size={16} /><span>Behöver du en minimum-dag?</span></button>
    {open && <Modal title="Aktivera contingency-läge" onClose={() => setOpen(false)}>
      <div className="contingency-sheet"><p>Systemet byter dagens plan till floor-versioner. Dagen sparas separat och räknas inte som en normal miss.</p><div className="contingency-options">{state.contingency.definitions.map((definition) => <button className="card" key={definition.id} onClick={() => { onActivate(definition); setOpen(false); }}><span><Icon name="shield" size={18} /></span><div><strong>{definition.label}</strong><small>{definition.detail}</small></div></button>)}</div></div>
    </Modal>}
  </>;
}


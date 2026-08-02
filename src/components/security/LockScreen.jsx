import { useState } from "react";
import { Icon } from "../ui/Icon";
import { verifyLocalPin } from "../../core/security/localLock";

export function LockScreen({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    if (await verifyLocalPin(pin)) onUnlock();
    else { setError("Fel PIN-kod."); setPin(""); }
  };
  return <div className="lock-screen"><form className="card" onSubmit={submit}><span className="lock-icon"><Icon name="shield" size={28} /></span><div className="eyebrow">LOKALT LÅS</div><h1>Livssystem är låst</h1><p>Din PIN lämnar aldrig den här enheten.</p><input autoFocus type="password" inputMode="numeric" pattern="[0-9]*" minLength="4" maxLength="12" value={pin} onChange={(event) => setPin(event.target.value)} placeholder="PIN-kod" />{error && <div className="form-error">{error}</div>}<button className="primary-button">Lås upp</button></form></div>;
}

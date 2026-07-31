import { useState } from "react";
import { Icon } from "../ui/Icon";

const steps = [
  { icon: "pulse", eyebrow: "ETT SYSTEM · HELA LIVET", title: "Välkommen till Livssystem", text: "Mål, ekonomi, träning, studier, rutiner och nutrition använder samma enkla loop: mål → handling → progress → review." },
  { icon: "home", eyebrow: "DIN HYBRID-DASHBOARD", title: "Allt viktigt på en skärm", text: "Hem visar dagens viktigaste handlingar och levande widgets från de områden du faktiskt använder. Du bestämmer ordningen." },
  { icon: "target", eyebrow: "BÖRJA MED ETT LÖFTE", title: "Skapa ditt första mål", text: "Välj ett mätbart värde, en checklista eller streak. Livssystem räknar trend, deadline, risk och nästa konkreta steg." },
  { icon: "plus", eyebrow: "FÅNGA VERKLIGHETEN", title: "Logga snabbt, justera smart", text: "Den gröna Logga-knappen i navigationen leder direkt till transaktion, gympass, deep work, vana eller nutrition. Du kan ångra senaste loggningen." },
];

export function OnboardingFlow({ onFinish }) {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const last = index === steps.length - 1;
  return <div className="onboarding-backdrop" role="dialog" aria-modal="true" aria-labelledby="onboarding-title"><section className="onboarding-card card"><div className="onboarding-top"><span className="onboarding-mark"><Icon name={step.icon} size={26} /></span><button className="text-button" onClick={() => onFinish("dashboard")}>Hoppa över</button></div><div className="onboarding-copy"><div className="eyebrow">{step.eyebrow}</div><h1 id="onboarding-title">{step.title}</h1><p>{step.text}</p></div><div className="onboarding-dots">{steps.map((_, dot) => <i className={dot === index ? "active" : ""} key={dot} />)}</div><div className="onboarding-actions">{index > 0 && <button className="secondary-button" onClick={() => setIndex(index - 1)}>Tillbaka</button>}<button className="primary-button" onClick={() => last ? onFinish("goals") : setIndex(index + 1)}>{last ? "Skapa mitt första mål" : "Nästa"} <span>→</span></button></div></section></div>;
}

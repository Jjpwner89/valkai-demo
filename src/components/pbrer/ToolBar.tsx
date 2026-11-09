import { Icon } from "../icons";

const STEPS = ["Inputs", "Run", "Review"];

export default function ToolBar({ step, onBack }: { step: number; onBack: () => void }) {
  return (
    <header className="tbar">
      <button className="t-back" onClick={onBack}>
        <Icon name="left" size={16} />
        <span>Tools</span>
      </button>
      <div className="t-title">PBRER drafting</div>
      <div className="steps">
        {STEPS.map((s, i) => (
          <div key={s} className="steps-item">
            <div className={`st${i === step ? " cur" : i < step ? " done" : ""}`}>
              <span className="st-dot">{i < step ? <Icon name="check" size={12} weight={3} /> : i + 1}</span>
              {s}
            </div>
            {i < STEPS.length - 1 && <span className="st-line" />}
          </div>
        ))}
      </div>
    </header>
  );
}

"use client";

import { useApiKey } from "@/lib/apiKey";
import { Icon, type IconName } from "./icons";
import { Logos } from "./Logos";

export type View = "chat" | "tools" | "pbrer";

const NAV: { view: View; label: string; icon: IconName }[] = [
  { view: "chat", label: "Chat", icon: "chat" },
  { view: "tools", label: "Tools", icon: "hammer" },
];

export default function Sidebar({ view, onNavigate }: { view: View; onNavigate: (v: View) => void }) {
  const { client } = useApiKey();
  // The PBRER tool lives under Tools, so keep Tools highlighted while it's open.
  const active = view === "pbrer" ? "tools" : view;

  return (
    <aside className="side">
      <nav className="nav">
        {NAV.map((item) => (
          <button
            key={item.view}
            className={`nav-item${item.view === active ? " on" : ""}`}
            onClick={() => onNavigate(item.view)}
            aria-current={item.view === active ? "page" : undefined}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="side-foot">
        {client && (
          <div className="key-chip">
            <i />
            API key active
          </div>
        )}
        <div className="demo-note">Demo · fictional data only</div>
        <Logos />
      </div>
    </aside>
  );
}

"use client";

import { useRef, useState } from "react";
import { Icon, type IconName } from "./icons";

const TOOLS: { id: string; name: string; description: string; icon: IconName; live: boolean }[] = [
  { id: "pbrer", name: "PBRER drafting", description: "Draft Sections 1–4 from this period's data and the prior report.", icon: "file", live: true },
  { id: "signal", name: "Signal review", description: "Summarize a safety signal across cases and literature.", icon: "pulse", live: false },
  { id: "narratives", name: "Case narratives", description: "Draft serious-case narratives from source records.", icon: "users", live: false },
  { id: "rmp", name: "RMP update", description: "Update risk management plan sections.", icon: "shield", live: false },
  { id: "literature", name: "Literature screening", description: "Screen new publications for safety-relevant findings.", icon: "book", live: false },
  { id: "dsur", name: "DSUR drafting", description: "Draft development safety update report sections.", icon: "flask", live: false },
];

const EXPAND_MS = 380;

type Rect = { top: number; left: number; width: number; height: number };

// Opening a card grows it from where it sits to fill the workspace, then hands off to the tool.
export default function Tools({ onOpen }: { onOpen: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [from, setFrom] = useState<Rect | null>(null);
  const [expanded, setExpanded] = useState(false);

  function open(card: HTMLButtonElement) {
    const root = rootRef.current;
    if (!root || from) return;
    const outer = root.getBoundingClientRect();
    const r = card.getBoundingClientRect();
    setFrom({ top: r.top - outer.top, left: r.left - outer.left, width: r.width, height: r.height });
    requestAnimationFrame(() => requestAnimationFrame(() => setExpanded(true)));
    window.setTimeout(onOpen, EXPAND_MS);
  }

  return (
    <div className="tools" ref={rootRef}>
      <h1 className="pg">Tools</h1>
      <p className="pg-sub">Choose a workflow to get started.</p>
      <div className="grid">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            className={`tcard${t.live ? "" : " off"}`}
            disabled={!t.live}
            onClick={(e) => open(e.currentTarget)}
          >
            <div className="tc-top">
              <span className="tc-ic">
                <Icon name={t.icon} size={20} />
              </span>
              {t.live && <span className="tag live">Ready</span>}
            </div>
            <h4>{t.name}</h4>
            <p>{t.description}</p>
          </button>
        ))}
      </div>
      {from && (
        <div
          className={`expander${expanded ? " full" : ""}`}
          style={expanded ? undefined : { top: from.top, left: from.left, width: from.width, height: from.height }}
        />
      )}
    </div>
  );
}

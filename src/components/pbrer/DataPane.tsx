"use client";

import { useState } from "react";
import type { DataPoint } from "@/lib/review";
import { Icon } from "../icons";

export type Mark = "ok" | "flag";
export type Edit = { from: string; to: string; note: string; applied: boolean };

export const pointKey = (p: DataPoint) => `${p.group}::${p.name}`;

type Props = {
  points: DataPoint[];
  marks: Record<string, Mark>;
  edits: Record<string, Edit>;
  editing: string | null;
  selected: string | null;
  onMark: (key: string, mark: Mark) => void;
  onOpenSource: (key: string) => void;
  onSaveEdit: (key: string, to: string, note: string) => void;
  onCancelEdit: () => void;
};

export default function DataPane(props: Props) {
  const groups: { name: string; points: DataPoint[] }[] = [];
  for (const p of props.points) {
    const g = groups.find((x) => x.name === p.group);
    if (g) g.points.push(p);
    else groups.push({ name: p.group, points: [p] });
  }

  return (
    <div className="pane-scroll">
      {groups.map((g) => (
        <div key={g.name}>
          <div className="dg">{g.name}</div>
          {g.points.map((p) => (
            <Row key={pointKey(p)} point={p} {...props} />
          ))}
        </div>
      ))}
    </div>
  );
}

function Row({ point, marks, edits, editing, selected, onMark, onOpenSource, onSaveEdit, onCancelEdit }: Props & { point: DataPoint }) {
  const key = pointKey(point);
  const mark = marks[key];
  const edit = edits[key];
  const changed = point.prior !== null && point.prior !== point.current;
  const cls = ["dr", changed && "chg", mark, selected === key && "sel"].filter(Boolean).join(" ");

  return (
    <div className={cls}>
      <div className="dr-main">
        <button className="dr-open" onClick={() => onOpenSource(key)} title="Show the source">
          <span className="dr-n">
            {point.name}
            <span className="src">{point.source_file ? shortName(point.source_file) : "Derived"}</span>
          </span>
          {edit ? (
            <span className="dr-v">
              <span className="new">{edit.to}</span>
              {/* An edit whose phrase isn't in the draft is still logged, just not applied. */}
              <span className="edited">{edit.applied ? "Edited" : "Noted, not found in draft"}</span>
            </span>
          ) : (
            <span className="dr-v">
              {point.prior !== null && (
                <>
                  <span className="old">{point.prior}</span>
                  <span className="arrow">→</span>
                </>
              )}
              <span className="new">{point.current}</span>
            </span>
          )}
        </button>
        {editing === key && <EditBox point={point} edit={edit} onSave={(to, note) => onSaveEdit(key, to, note)} onCancel={onCancelEdit} />}
      </div>
      <div className="dr-marks">
        <button className={`mk ok${mark === "ok" ? " on" : ""}`} aria-label={`Mark ${point.name} correct`} aria-pressed={mark === "ok"} onClick={() => onMark(key, "ok")}>
          <Icon name="check" size={13} weight={2.5} />
        </button>
        <button className={`mk fl${mark === "flag" ? " on" : ""}`} aria-label={`Flag ${point.name}`} aria-pressed={mark === "flag"} onClick={() => onMark(key, "flag")}>
          <Icon name="flag" size={12} weight={2} />
        </button>
      </div>
    </div>
  );
}

function EditBox({ point, edit, onSave, onCancel }: { point: DataPoint; edit?: Edit; onSave: (to: string, note: string) => void; onCancel: () => void }) {
  const [to, setTo] = useState(edit?.to ?? point.in_draft ?? point.current);
  const [note, setNote] = useState(edit?.note ?? "");
  return (
    <div className="pe">
      <textarea className="pe-box" value={to} onChange={(e) => setTo(e.target.value)} rows={3} autoFocus aria-label="Corrected text" />
      <label className="why">
        <span>What was wrong?</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <div className="edit-act">
        <button className="mini-run" onClick={() => onSave(to.trim(), note.trim())} disabled={!to.trim()}>
          Save edit
        </button>
        <button className="mini-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function shortName(file: string) {
  const m = file.match(/^(\d{2})_/);
  return m ? m[1] : file.length > 16 ? file.slice(0, 14) + "…" : file;
}

"use client";

import { useRef, useState } from "react";
import { REQUIRED_ROLES, ROLES, type Role } from "@/lib/intake";
import { Icon } from "../icons";

export type Intake = {
  id: string;
  file: File;
  hash: string | null;
  status: "reading" | "ready" | "error";
  role: Role | "other" | null;
};

export type Sorted = {
  used: Intake[];
  reading: Intake[];
  flagged: { item: Intake; reason: string }[];
  missing: Role[];
};

// Decide which uploads go into the run. The first file for each input is
// used; repeats, exact copies, unrelated files and unreadable files are set
// aside for the reviewer to clear.
export function sortIntake(items: Intake[]): Sorted {
  const used: Intake[] = [];
  const reading: Intake[] = [];
  const flagged: Sorted["flagged"] = [];
  const byHash = new Map<string, Intake>();
  const byRole = new Map<Role, Intake>();

  for (const item of items) {
    const copyOf = item.hash ? byHash.get(item.hash) : undefined;
    if (item.hash && !copyOf) byHash.set(item.hash, item);

    if (copyOf) flagged.push({ item, reason: `Same file as ${copyOf.file.name}` });
    else if (item.status === "reading") reading.push(item);
    else if (item.status === "error") flagged.push({ item, reason: "Couldn't be read" });
    else if (item.role === "other" || !item.role) flagged.push({ item, reason: "Not a PBRER input" });
    else if (byRole.has(item.role)) flagged.push({ item, reason: `Another ${ROLES[item.role].toLowerCase()} file` });
    else {
      byRole.set(item.role, item);
      used.push(item);
    }
  }
  const missing = REQUIRED_ROLES.filter((r) => !byRole.has(r));
  return { used, reading, flagged, missing };
}

type Props = {
  items: Intake[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  onRun: () => void;
};

export default function Inputs({ items, onAdd, onRemove, onRun }: Props) {
  const picker = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const { used, reading, flagged, missing } = sortIntake(items);
  const usedRoles = new Set(used.map((u) => u.role));
  const canRun = used.length > 0 && reading.length === 0;

  return (
    <div className="inputs">
      <div className="in-main">
        <h2 className="b-h gap">Upload this period&apos;s data</h2>
        <button
          className={`dropzone${dragging ? " over" : ""}`}
          onClick={() => picker.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            onAdd(Array.from(e.dataTransfer.files));
          }}
        >
          <Icon name="up" size={20} />
          <span>
            Drop all the files for this report, or <u>browse</u>
          </span>
        </button>
        <input
          ref={picker}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            onAdd(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />

        {(used.length > 0 || reading.length > 0) && (
          <div className="ups">
            {[...used, ...reading].map((item) => (
              <div className="up" key={item.id}>
                <div className="up-lab">
                  <Icon name="file" size={15} />
                  {item.file.name}
                  <em>{formatSize(item.file.size)}</em>
                </div>
                <div className="up-role">{item.status === "reading" ? "Reading…" : ROLES[item.role as Role]}</div>
                <div className="up-st">
                  {item.status === "reading" ? (
                    <span className="spin" />
                  ) : (
                    <span className="st-ok">
                      <Icon name="check" size={13} weight={3} />
                    </span>
                  )}
                  <button className="up-x" aria-label={`Remove ${item.file.name}`} onClick={() => onRemove(item.id)}>
                    <Icon name="x" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <aside className="in-side">
        <div className="panel">
          <div className="p-h">Required inputs</div>
          {REQUIRED_ROLES.map((role) => (
            <div className={`req${usedRoles.has(role) ? " ok" : ""}`} key={role}>
              {usedRoles.has(role) ? <Icon name="check" size={13} weight={3} /> : <span className="req-dot" />}
              {ROLES[role]}
            </div>
          ))}
          {usedRoles.has("brief") && (
            <div className="req ok">
              <Icon name="check" size={13} weight={3} />
              {ROLES.brief}
            </div>
          )}
        </div>

        {flagged.length > 0 && (
          <div className="panel attention">
            <div className="p-h">Left out of the run</div>
            {flagged.map(({ item, reason }) => (
              <div className="att" key={item.id}>
                <div>
                  <b>{item.file.name}</b>
                  <span>{reason}</span>
                </div>
                <button className="up-x" aria-label={`Remove ${item.file.name}`} onClick={() => onRemove(item.id)}>
                  <Icon name="x" size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button className="run" disabled={!canRun} onClick={onRun}>
          {missing.length && canRun ? "Run anyway" : "Run draft"}
          <Icon name="up" size={15} weight={2.5} />
        </button>
        {canRun && missing.length > 0 && <p className="run-note">Missing inputs will be marked DATA MISSING in the draft.</p>}

        <div className="pre-row">
          <Icon name="file" size={14} />
          Template and drafting skill are built in
        </div>
      </aside>
    </div>
  );
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

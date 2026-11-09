"use client";

import { useState } from "react";
import { Icon } from "./icons";

const SLOTS = [
  "Drafting brief",
  "Product and admin facts",
  "MA status and regulatory",
  "Sales and exposure",
  "Reference safety information",
  "Case data",
  "Prior PBRER",
];

const STEPS = ["Inputs", "Run", "Review"];

// Phase 1: the inputs screen with real file picking. The match check, the run
// and review come next.
export default function PbrerTool({ onBack }: { onBack: () => void }) {
  const [files, setFiles] = useState<Record<number, File>>({});
  const ready = SLOTS.every((_, i) => files[i]);

  return (
    <>
      <header className="tbar">
        <button className="t-back" onClick={onBack}>
          <Icon name="left" size={16} />
          <span>Tools</span>
        </button>
        <div className="t-title">PBRER drafting</div>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div key={s} className="steps-item">
              <div className={`st${i === 0 ? " cur" : ""}`}>
                <span className="st-dot">{i + 1}</span>
                {s}
              </div>
              {i < STEPS.length - 1 && <span className="st-line" />}
            </div>
          ))}
        </div>
      </header>
      <div className="body two">
        <div className="col-main">
          <h2 className="b-h gap">Upload this period&apos;s data</h2>
          <div className="ups">
            {SLOTS.map((label, i) => {
              const file = files[i];
              return (
                <label key={label} className={`up${file ? "" : " miss"}`}>
                  <div className="up-lab">
                    <span className="up-n">{i + 1}</span>
                    {label}
                  </div>
                  <div className={`up-file${file ? "" : " drop"}`}>
                    <Icon name={file ? "file" : "up"} size={15} />
                    {file ? (
                      <>
                        {file.name}
                        <em>{formatSize(file.size)}</em>
                      </>
                    ) : (
                      <>
                        Choose a file or <u>browse</u>
                      </>
                    )}
                  </div>
                  <div className="up-st">
                    {file && (
                      <span className="st-ok">
                        <Icon name="check" size={13} weight={3} />
                      </span>
                    )}
                  </div>
                  <input
                    type="file"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setFiles((prev) => ({ ...prev, [i]: f }));
                    }}
                  />
                </label>
              );
            })}
          </div>
        </div>
        <div className="col-side">
          <div className="panel">
            <div className="p-h">Preloaded</div>
            <div className="pre">
              <Icon name="file" size={15} />
              <div>
                <b>PBRER section template</b>
                <span>Sections 1–4, built in</span>
              </div>
            </div>
            <div className="pre">
              <Icon name="file" size={15} />
              <div>
                <b>Drafting skill</b>
                <span>pbrer-section-draft</span>
              </div>
            </div>
          </div>
          <button className="run" disabled={!ready}>
            Run draft
            <Icon name="up" size={15} weight={2.5} />
          </button>
        </div>
      </div>
    </>
  );
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

"use client";

import { useState } from "react";
import { STAGES, type Progress, type ReportDetails } from "@/lib/pbrerRun";
import { Icon } from "../icons";

export default function Running({ details, progress }: { details: ReportDetails | null; progress: Progress }) {
  const [open, setOpen] = useState(false);
  const title = details?.report_number ? `Drafting PBRER No. ${details.report_number}` : "Drafting the PBRER";
  const sub = [details?.product, details?.interval].filter(Boolean).join(" · ");
  const label = STAGES[progress.stage];

  return (
    <div className="run-col">
      <h2 className="b-h">{title}</h2>
      <p className="b-sub">{sub || " "}</p>
      <div className="work">
        <button className={`w-head${open ? " open" : ""}`} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {!open && <span className="spin" />}
          <span>{open ? "Working on your report" : label}</span>
          <Icon name="down" size={16} />
        </button>
        {open ? (
          <div className="w-list">
            {STAGES.slice(0, progress.stage).map((s) => (
              <div className="w-done" key={s}>
                <Icon name="check" size={14} weight={2.5} />
                {s}
              </div>
            ))}
            <div className="w-now">
              <span className="spin" />
              <div>
                <b>{label}</b>
                <p className="hl" key={progress.detail}>
                  {progress.detail}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="w-stream hl" key={progress.detail}>
            {progress.detail}
          </p>
        )}
      </div>
    </div>
  );
}

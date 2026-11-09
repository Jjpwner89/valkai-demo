"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CleanDoc, RedlineDoc, parseBlocks, stripBold, type Mark as DocMark } from "@/lib/draftView";
import type { RunInput, RunResult } from "@/lib/pbrerRun";
import type { ReviewData } from "@/lib/review";
import { Icon } from "../icons";
import DataPane, { pointKey, type Edit, type Mark } from "./DataPane";
import SourcePanel from "./SourcePanel";

type DocView = "redline" | "clean" | "sheet" | "summary";
type PaneTab = "data" | "caveats" | "checks";

type Props = {
  result: RunResult;
  review: ReviewData | null;
  reviewFailed: boolean;
  inputs: RunInput[];
  onRetryReview: () => void;
  onStartOver: () => void;
};

export default function Review({ result, review, reviewFailed, inputs, onRetryReview, onStartOver }: Props) {
  const priorFile = inputs.find((i) => i.role === "prior")?.file ?? null;
  const priorIsText = !!priorFile && !priorFile.name.toLowerCase().endsWith(".pdf");
  const [prior, setPrior] = useState<string | null>(null);
  const [draft, setDraft] = useState(result.draft);
  const [view, setView] = useState<DocView>(priorIsText ? "redline" : "clean");
  const [tab, setTab] = useState<PaneTab>("data");
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const docRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priorFile && priorIsText) void priorFile.text().then(setPrior);
  }, [priorFile, priorIsText]);

  const points = useMemo(() => review?.data_points ?? [], [review]);
  const byKey = useMemo(() => new Map(points.map((p) => [pointKey(p), p])), [points]);
  const active = editing ?? source;

  // The phrase a value currently has in the draft: the reviewer's edit if there is one.
  const phraseFor = (key: string) => edits[key]?.to ?? byKey.get(key)?.in_draft ?? null;

  const docMarks: DocMark[] = [];
  for (const [key, e] of Object.entries(edits)) if (e.applied && key !== active) docMarks.push({ phrase: e.to, className: "edited-mark" });
  const activePhrase = active ? phraseFor(active) : null;
  if (activePhrase) docMarks.unshift({ phrase: activePhrase, className: "linked", id: "active" });

  useEffect(() => {
    docRef.current?.querySelector('[data-mark="active"]')?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [active, view]);

  function mark(key: string, m: Mark) {
    const next = marks[key] === m ? undefined : m;
    setMarks((prev) => {
      const copy = { ...prev };
      if (next) copy[key] = next;
      else delete copy[key];
      return copy;
    });
    if (next === "flag") {
      setEditing(key);
      setSource(null);
      if (view !== "clean") setView("clean");
    } else if (editing === key) setEditing(null);
  }

  function saveEdit(key: string, to: string, note: string) {
    const point = byKey.get(key);
    const phrase = phraseFor(key);
    const applied = !!phrase && draft.includes(phrase);
    if (applied) setDraft((d) => d.split(phrase).join(to));
    setEdits((prev) => ({ ...prev, [key]: { from: point?.in_draft ?? point?.current ?? "", to, note, applied } }));
    setEditing(null);
  }

  function draftContext(key: string) {
    const phrase = phraseFor(key);
    if (!phrase) return null;
    const block = parseBlocks(draft).find((b) => stripBold(b.text).includes(stripBold(phrase)));
    return block ? stripBold(block.text) : null;
  }

  function download(text: string, name: string) {
    const url = URL.createObjectURL(new Blob([text], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  const checked = Object.keys(marks).length;
  const flagged = Object.values(marks).filter((m) => m === "flag").length;
  const caveats = review?.caveats ?? [];
  const checks = review?.checks ?? [];
  const sourcePoint = source ? byKey.get(source) : undefined;
  const sourceFile = sourcePoint?.source_file ? (inputs.find((i) => i.file.name === sourcePoint.source_file)?.file ?? null) : null;

  const VIEWS: { key: DocView; label: string; show: boolean }[] = [
    { key: "redline", label: "Redline", show: priorIsText },
    { key: "clean", label: "Clean", show: true },
    { key: "sheet", label: "Data sheet", show: true },
    { key: "summary", label: "Run summary", show: !!result.summary },
  ];

  return (
    <div className="result">
      <div className="rev-top">
        <div className="seg">
          {VIEWS.filter((v) => v.show).map((v) => (
            <button key={v.key} className={v.key === view ? "on" : ""} onClick={() => setView(v.key)}>
              {v.label}
            </button>
          ))}
        </div>
        {view === "redline" && priorFile && (
          <div className="cmp">
            Compared to <b>{priorFile.name}</b>
          </div>
        )}
        {view === "redline" && (
          <div className="legend">
            <del>Removed</del>
            <ins>Added</ins>
          </div>
        )}
        {points.length > 0 && (
          <div className="prog">
            <b>
              {checked} of {points.length} values checked
            </b>
            {flagged > 0 && ` · ${flagged} flagged`}
          </div>
        )}
        <div className="spacer" />
        <button className="ghost-btn" onClick={onStartOver}>
          New run
        </button>
        <button className="ghost-btn" onClick={() => download(draft, `${result.name}.md`)}>
          <Icon name="up" size={14} />
          Export
        </button>
      </div>

      <div className="rev">
        <div className="doc-wrap" ref={docRef}>
          {view === "redline" && prior !== null && <RedlineDoc draft={draft} prior={prior} />}
          {view === "clean" && <CleanDoc md={draft} marks={docMarks} />}
          {view === "sheet" && (
            <article className="doc sheet">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.consolidated}</ReactMarkdown>
            </article>
          )}
          {view === "summary" && (
            <article className="doc sheet">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.summary}</ReactMarkdown>
            </article>
          )}
        </div>

        <aside className="pane">
          <div className="pane-h">Data review</div>
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === "data"} className={`tab${tab === "data" ? " on" : ""}`} onClick={() => setTab("data")}>
              Data
            </button>
            <button role="tab" aria-selected={tab === "caveats"} className={`tab${tab === "caveats" ? " on" : ""}`} onClick={() => setTab("caveats")}>
              Caveats {caveats.length}
            </button>
            <button role="tab" aria-selected={tab === "checks"} className={`tab${tab === "checks" ? " on" : ""}`} onClick={() => setTab("checks")}>
              Checks {checks.filter((c) => c.passed).length}/{checks.length}
            </button>
          </div>

          {!review ? (
            <div className="pane-empty">
              {reviewFailed ? (
                <>
                  <p>The review data didn&apos;t load.</p>
                  <button className="mini-run" onClick={onRetryReview}>
                    Try again
                  </button>
                </>
              ) : (
                <p>
                  <span className="spin" /> Matching values to their sources
                </p>
              )}
            </div>
          ) : tab === "data" ? (
            <DataPane
              points={points}
              marks={marks}
              edits={edits}
              editing={editing}
              selected={source}
              onMark={mark}
              onOpenSource={(key) => {
                setEditing(null);
                setSource((s) => (s === key ? null : key));
              }}
              onSaveEdit={saveEdit}
              onCancelEdit={() => setEditing(null)}
            />
          ) : tab === "caveats" ? (
            <div className="pane-scroll">
              {caveats.map((c) => (
                <div className="cv" key={c.id}>
                  <div className="cv-top">
                    <b>{c.id}</b>
                    <span className={`cv-tag ${c.needs_review ? "need" : "ok"}`}>{c.needs_review ? "Needs review" : "Handled"}</span>
                  </div>
                  <p>{c.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="pane-scroll">
              {checks.map((c) => (
                <div className={`chk${c.passed ? " ok" : " fail"}`} key={c.id}>
                  <span className="chk-dot">{c.passed ? <Icon name="check" size={11} weight={3} /> : <Icon name="x" size={11} weight={3} />}</span>
                  <b>{c.id}</b>
                  {c.name}
                </div>
              ))}
            </div>
          )}
        </aside>

        {sourcePoint && <SourcePanel point={sourcePoint} file={sourceFile} draftContext={draftContext(source!)} onClose={() => setSource(null)} />}
      </div>
    </div>
  );
}

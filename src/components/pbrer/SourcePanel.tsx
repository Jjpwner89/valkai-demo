"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { DataPoint } from "@/lib/review";
import { Icon } from "../icons";

const norm = (s: string) =>
  s
    .replace(/[|*_`]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

// The real source file behind a value, with the lines it came from highlighted.
export default function SourcePanel({ point, file, draftContext, onClose }: { point: DataPoint; file: File | null; draftContext: string | null; onClose: () => void }) {
  const [text, setText] = useState<string | null>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const isPdf = !!file && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));

  useEffect(() => {
    let live = true;
    if (file && !isPdf) void file.text().then((t) => live && setText(t));
    return () => {
      live = false;
    };
  }, [file, isPdf]);

  useEffect(() => {
    const root = docRef.current;
    if (!root || text === null) return;
    const wanted = point.source_lines.map(norm).filter(Boolean);
    let first: Element | null = null;
    root.querySelectorAll("tr, p, li, h1, h2, h3, h4, blockquote").forEach((el) => {
      // Table cells have no whitespace between them in textContent, so join them explicitly.
      const content = el.tagName === "TR" ? Array.from(el.children, (c) => c.textContent ?? "").join(" ") : (el.textContent ?? "");
      const have = norm(content);
      const hit = have && wanted.some((w) => have === w || (have.length > 12 && (w.includes(have) || have.includes(w))));
      el.classList.toggle("hit", !!hit);
      if (hit && !first) first = el;
    });
    (first as Element | null)?.scrollIntoView({ block: "nearest" });
  }, [text, point]);

  return (
    <div className="src-side">
      <div className="sc-head">
        <Icon name="file" size={16} />
        <b>{file?.name ?? "Calculated value"}</b>
        <span className="spacer" />
        <button className="sc-x" onClick={onClose} aria-label="Close source">
          <Icon name="x" size={16} />
        </button>
      </div>
      <div className="sc-scroll">
        <div className="sc-claim">
          <span>{point.name}</span>
          {draftContext && <p>{draftContext}</p>}
          <div className="sc-math">
            {point.derivation ? (
              <>
                {point.derivation} = <b>{point.current}</b>
              </>
            ) : (
              <>
                Value in the draft: <b>{point.current}</b>
              </>
            )}
          </div>
        </div>
        {file && !isPdf && (
          <div className="sc-doc" ref={docRef}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text ?? ""}</ReactMarkdown>
          </div>
        )}
        {(isPdf || !file) && point.source_lines.length > 0 && (
          <div className="sc-doc">
            {point.source_lines.map((l, i) => (
              <blockquote className="hit" key={i}>
                {l}
              </blockquote>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

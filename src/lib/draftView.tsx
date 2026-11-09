import { diffWords } from "diff";
import type { ReactNode } from "react";

// A small renderer for the skill's draft markdown (headings, bullets, bold,
// paragraphs). Owning it lets the review highlight exact phrases in place.

export type Block = { kind: "h1" | "h2" | "h3" | "li" | "p" | "quote"; text: string };

export function parseBlocks(md: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of md.split("\n")) {
    const line = raw.trim();
    if (!line || /^-{3,}$/.test(line)) continue;
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) blocks.push({ kind: (["h1", "h2", "h3"] as const)[heading[1].length - 1], text: heading[2] });
    else if (/^[-*]\s+/.test(line)) blocks.push({ kind: "li", text: line.replace(/^[-*]\s+/, "") });
    else if (line.startsWith(">")) blocks.push({ kind: "quote", text: line.replace(/^>\s?/, "") });
    else blocks.push({ kind: "p", text: line });
  }
  return blocks;
}

export const stripBold = (s: string) => s.replace(/\*\*/g, "");

export type Mark = { phrase: string; className: string; id?: string };

// Renders **bold** and wraps every occurrence of each phrase (matched without
// bold markers) in a <mark>.
export function renderInline(raw: string, marks: Mark[] = []): ReactNode[] {
  const segments: { text: string; bold: boolean }[] = [];
  raw.split(/(\*\*[^*]+\*\*)/).forEach((part) => {
    if (!part) return;
    const bold = part.startsWith("**") && part.endsWith("**") && part.length > 4;
    segments.push({ text: bold ? part.slice(2, -2) : part, bold });
  });
  const plain = segments.map((s) => s.text).join("");

  const ranges: { start: number; end: number; mark: Mark }[] = [];
  for (const mark of marks) {
    const needle = stripBold(mark.phrase).trim();
    if (!needle) continue;
    for (let at = plain.indexOf(needle); at !== -1; at = plain.indexOf(needle, at + needle.length)) {
      if (!ranges.some((r) => at < r.end && at + needle.length > r.start)) ranges.push({ start: at, end: at + needle.length, mark });
    }
  }
  ranges.sort((a, b) => a.start - b.start);

  const out: ReactNode[] = [];
  let pos = 0;
  let key = 0;
  const emit = (from: number, to: number, mark?: Mark) => {
    const pieces: ReactNode[] = [];
    let offset = 0;
    for (const seg of segments) {
      const s = Math.max(from, offset);
      const e = Math.min(to, offset + seg.text.length);
      if (s < e) {
        const text = seg.text.slice(s - offset, e - offset);
        pieces.push(seg.bold ? <b key={key++}>{text}</b> : text);
      }
      offset += seg.text.length;
    }
    if (!mark) {
      out.push(...pieces);
      return;
    }
    out.push(
      <mark key={key++} className={mark.className} data-mark={mark.id}>
        {pieces}
      </mark>,
    );
  };
  for (const r of ranges) {
    if (r.start > pos) emit(pos, r.start);
    emit(r.start, r.end, r.mark);
    pos = r.end;
  }
  if (pos < plain.length) emit(pos, plain.length);
  return out;
}

export function CleanDoc({ md, marks }: { md: string; marks: Mark[] }) {
  const blocks = parseBlocks(md);
  return (
    <article className="doc">
      {blocks.map((b, i) => {
        const inner = renderInline(b.text, marks);
        if (b.kind === "h1") return <h1 key={i}>{inner}</h1>;
        if (b.kind === "h2") return <h3 key={i}>{inner}</h3>;
        if (b.kind === "h3") return <h4 key={i}>{inner}</h4>;
        if (b.kind === "li") return <p key={i} className="li">{inner}</p>;
        if (b.kind === "quote") return <p key={i} className="kicker">{inner}</p>;
        return <p key={i}>{inner}</p>;
      })}
    </article>
  );
}

// Splits a report into its "## Section N" parts, keyed by section number.
function sections(md: string) {
  const out = new Map<string, { title: string; body: string }>();
  for (const part of md.split(/^##\s+/m).slice(1)) {
    const [title, ...rest] = part.split("\n");
    const num = title.match(/Section\s+(\d+)/i)?.[1];
    if (num) out.set(num, { title: title.trim(), body: rest.join("\n") });
  }
  return out;
}

function flatten(body: string) {
  return parseBlocks(body)
    .map((b) => (b.kind === "li" ? "• " : "") + stripBold(b.text))
    .join("\n");
}

type Part = { type: "eq" | "del" | "ins"; text: string };

// Word diffs get choppy around punctuation. Short unchanged runs sandwiched
// between changes are folded into the change, and each change reads as one
// removed phrase followed by one added phrase.
function readable(parts: ReturnType<typeof diffWords>): Part[] {
  const changed = (i: number) => !!parts[i] && (parts[i].added || parts[i].removed);
  const raw: Part[] = [];
  parts.forEach((p, i) => {
    const type = p.added ? "ins" : p.removed ? "del" : "eq";
    const shortGap = type === "eq" && changed(i - 1) && changed(i + 1) && !p.value.includes("\n") && p.value.trim().split(/\s+/).length <= 2;
    if (shortGap) raw.push({ type: "del", text: p.value }, { type: "ins", text: p.value });
    else raw.push({ type, text: p.value });
  });
  const out: Part[] = [];
  let del = "";
  let ins = "";
  const flush = () => {
    if (del) out.push({ type: "del", text: del });
    if (ins) out.push({ type: "ins", text: ins });
    del = ins = "";
  };
  for (const p of raw) {
    if (p.type === "eq") {
      flush();
      out.push(p);
    } else if (p.type === "del") del += p.text;
    else ins += p.text;
  }
  flush();
  return out;
}

// Word-level redline of each draft section against the same section of the prior report.
export function RedlineDoc({ draft, prior }: { draft: string; prior: string }) {
  const before = sections(prior);
  const lead = parseBlocks(draft.split(/^##\s+/m)[0]);
  return (
    <article className="doc redline">
      {lead.map((b, i) => (b.kind === "h1" ? <h1 key={i}>{stripBold(b.text)}</h1> : <p key={i} className="kicker">{stripBold(b.text)}</p>))}
      {[...sections(draft).entries()].map(([num, sec]) => {
        const old = before.get(num);
        const parts = readable(diffWords(old ? flatten(old.body) : "", flatten(sec.body)));
        return (
          <section key={num}>
            <h3>{sec.title}</h3>
            <p className="diff">
              {parts.map((p, i) => (p.type === "ins" ? <ins key={i}>{p.text}</ins> : p.type === "del" ? <del key={i}>{p.text}</del> : <span key={i}>{p.text}</span>))}
            </p>
          </section>
        );
      })}
    </article>
  );
}

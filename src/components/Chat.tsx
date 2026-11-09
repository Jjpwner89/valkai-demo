"use client";

import Anthropic from "@anthropic-ai/sdk";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useApiKey } from "@/lib/apiKey";
import { ACCEPTED_FILES, fileToBlock } from "@/lib/attachments";
import { DEFAULT_MODEL, MODELS } from "@/lib/models";
import { Icon } from "./icons";
import { ValkaiMark } from "./Logos";

type MessageParam = Anthropic.Beta.Messages.BetaMessageParam;
type ContentBlock = Anthropic.Beta.Messages.BetaContentBlockParam;

type Turn =
  | { role: "user"; text: string; files: string[] }
  | { role: "assistant"; text: string; pending: boolean; error?: boolean };

const SYSTEM = `You are an assistant in PharmaCo's drug safety workspace, built with Valkai. You help pharmacovigilance and regulatory reviewers work with their safety data.

When the user attaches files, base your answer on them and name the case IDs, figures or sections you relied on. If the files don't support an answer, say so plainly rather than inferring.

Keep answers short and plain. Use markdown sparingly: short paragraphs, and bullets only for lists of items.`;

export default function Chat() {
  const { client, disconnect, trackBusy } = useApiKey();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [history, setHistory] = useState<MessageParam[]>([]);
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [turns]);

  function updateLast(patch: Partial<Extract<Turn, { role: "assistant" }>>) {
    setTurns((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role === "assistant") next[next.length - 1] = { ...last, ...patch };
      return next;
    });
  }

  async function send() {
    const text = draft.trim();
    if (!client || sending || (!text && files.length === 0)) return;
    setNotice("");

    let blocks: ContentBlock[];
    try {
      blocks = await Promise.all(files.map(fileToBlock));
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Couldn't read that file.");
      return;
    }
    if (text) blocks.push({ type: "text", text });

    const userMessage: MessageParam = { role: "user", content: blocks };
    const nextHistory = [...history, userMessage];
    const option = MODELS.find((m) => m.id === model) ?? MODELS[0];

    setTurns((prev) => [
      ...prev,
      { role: "user", text, files: files.map((f) => f.name) },
      { role: "assistant", text: "", pending: true },
    ]);
    setDraft("");
    setFiles([]);
    setSending(true);

    await trackBusy(async () => {
      try {
        const stream = client.beta.messages.stream({
          model: option.id,
          max_tokens: 64000,
          system: SYSTEM,
          messages: nextHistory,
          output_config: { effort: "medium" },
          ...(option.fallbacks ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
        });
        let streamed = "";
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            streamed += event.delta.text;
            updateLast({ text: streamed });
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          updateLast({ text: "Claude declined this request.", pending: false, error: true });
          setHistory(nextHistory.slice(0, -1));
          return;
        }
        // Keep the full content (thinking blocks included) for the next turn.
        setHistory([...nextHistory, { role: "assistant", content: final.content as ContentBlock[] }]);
        updateLast({ pending: false });
      } catch (err) {
        if (err instanceof Anthropic.AuthenticationError) {
          disconnect();
          updateLast({ text: "The API key stopped working. Reconnect and try again.", pending: false, error: true });
        } else if (err instanceof Anthropic.RateLimitError) {
          updateLast({ text: "Too many requests right now. Wait a moment and try again.", pending: false, error: true });
        } else if (err instanceof Anthropic.APIConnectionError) {
          updateLast({ text: "Couldn't reach Claude. Check the connection and try again.", pending: false, error: true });
        } else if (err instanceof Anthropic.APIError) {
          updateLast({ text: `Claude returned an error: ${err.message}`, pending: false, error: true });
        } else {
          updateLast({ text: "Something went wrong. Try again.", pending: false, error: true });
        }
      } finally {
        setSending(false);
      }
    });
  }

  const empty = turns.length === 0;
  const current = MODELS.find((m) => m.id === model) ?? MODELS[0];

  const composer = (
    <div className={`composer${empty ? "" : " slim"}`}>
      {files.length > 0 && (
        <div className="chips">
          {files.map((f, i) => (
            <span className="chip" key={`${f.name}-${i}`}>
              <Icon name="file" size={14} />
              {f.name}
              <button className="chip-x" aria-label={`Remove ${f.name}`} onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}>
                <Icon name="x" size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <textarea
        className="typed"
        rows={empty ? 2 : 1}
        placeholder={empty ? "Ask about your safety data…" : "Ask a follow-up…"}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void send();
          }
        }}
      />
      <div className="comp-row">
        <button className="icon-btn" aria-label="Attach files" onClick={() => fileInput.current?.click()}>
          <Icon name="clip" />
        </button>
        <input
          ref={fileInput}
          type="file"
          multiple
          hidden
          accept={ACCEPTED_FILES}
          onChange={(e) => {
            const picked = Array.from(e.target.files ?? []);
            setFiles((prev) => [...prev, ...picked]);
            e.target.value = "";
          }}
        />
        <div className="spacer" />
        <div className="model-wrap">
          <button className="model" onClick={() => setMenuOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={menuOpen}>
            {current.name}
            <Icon name="down" size={14} />
          </button>
          {menuOpen && (
            <div className={`menu${empty ? " below" : ""}`} role="listbox">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  role="option"
                  aria-selected={m.id === model}
                  className={`menu-item${m.id === model ? " on" : ""}`}
                  onClick={() => {
                    setModel(m.id);
                    setMenuOpen(false);
                  }}
                >
                  <b>{m.name}</b>
                  <span>{m.note}</span>
                  {m.id === model && <Icon name="check" size={14} weight={2.5} />}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="send" aria-label="Send" disabled={sending || (!draft.trim() && files.length === 0)} onClick={() => void send()}>
          <Icon name="up" size={16} weight={2.5} />
        </button>
      </div>
    </div>
  );

  if (empty) {
    return (
      <div className="chat">
        <div className="chat-mid">
          <h1 className="hello">What are you working on?</h1>
          {composer}
          {notice && <p className="notice">{notice}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="thread">
      <div className="msgs">
        {turns.map((t, i) =>
          t.role === "user" ? (
            <div className="m-user" key={i}>
              {t.files.map((name) => (
                <span className="chip" key={name}>
                  <Icon name="file" size={14} />
                  {name}
                </span>
              ))}
              {t.text && <div className="bubble">{t.text}</div>}
            </div>
          ) : (
            <div className={`m-ai${t.error ? " err" : ""}`} key={i}>
              <span className="ai-av">
                <ValkaiMark />
              </span>
              <div className="ai-body">
                {t.pending && !t.text ? (
                  <span className="thinking">
                    <span className="spin" />
                    Thinking
                  </span>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{t.text}</ReactMarkdown>
                )}
              </div>
            </div>
          ),
        )}
        <div ref={endRef} />
      </div>
      {notice && <p className="notice">{notice}</p>}
      {composer}
    </div>
  );
}

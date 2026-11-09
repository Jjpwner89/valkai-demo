"use client";

import Anthropic from "@anthropic-ai/sdk";
import { useState } from "react";
import { useApiKey } from "@/lib/apiKey";
import { Icon } from "./icons";

export default function KeyGate() {
  const { client, connect } = useApiKey();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);

  if (client) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setConnecting(true);
    setError("");
    try {
      await connect(value);
      setValue("");
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
        setError("That key didn't work. Check it and try again.");
      } else if (err instanceof Anthropic.APIConnectionError) {
        setError("Couldn't reach Claude. Check the connection and try again.");
      } else {
        setError("Something went wrong connecting. Try again.");
      }
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="modal-wrap">
      <form className="keybox" onSubmit={submit}>
        <span className="kb-ic">
          <Icon name="key" size={20} />
        </span>
        <h3>Connect to Claude</h3>
        <p>Enter your Claude API key to run drafts and chat.</p>
        <input
          className="kb-field"
          type="password"
          autoComplete="off"
          spellCheck={false}
          autoFocus
          aria-label="Claude API key"
          placeholder="sk-ant-…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {error && <p className="kb-error">{error}</p>}
        <button className="run" type="submit" disabled={connecting || !value.trim()}>
          {connecting ? "Connecting…" : "Start"}
        </button>
      </form>
    </div>
  );
}

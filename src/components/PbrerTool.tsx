"use client";

import Anthropic from "@anthropic-ai/sdk";
import { useState } from "react";
import { useApiKey } from "@/lib/apiKey";
import { classifyFile, hashFile } from "@/lib/intake";
import { readDetails, runSkill, type Progress, type ReportDetails, type RunInput, type RunResult } from "@/lib/pbrerRun";
import { buildReview, type ReviewData } from "@/lib/review";
import Inputs, { sortIntake, type Intake } from "./pbrer/Inputs";
import Review from "./pbrer/Review";
import Running from "./pbrer/Running";
import ToolBar from "./pbrer/ToolBar";

type Stage = "inputs" | "running" | "done";

export default function PbrerTool({ onBack }: { onBack: () => void }) {
  const { client, disconnect, trackBusy } = useApiKey();
  const [items, setItems] = useState<Intake[]>([]);
  const [stage, setStage] = useState<Stage>("inputs");
  const [details, setDetails] = useState<ReportDetails | null>(null);
  const [progress, setProgress] = useState<Progress>({ stage: 0, detail: "" });
  const [runInputs, setRunInputs] = useState<RunInput[]>([]);
  const [result, setResult] = useState<RunResult | null>(null);
  const [review, setReview] = useState<ReviewData | null>(null);
  const [reviewFailed, setReviewFailed] = useState(false);
  const [error, setError] = useState("");

  function patch(id: string, change: Partial<Intake>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...change } : it)));
  }

  function add(files: File[]) {
    if (!client) return;
    const fresh: Intake[] = files.map((file) => ({ id: crypto.randomUUID(), file, hash: null, status: "reading", role: null }));
    setItems((prev) => [...prev, ...fresh]);
    for (const item of fresh) {
      void hashFile(item.file).then((hash) => patch(item.id, { hash }));
      void trackBusy(() => classifyFile(client, item.file))
        .then((role) => patch(item.id, { role, status: "ready" }))
        .catch((err) => {
          if (err instanceof Anthropic.AuthenticationError) disconnect();
          patch(item.id, { status: "error" });
        });
    }
  }

  async function loadReview(inputs: RunInput[], done: RunResult) {
    if (!client) return;
    setReviewFailed(false);
    try {
      setReview(await trackBusy(() => buildReview(client, inputs, done)));
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) disconnect();
      setReviewFailed(true);
    }
  }

  async function run() {
    if (!client) return;
    const { used, missing } = sortIntake(items);
    const inputs = used.map((u) => ({ file: u.file, role: u.role as RunInput["role"] }));
    setRunInputs(inputs);
    setStage("running");
    setError("");
    setDetails(null);
    setReview(null);
    setProgress({ stage: 0, detail: "Finding the product, report number and interval" });

    await trackBusy(async () => {
      try {
        const found = await readDetails(client, inputs).catch(() => null);
        setDetails(found);
        setProgress({ stage: 1, detail: "Starting the drafting skill" });
        const done = await runSkill(client, inputs, missing, setProgress);
        setResult(done);
        setProgress({ stage: 6, detail: "Matching each value to its source" });
        await loadReview(inputs, done);
        setStage("done");
      } catch (err) {
        if (err instanceof Anthropic.AuthenticationError) disconnect();
        setError(
          err instanceof Anthropic.APIConnectionError
            ? "Lost the connection to Claude partway through."
            : err instanceof Error
              ? err.message
              : "The run didn't finish.",
        );
        setStage("inputs");
      }
    });
  }

  const step = stage === "inputs" ? 0 : stage === "running" ? 1 : 2;

  return (
    <>
      <ToolBar step={step} onBack={onBack} />
      {error && <div className="run-error">{error} Your files are still here, so you can run it again.</div>}
      {stage === "inputs" && (
        <Inputs items={items} onAdd={add} onRemove={(id) => setItems((prev) => prev.filter((it) => it.id !== id))} onRun={() => void run()} />
      )}
      {stage === "running" && <Running details={details} progress={progress} />}
      {stage === "done" && result && (
        <Review
          key={result.draft}
          result={result}
          review={review}
          reviewFailed={reviewFailed}
          inputs={runInputs}
          onRetryReview={() => void loadReview(runInputs, result)}
          onStartOver={() => setStage("inputs")}
        />
      )}
    </>
  );
}

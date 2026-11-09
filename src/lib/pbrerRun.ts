import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { fileToBlock } from "./attachments";
import { ROLES, type Role } from "./intake";

export type RunInput = { file: File; role: Role };

export type ReportDetails = {
  product: string | null;
  report_number: string | null;
  interval: string | null;
  data_lock_point: string | null;
  safety_topic: string | null;
};

export type RunResult = { name: string; draft: string; consolidated: string; summary: string };

// Stage 0 is the quick details read; 1–4 follow the skill's steps; 5 is writing
// up; 6 matches each value to its source for the review pane.
export const STAGES = [
  "Reading the report details",
  "Checking the inputs",
  "Pulling the data together",
  "Drafting the four sections",
  "Checking the draft",
  "Writing up the report",
  "Preparing the review",
];

export type Progress = { stage: number; detail: string };

const Details = z.object({
  product: z.string().nullable(),
  report_number: z.string().nullable(),
  interval: z.string().nullable(),
  data_lock_point: z.string().nullable(),
  safety_topic: z.string().nullable(),
});

const DETAILS_PROMPT = `These files are the inputs for a new PBRER. Read off the report it will be: the product name, this report's number (the prior report's number plus one if no brief says otherwise), the reporting interval, the data lock point, and the safety topic for the risk evaluation section. Use null for anything the files don't establish. Keep values short, for example "PBRER No. 3" is "3" and an interval is "01-Jan-2025 to 31-Dec-2025".`;

export async function readDetails(client: Anthropic, inputs: RunInput[]): Promise<ReportDetails | null> {
  const docs = await Promise.all(inputs.map((i) => fileToBlock(i.file)));
  const response = await client.messages.parse({
    model: "claude-haiku-5-5",
    max_tokens: 4000,
    output_config: { effort: "low", format: zodOutputFormat(Details) },
    messages: [{ role: "user", content: [...docs, { type: "text", text: DETAILS_PROMPT }] }],
  });
  return response.parsed_output ?? null;
}

async function loadSkill() {
  const [skill, template] = await Promise.all(
    ["/skill/SKILL.md", "/skill/template_pbrer-sections.md"].map(async (path) => {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`Couldn't load ${path}`);
      return res.text();
    }),
  );
  return `${skill}\n\n---\n\n# template_pbrer-sections.md\n\n${template}`;
}

function runPrompt(inputs: RunInput[], missing: Role[]) {
  const listing = inputs.map((i) => `- ${i.file.name}: ${ROLES[i.role]}`).join("\n");
  const gaps = missing.length
    ? `These required inputs were not provided, and the user chose to run without them: ${missing.map((r) => ROLES[r]).join(", ")}. Draft under the skill's missing-input rules.`
    : "All required inputs were provided.";
  return `Run the pbrer-section-draft skill in your instructions on the attached files. You are running inside a web app, so adapt it as follows.

The attached documents are the inputs, titled with their file names and identified as:
${listing}

Treat each as the file the skill names for that input. The template is included at the end of your instructions. ${gaps} Don't stop to ask questions.

As you work, show brief progress for the person watching. Start each of the skill's Steps 1–4 with a marker on its own line, exactly "[[STEP 1]]", "[[STEP 2]]", "[[STEP 3]]" or "[[STEP 4]]". After each marker, and as you move through the step, write short progress lines, each on its own line and under ten words, such as "Confirming the prior report's interval" or "Deduplicating the case listing". Write nothing else outside the deliverables: no tables, lists, figures or working. If a check fails and you revise, add a line saying so after the Step 4 marker.

Instead of saving files, finish with the deliverables in exactly this form and nothing after them:
<report_name>pbrer-No<N>_<YYYY></report_name>
<draft>
(the full draft, in markdown)
</draft>
<consolidated>
(the full consolidated data sheet, in markdown)
</consolidated>
<summary>
(the Step 5 chat summary in markdown, leaving out file locations)
</summary>`;
}

function between(text: string, tag: string) {
  const match = text.match(new RegExp(`<${tag}>\\s*([\\s\\S]*?)\\s*</${tag}>`));
  return match ? match[1] : null;
}

// The step the run is on, from the last marker in the narration.
function stageFrom(text: string) {
  if (text.includes("<report_name>") || text.includes("<draft>")) return 5;
  const last = [...text.matchAll(/\[\[STEP ([1-4])\]\]/g)].at(-1);
  return last ? Number(last[1]) : 1;
}

// The newest finished progress line in the current step. Partial lines are
// skipped so the highlight changes a line at a time instead of streaming.
function latestLine(text: string) {
  const before = text.split(/<report_name>|<draft>/)[0];
  const lastMarker = [...before.matchAll(/\[\[STEP [1-4]\]\]/g)].at(-1);
  const step = lastMarker?.index !== undefined ? before.slice(lastMarker.index) : before;
  const done = step.slice(0, step.lastIndexOf("\n") + 1);
  const lines = done
    .split("\n")
    .map((l) => l.replace(/\[\[STEP [1-4]\]\]/g, "").replace(/[*_#>`]/g, "").trim())
    .filter(Boolean);
  return lines.at(-1) ?? null;
}

// Summarized thinking opens each idea with a bold title; use the newest one.
function latestHeading(thinking: string) {
  return [...thinking.matchAll(/\*\*([^*\n]{3,90})\*\*/g)].at(-1)?.[1].trim() ?? null;
}

function short(text: string, max = 110) {
  return text.length <= max ? text : text.slice(0, text.lastIndexOf(" ", max)) + "…";
}

export async function runSkill(
  client: Anthropic,
  inputs: RunInput[],
  missing: Role[],
  onProgress: (p: Progress) => void,
): Promise<RunResult> {
  const [system, docs] = await Promise.all([loadSkill(), Promise.all(inputs.map((i) => fileToBlock(i.file)))]);
  const stream = client.beta.messages.stream({
    model: "claude-opus-5-5",
    max_tokens: 64000,
    system,
    thinking: { type: "adaptive", display: "summarized" },
    output_config: { effort: "high" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    messages: [{ role: "user", content: [...docs, { type: "text", text: runPrompt(inputs, missing) }] }],
  });

  let text = "";
  let thinking = "";
  let line: string | null = null;
  let heading: string | null = null;
  let current: Progress = { stage: 1, detail: "Reading through the inputs" };
  for await (const event of stream) {
    if (event.type !== "content_block_delta") continue;
    if (event.delta.type === "text_delta") text += event.delta.text;
    else if (event.delta.type === "thinking_delta") thinking += event.delta.thinking;
    else continue;

    // Whichever source changed most recently supplies the highlight.
    let detail = current.detail;
    const nextLine = latestLine(text);
    const nextHeading = latestHeading(thinking);
    if (nextLine && nextLine !== line) detail = line = nextLine;
    if (nextHeading && nextHeading !== heading) detail = heading = nextHeading;
    const stage = stageFrom(text);
    // A new step starts clean rather than showing the last step's line.
    if (stage !== current.stage) detail = nextLine ?? STAGES[stage];
    if (stage === 5) detail = "Writing the draft and the data sheet";

    if (stage !== current.stage || detail !== current.detail) {
      current = { stage, detail: short(detail) };
      onProgress(current);
    }
  }

  const final = await stream.finalMessage();
  if (final.stop_reason === "refusal") throw new Error("Claude declined to draft this report.");
  if (final.stop_reason === "max_tokens") throw new Error("The run was cut off before it finished. Try again.");

  const draft = between(text, "draft");
  const consolidated = between(text, "consolidated");
  if (!draft || !consolidated) throw new Error("The run finished without returning the report. Try again.");
  return {
    name: between(text, "report_name")?.trim() || "pbrer-draft",
    draft,
    consolidated,
    summary: between(text, "summary") ?? "",
  };
}

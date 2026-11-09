import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { fileToBlock } from "./attachments";
import type { RunInput, RunResult } from "./pbrerRun";

const ReviewSchema = z.object({
  data_points: z.array(
    z.object({
      group: z.string(),
      name: z.string(),
      prior: z.string().nullable(),
      current: z.string(),
      source_file: z.string().nullable(),
      derivation: z.string().nullable(),
      source_lines: z.array(z.string()),
      in_draft: z.string().nullable(),
    }),
  ),
  caveats: z.array(z.object({ id: z.string(), text: z.string(), needs_review: z.boolean() })),
  checks: z.array(z.object({ id: z.string(), name: z.string(), passed: z.boolean() })),
});

export type ReviewData = z.infer<typeof ReviewSchema>;
export type DataPoint = ReviewData["data_points"][number];

function reviewPrompt(inputs: RunInput[], result: RunResult) {
  return `The attached files are the inputs to a PBRER draft. Below are the finished draft and its consolidated data sheet. Build the data a reviewer needs to check the draft.

data_points: every figure or fact in the draft that comes from the data sheet, such as MAH and brands, authorisation counts and events, safety actions, exposure, adverse-reaction counts, safety-topic case counts and rates. Group them under short headings in the order the draft uses them (for example "Product", "Marketing authorisation", "Exposure", "Adverse reactions", then the safety topic). For each:
- name: a short label
- prior: the prior report's value, or null if it has none
- current: this report's value, kept short
- source_file: the exact file name it comes from (one of: ${inputs.map((i) => i.file.name).join(", ")}), or null if it is calculated
- derivation: for a calculated value, the calculation in a few words, otherwise null
- source_lines: up to six lines copied exactly from the source file that support the value, each a whole table row or sentence; empty if calculated
- in_draft: the shortest phrase from the draft that states the value, copied character for character, or null if the draft doesn't state it

caveats: each entry in the data sheet's caveats log, as one plain sentence. needs_review is true when a person must confirm or decide something, false when the run handled it.

checks: each quality check in the data sheet's check log, with its id, a short name, and whether it passed.

<draft>
${result.draft}
</draft>

<data_sheet>
${result.consolidated}
</data_sheet>`;
}

export async function buildReview(client: Anthropic, inputs: RunInput[], result: RunResult): Promise<ReviewData> {
  const docs = await Promise.all(inputs.map((i) => fileToBlock(i.file)));
  const response = await client.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 32000,
    output_config: { effort: "medium", format: zodOutputFormat(ReviewSchema) },
    messages: [{ role: "user", content: [...docs, { type: "text", text: reviewPrompt(inputs, result) }] }],
  });
  if (!response.parsed_output) throw new Error("Couldn't prepare the review data.");
  return response.parsed_output;
}

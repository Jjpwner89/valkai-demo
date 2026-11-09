import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { fileToBlock } from "./attachments";

export const ROLES = {
  admin: "Product and admin facts",
  ma: "MA status and regulatory",
  sales: "Sales and exposure",
  rsi: "Reference safety information",
  cases: "Case data",
  prior: "Prior PBRER",
  brief: "Drafting brief",
} as const;

export type Role = keyof typeof ROLES;
export const REQUIRED_ROLES: Role[] = ["admin", "ma", "sales", "rsi", "cases", "prior"];

const Classification = z.object({
  role: z.enum(["admin", "ma", "sales", "rsi", "cases", "prior", "brief", "other"]),
});

const CLASSIFY_PROMPT = `You sort files uploaded for drafting a PBRER (periodic benefit-risk evaluation report). Read the attached file and say which input it is:

- admin: product and administrative facts (substance, class, formulations, brands, MAHs, birth dates, indication)
- ma: worldwide marketing authorisation status and the interval's regulatory events
- sales: sales or dispensed-pack figures used to estimate patient exposure
- rsi: reference safety information or label (safety concerns, their status, risk minimisation)
- cases: adverse-reaction totals or a case line listing
- prior: a previous, finished PBRER or PSUR for the product
- brief: a drafting brief or instructions for this report (report number, interval, safety topic)
- other: anything that is none of these`;

export async function classifyFile(client: Anthropic, file: File): Promise<Role | "other"> {
  const response = await client.messages.parse({
    model: "claude-haiku-5-5",
    max_tokens: 2000,
    output_config: { effort: "low", format: zodOutputFormat(Classification) },
    messages: [{ role: "user", content: [await fileToBlock(file), { type: "text", text: CLASSIFY_PROMPT }] }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) return "other";
  return response.parsed_output.role;
}

// Identical files are caught by content, not name.
export async function hashFile(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

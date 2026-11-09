import type Anthropic from "@anthropic-ai/sdk";

type ContentBlock = Anthropic.Beta.Messages.BetaContentBlockParam;
type ImageType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

const IMAGE_TYPES: ImageType[] = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const TEXT_EXTENSIONS = [".txt", ".md", ".csv", ".tsv", ".json", ".xml", ".html"];

export const ACCEPTED_FILES = [...TEXT_EXTENSIONS, ".pdf", ...IMAGE_TYPES].join(",");

// Turns a picked file into a content block Claude can read: PDFs and text as
// documents (titled with the file name), images as images.
export async function fileToBlock(file: File): Promise<ContentBlock> {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    return {
      type: "document",
      title: file.name,
      source: { type: "base64", media_type: "application/pdf", data: await toBase64(file) },
    };
  }
  if (IMAGE_TYPES.includes(file.type as ImageType)) {
    return { type: "image", source: { type: "base64", media_type: file.type as ImageType, data: await toBase64(file) } };
  }
  if (file.type.startsWith("text/") || TEXT_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return { type: "document", title: file.name, source: { type: "text", media_type: "text/plain", data: await file.text() } };
  }
  throw new Error(`${file.name} isn't a supported file. Use PDF, text, CSV, Markdown or an image.`);
}

async function toBase64(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

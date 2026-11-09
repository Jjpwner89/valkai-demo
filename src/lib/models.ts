export type ModelOption = { id: string; name: string; note: string; fallbacks: boolean };

// Opus and Sonnet get server-side refusal fallbacks; Haiku has none.
export const MODELS: ModelOption[] = [
  { id: "claude-opus-5-5", name: "Claude Opus 5.5", note: "Most capable", fallbacks: true },
  { id: "claude-sonnet-5-5", name: "Claude Sonnet 5.5", note: "Fast and capable", fallbacks: true },
  { id: "claude-haiku-5-5", name: "Claude Haiku 5.5", note: "Fastest", fallbacks: false },
];

export const DEFAULT_MODEL = MODELS[0].id;

const API_BASE = "https://openrouter.ai/api/v1/chat/completions";

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterChunk {
  choices?: {
    delta?: { content?: string };
    finish_reason?: string | null;
  }[];
}

const FREE_MODELS = [
  { id: "openrouter/free", label: "Auto (best available free model)" },
  { id: "google/gemini-3.1-flash-lite:free", label: "Gemini 3.1 Flash Lite (fast)" },
  { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B (powerful)" },
  { id: "mistral/mistral-small-24b-instruct:free", label: "Mistral Small 24B" },
  { id: "deepseek/deepseek-v3:free", label: "DeepSeek V3 (general)" },
] as const;

const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;
const MODEL = (import.meta.env.VITE_OPENROUTER_MODEL as string | undefined) || FREE_MODELS[0].id;

export const aiConfig = {
  apiKey: API_KEY || "",
  model: MODEL,
};

const SYSTEM_PROMPT = "You are a helpful AI assistant. Answer any question the user asks — whether it's about typing, programming, general knowledge, advice, or casual conversation. Be concise but thorough. Format responses with markdown when helpful (bold, lists, code blocks). Be friendly and conversational.";

function buildMessages(input: string, history: { role: "user" | "assistant"; content: string }[]): OpenRouterMessage[] {
  const msgs: OpenRouterMessage[] = [{ role: "system", content: SYSTEM_PROMPT }];
  const recent = history.slice(-10);
  for (const m of recent) {
    msgs.push({ role: m.role, content: m.content });
  }
  msgs.push({ role: "user", content: input });
  return msgs;
}

export async function streamAIResponse(
  input: string,
  history: { role: "user" | "assistant"; content: string }[],
  onToken: (token: string) => void,
  onDone: (fullContent: string) => void,
  onError: (err: string) => void,
): Promise<void> {
  if (!API_KEY) {
    onError("AI assistant not configured. Set VITE_OPENROUTER_API_KEY in .env and rebuild.");
    return;
  }

  try {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: buildMessages(input, history),
        stream: true,
      }),
    });

    if (!response.ok) {
      let errMsg = `API error ${response.status}`;
      try { const err = await response.json(); errMsg = err.error?.message || errMsg; } catch { /* */ }
      onError(errMsg);
      return;
    }

    const body = response.body;
    if (!body) { onError("Response body is empty"); return; }
    const reader = body.getReader();

    const decoder = new TextDecoder();
    let buffer = "";
    let accumulated = "";

    async function readChunk(): Promise<void> {
      try {
        const { done, value } = await reader.read();
        if (done) { onDone(accumulated); return; }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (!json || json === "[DONE]") continue;
          try {
            const chunk: OpenRouterChunk = JSON.parse(json);
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) {
              accumulated += content;
              onToken(content);
            }
          } catch { /* skip malformed */ }
        }

        await readChunk();
      } catch (err) {
        onError(err instanceof Error ? err.message : "Stream error");
      }
    }

    await readChunk();
  } catch (err) {
    onError(err instanceof Error ? err.message : "Network error");
  }
}

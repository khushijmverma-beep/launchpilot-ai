type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type Provider = "grok" | "groq";

const GROK_API_URL = "https://api.x.ai/v1/chat/completions";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROK_MODEL = "grok-3-mini";
const GROQ_MODEL = "llama-3.3-70b-versatile";

function resolveProvider(): { provider: Provider; apiKey: string } {
  const grokKey = process.env.GROK_API_KEY?.trim();
  const groqKey = process.env.GROQ_API_KEY?.trim();

  if (grokKey?.startsWith("xai-")) {
    return { provider: "grok", apiKey: grokKey };
  }

  if (grokKey?.startsWith("gsk_")) {
    return { provider: "groq", apiKey: grokKey };
  }

  if (grokKey) {
    return { provider: "grok", apiKey: grokKey };
  }

  if (groqKey) {
    return { provider: "groq", apiKey: groqKey };
  }

  throw new Error(
    "No AI API key configured. Add GROK_API_KEY (xai-... from https://console.x.ai) or GROQ_API_KEY (gsk_... from https://console.groq.com) to .env.local"
  );
}

async function callProvider(
  provider: Provider,
  apiKey: string,
  messages: ChatMessage[],
  options?: { temperature?: number; model?: string }
): Promise<string> {
  const isGrok = provider === "grok";
  const response = await fetch(isGrok ? GROK_API_URL : GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options?.model ?? (isGrok ? GROK_MODEL : GROQ_MODEL),
      messages,
      temperature: options?.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`${isGrok ? "Grok" : "Groq"} API error (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() || "";
}

export async function chatCompletion(
  messages: ChatMessage[],
  options?: { temperature?: number; model?: string }
): Promise<string> {
  const { provider, apiKey } = resolveProvider();

  try {
    return await callProvider(provider, apiKey, messages, options);
  } catch (error) {
    const groqKey = process.env.GROQ_API_KEY?.trim();
    if (provider === "grok" && groqKey && groqKey !== apiKey) {
      return callProvider("groq", groqKey, messages, options);
    }
    throw error;
  }
}

export function getActiveProvider(): Provider {
  return resolveProvider().provider;
}

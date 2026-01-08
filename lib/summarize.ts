export async function summarizeReviews(texts: string[]): Promise<string> {
  const prompt = `
You are summarizing customer reviews for a product.

Summarize the main opinions concisely in 3–4 sentences.
Focus on strengths, weaknesses, and overall sentiment.

Reviews:
${texts.map((t, i) => `${i + 1}. ${t}`).join("\n")}
`;

  const res = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "qwen2.5vl:latest",
      prompt,
      stream: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama error: ${res.status}`);
  }

  const data = await res.json();
  if (!data.response) {
    throw new Error("No response from model");
  }
  
  return data.response.trim();
}

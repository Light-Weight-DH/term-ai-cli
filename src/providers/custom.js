// OpenAI 호환(Chat Completions) 스키마를 따르는 임의의 엔드포인트용 어댑터.
// Ollama, vLLM, OpenRouter, Azure OpenAI, 사내 게이트웨이 등 대부분이 이 스키마를 따름.
export async function generate({ config, systemPrompt, userPrompt }) {
  const headers = { "Content-Type": "application/json" };
  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }

  const res = await fetch(config.endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Custom API 오류 (${res.status}): ${errText}`);
  }

  const data = await res.json();
  // OpenAI 호환 스키마 우선 시도, 실패 시 원본 텍스트 반환
  return data.choices?.[0]?.message?.content ?? JSON.stringify(data);
}

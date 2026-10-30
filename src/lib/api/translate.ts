export async function translateHindiOrHinglishToEnglish(text: string): Promise<{
  translatedText: string;
  originalText: string;
  provider?: string;
}> {
  if (!text || !text.trim()) {
    return { translatedText: "", originalText: "" };
  }

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim() }),
    });

    if (!res.ok) {
      throw new Error(`Translation API error: HTTP ${res.status}`);
    }

    const data = await res.json();
    return {
      translatedText: data.translatedText || text,
      originalText: text,
      provider: data.provider,
    };
  } catch (err) {
    console.warn("Client translation fetch failed:", err);
    return { translatedText: text, originalText: text, provider: "client-fallback" };
  }
}

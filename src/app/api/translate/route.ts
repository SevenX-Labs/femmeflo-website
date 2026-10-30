import { NextRequest, NextResponse } from "next/server";

async function translateWithMistral(text: string, apiKey: string): Promise<string> {
  const systemPrompt = `You are an expert Hindi and Hinglish to English translator for retail sales field operations and customer visit feedback.
Translate the following spoken customer feedback into concise, natural, professional English text.
The spoken input may be in Devanagari Hindi (e.g. "दुकानदार ने बोला अगले हफ्ते नया ऑर्डर देंगे") or in Hinglish / Romanized Hindi (e.g. "dukaan band thi owner gaon gaya hai", "stock bacha hai agle hafte ana tab payment dunga", "sample diya hai owner ko achha laga").
Rules:
1. Translate accurately into clear, natural English.
2. Preserve exact retail terms, quantities, dates, payment promises, and observations.
3. Output ONLY the translated English text. Do NOT include quotes, prefixes, or explanations.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-tiny",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text.trim() },
        ],
        temperature: 0.1,
        max_tokens: 250,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Mistral returned HTTP ${res.status}`);
    }

    const data = await res.json();
    const result = data?.choices?.[0]?.message?.content?.trim();
    if (!result) throw new Error("Empty translation response from Mistral");
    return result.replace(/^["']+|["']+$/g, "");
  } finally {
    clearTimeout(timeoutId);
  }
}

async function translateWithGoogle(text: string): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text.trim())}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`Google translate returned HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const parts = data[0].map((p: any) => p?.[0] || "").join("").trim();
      if (parts) return parts;
    }
    throw new Error("Could not parse Google translate response");
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawText = typeof body.text === "string" ? body.text.trim() : "";

    if (!rawText) {
      return NextResponse.json({ translatedText: "", originalText: "" });
    }

    const apiKey = process.env.MISTRAL_API_KEY;

    // 1. Try Mistral AI if API key is present
    if (apiKey) {
      try {
        const translated = await translateWithMistral(rawText, apiKey);
        if (translated) {
          return NextResponse.json({
            translatedText: translated,
            originalText: rawText,
            provider: "mistral-ai",
          });
        }
      } catch (err) {
        console.warn("Mistral translation fallback to Google Translate:", (err as any)?.message);
      }
    }

    // 2. Fallback to Google Translate engine
    try {
      const translated = await translateWithGoogle(rawText);
      return NextResponse.json({
        translatedText: translated,
        originalText: rawText,
        provider: "google-translate",
      });
    } catch (err) {
      console.warn("Google translate fallback failed:", (err as any)?.message);
    }

    // 3. Fallback: return original text if all translations fail
    return NextResponse.json({
      translatedText: rawText,
      originalText: rawText,
      provider: "fallback-raw",
    });
  } catch (err) {
    console.error("Translation API error:", err);
    return NextResponse.json(
      { error: "Translation failed", details: (err as any)?.message },
      { status: 500 }
    );
  }
}

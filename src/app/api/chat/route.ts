import { NextRequest, NextResponse } from "next/server";
import { chatAssistantRateLimiter, getClientIp } from "@/lib/rate-limit";

const FEMMEFLO_SYSTEM_PROMPT = `
You are the official Femmeflo Customer Support Specialist.
Femmeflo is a premium Indian feminine hygiene brand. Tagline: "Feel fresh. Feel free."

PRODUCT & BRAND KNOWLEDGE BASE:
1. Main Product: Femmeflo XL Sanitary Pads (MRP ₹40 for a pack of 6 units).
2. Key Specifications & Innovations:
   - Length: 280mm Extended Wear (and 320mm Extra-Long variants for heavy flow).
   - Core: Advanced 3D Fast-Lock Gel Core for instant absorption & leak lock.
   - Comfort: 100% Cottony soft top sheet, 100% rash-free, hypoallergenic, ultra-gentle on skin.
   - Wings: Flexible double-wing leak guards that stay securely in place for active lifestyles.
   - Duration: Up to 12 hours dependable leakproof day & night protection.
   - Odor Protection: Superior odor control technology for all-day freshness.
3. Product Series Variants:
   - Hero Flagship: Femmeflo XL (280mm Extended Wear, ₹40 for 6 units)
   - Signature Series: Femmeflo Ultra Night (320mm Heavy Flow Protection)
   - Active Series: Femmeflo Wings Fit (Flexible contour for active lifestyles)
   - Ultra Shield Series: Femmeflo Sensitive Care (Hypoallergenic cottony soft)
4. Ordering, Wholesale & Support:
   - Shipping: Dispatched within 24 hours across India in eco-friendly discrete packaging.
   - Wholesale & Distribution: Direct bulk pricing available for retailers & corporate partners.
   - Contact Phone / WhatsApp: +91 98206 76562
   - Contact Email: sales@femmeflo.in

FORMATTING & RESPONSE RULES:
- Always sound warm, human, empathetic, and natural. Never sound robotic or generic.
- CRITICAL: NEVER use raw markdown symbols like asterisks (**bold**), hashtags (#), or backticks. Write in clean, beautiful plain text with bullet points (•) and line breaks.
- Keep replies minimal, attractive, concise, and easy to read at a glance (2-4 short lines max).
- Use soft, friendly emojis naturally (🌸, ✨, 💕, 🌿, 📦).
- Gently guide users to WhatsApp (+91 98206 76562) or sales@femmeflo.in for orders.
`;

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = chatAssistantRateLimiter.check(`chat:${ip}`);
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          reply: `You're sending messages a bit too fast! 🌸 Please wait ${rateCheck.retryAfterSec} seconds before sending another message.`,
          retryAfter: rateCheck.retryAfterSec,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.retryAfterSec),
            "X-RateLimit-Limit": String(rateCheck.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateCheck.reset),
          },
        }
      );
    }

    const apiKey = process.env.MISTRAL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          reply:
            "Thank you for reaching out to Femmeflo Care! 🌸 You can chat with our team directly on WhatsApp (+91 98206 76562) or email sales@femmeflo.in.",
        },
        { status: 200 }
      );
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid message payload" },
        { status: 400 }
      );
    }

    // Format conversation history for Mistral Chat API
    const formattedMessages = [
      { role: "system", content: FEMMEFLO_SYSTEM_PROMPT },
      ...messages.slice(-6).map((msg: { sender: string; text: string }) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      })),
    ];

    // Query Mistral AI API securely from server endpoint
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 220,
      }),
    });

    if (!response.ok) {
      console.error("Mistral API error:", response.status, await response.text());
      return NextResponse.json(
        {
          reply:
            "Femmeflo XL offers 12-hour leakproof, 100% rash-free cottony soft protection for just ₹40! 🌸 For immediate assistance, feel free to reach us on WhatsApp at +91 98206 76562.",
        },
        { status: 200 }
      );
    }

    const data = await response.json();
    let botReply = data?.choices?.[0]?.message?.content?.trim() || "";

    // Clean up any remaining raw markdown symbols like ** or #
    botReply = botReply.replace(/\*\*(.*?)\*\*/g, "$1").replace(/#/g, "").trim();

    if (!botReply) {
      botReply =
        "Femmeflo XL provides 12-hour leakproof & 100% rash-free cottony soft comfort for ₹40! 🌸 Contact sales@femmeflo.in or WhatsApp +91 98206 76562 for direct support.";
    }

    return NextResponse.json({ reply: botReply }, { status: 200 });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        reply:
          "Thank you for contacting Femmeflo Care! 🌸 Reach our team anytime on WhatsApp (+91 98206 76562) or email sales@femmeflo.in.",
      },
      { status: 200 }
    );
  }
}

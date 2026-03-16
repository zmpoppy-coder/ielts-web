import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { textContent, part } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = part === "part1"
      ? `You are an IELTS speaking topic extractor. Given raw text from a PDF document containing IELTS Speaking Part 1 questions, extract ALL individual questions.

Return ONLY a JSON array of question strings. Each element should be one complete question in English.
Example: ["Do you like music?", "What kind of music do you enjoy?"]

Rules:
- Extract only questions (sentences ending with ?)
- Remove numbering, bullet points, topic headers
- Keep each question as a standalone string
- If the text contains no valid questions, return an empty array []
- Do NOT include Part 2 topic cards or Part 3 questions
- Return pure JSON array, no markdown`
      : `You are an IELTS speaking topic extractor. Given raw text from a PDF document containing IELTS Speaking Part 2 topic cards, extract ALL topic cards.

Return ONLY a JSON array of topic card strings. Each element should be a complete Part 2 topic card.
Example: ["Describe a time when you helped someone. You should say: who you helped, how you helped them, why you helped them, and explain how you felt about it."]

Rules:
- Each card should start with "Describe..." and include the "You should say:" prompts
- Combine fragmented lines into complete topic cards
- If the text contains no valid topic cards, return an empty array []
- Do NOT include Part 1 short questions
- Return pure JSON array, no markdown`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Extract IELTS Speaking ${part} questions from the following text:\n\n${textContent}` },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "请求过于频繁，请稍后再试。" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI 服务出错" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let parsed: string[];
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) throw new Error("Not an array");
    } catch {
      console.error("Failed to parse:", content);
      return new Response(
        JSON.stringify({ error: "AI 返回格式异常", questions: [] }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ questions: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-speaking-topics error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

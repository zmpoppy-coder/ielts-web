import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // 处理浏览器的跨域预检请求
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, question } = await req.json();
    
    // 1. 获取你在 Supabase 后台存好的 DeepSeek API Key
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY is not configured in Supabase Secrets");

    // 2. 告诉 AI 它是雅思考官
    const systemPrompt = `You are an experienced IELTS speaking examiner. Analyze the candidate's response and provide feedback.

You must respond in the following JSON format (no markdown, pure JSON):
{
  "fluency_coherence": { "score": <1-9>, "feedback": "<brief feedback in Chinese>", "tips": "<1-2 sentence practice advice in Chinese>" },
  "lexical_resource": { "score": <1-9>, "feedback": "<brief feedback in Chinese>", "tips": "<1-2 sentence practice advice in Chinese>" },
  "grammatical_range": { "score": <1-9>, "feedback": "<brief feedback in Chinese>", "tips": "<1-2 sentence practice advice in Chinese>" },
  "pronunciation": { "score": <1-9>, "feedback": "<brief feedback in Chinese>", "tips": "<1-2 sentence practice advice in Chinese>" },
  "overall_score": <1-9>,
  "grammar_errors": [{ "original": "<error text>", "correction": "<corrected text>", "explanation": "<brief explanation in Chinese>" }],
  "vocabulary_errors": [{ "original": "<error text>", "suggestion": "<better word/phrase>", "explanation": "<brief explanation in Chinese>" }],
  "overall_feedback": "<2-3 sentences of overall feedback in Chinese>"
}

For each criterion's "tips", provide specific, actionable practice methods the candidate can use to improve that particular area. Be encouraging but practical.
Be strict but fair. Identify specific grammar and vocabulary errors in the response.`;

    const userPrompt = `Question: "${question}"\n\nCandidate's response: "${transcript}"\n\nPlease evaluate this IELTS speaking response.`;

    // 3. 向 DeepSeek 发送请求
    const response = await fetch(
      "https://api.deepseek.com/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-chat", // 使用 DeepSeek 的核心对话模型
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" } // 强制 AI 返回 JSON 格式
        }),
      }
    );

    if (!response.ok) {
      const t = await response.text();
      console.error("DeepSeek API error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "呼叫 DeepSeek 失败，请检查网络或 API Key" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // 4. 解析 AI 返回的分数
    let parsed;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ error: "AI 返回格式异常，无法解析分数", raw: content }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("speaking-score error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
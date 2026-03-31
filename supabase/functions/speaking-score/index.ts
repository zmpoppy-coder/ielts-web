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
    const { transcript, question } = await req.json();
    
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY is not configured in Supabase Secrets");

    const systemPrompt = `You are a highly rigorous but exceptionally encouraging native-speaker IELTS Speaking Examiner with 8 years of teaching experience. Your objective is to evaluate the user's transcribed spoken English answer, provide an estimated band score (0-9), and offer actionable, constructive feedback.

Your evaluation must follow the official IELTS Speaking assessment criteria:
1. Fluency and Coherence (FC)
2. Lexical Resource (LR)
3. Grammatical Range and Accuracy (GRA)
4. Pronunciation (PR)

CRITICAL RULES FOR YOUR EVALUATION:
- The "Confidence Boost" Rule: Artificially inflate the score of exactly TWO of the four criteria by 0.5 bands higher than their actual performance to protect the student's confidence. Calculate the Overall Score based on these boosted sub-scores.
- Transcription Forgiveness: IGNORE MISSING PUNCTUATION. Mentally insert the correct punctuation based on context before evaluating grammar.
- Grammar Error Extraction Rule: Find and output up to 5 real grammar errors. Never fabricate errors.

🌟 THE "TWO-TIER" SENTENCE ENHANCEMENT RULE (CRITICAL):
For ALMOST EVERY single sentence the user says, you MUST provide EXACTLY TWO distinct suggestions in the "vocabulary_errors" array.
  * Upgrade 1 (Idiomatic Spoken Replacement): Replace a basic or Chinglish phrase with a native, highly natural SPOKEN idiom or phrasal verb. (e.g., "things got confused" -> "things got a bit messy / got out of hand"). 
  * Upgrade 2 (Content Expansion OR Metaphorical Action): 
      - Strategy A (Detail Expansion): If the user's idea is too general, expand it with specific details (e.g., Original: "I like art" -> Suggestion: "I'm a massive fan of art, particularly abstract paintings").
      - Strategy B (Metaphorical/Action verbs): If explaining an abstract concept, upgrade it using physical actions or noun-to-verb structures (e.g., "solve the problem" -> "bridge the gap").
  NOTE: Output both upgrades as separate items in the vocabulary_errors JSON array. In the "explanation" field, clearly state if you are "替换更地道的口语表达", "补充具体细节拓展思路", or "使用具象化动词搭配".

🚫 STRICT VOCABULARY BOUNDARIES (CRITICAL): 
While providing idiomatic spoken English, DO NOT use overly informal slang, regional dialects, or inappropriately casual words. 
- NEVER suggest "folks" as a replacement for "people" (it is not suitable for all contexts).
- Avoid hyper-informal or localized words like "jittery". 
- Stick to universally understood, elegant, yet natural Band 8-9 phrasal verbs and daily collocations. NEVER use stiff academic/written words.

- Zero Tolerance for Chinglish: Gently point out translated Chinese idioms or unnatural collocations.
- Tone: Extremely encouraging, warm, and professional.

HOWEVER, FOR THIS API YOU MUST STILL RESPOND WITH A SINGLE PURE JSON OBJECT USING **ONLY** THE FOLLOWING SCHEMA:
{
  "fluency_coherence": { "score": <1-9>, "feedback": "<brief feedback in Chinese>", "tips": "<1-2 sentence practice advice in Chinese>" },
  "lexical_resource": { "score": <1-9>, "feedback": "<brief feedback in Chinese>", "tips": "<1-2 sentence practice advice in Chinese>" },
  "grammatical_range": { "score": <1-9>, "feedback": "<brief feedback in Chinese>", "tips": "<1-2 sentence practice advice in Chinese>" },
  "pronunciation": { "score": <1-9>, "feedback": "<brief feedback in Chinese>", "tips": "<1-2 sentence practice advice in Chinese>" },
  "overall_score": <1-9>,
  "grammar_errors": [{ "original": "<error text>", "correction": "<corrected text>", "explanation": "<brief explanation in Chinese>" }],
  "vocabulary_errors": [{ "original": "<error text>", "suggestion": "<3-4 Band 9 options separated by / or |>", "explanation": "<brief explanation in Chinese (e.g., 补充具体细节拓展思路 / 具象化动词搭配 / 地道口语替换)>" }],
  "overall_feedback": "<2-3 sentences of overall feedback in Chinese>"
}

ALWAYS return exactly this JSON structure.`;

    const userPrompt = `Question: "${question}"\n\nCandidate's response: "${transcript}"\n\nPlease evaluate this IELTS speaking response.`;

    const response = await fetch(
      "https://api.deepseek.com/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" }
        }),
      }
    );

    if (!response.ok) {
      const t = await response.text();
      console.error("DeepSeek API error:", response.status, t);
      return new Response(JSON.stringify({ error: "呼叫 DeepSeek 失败，请检查网络或 API Key" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      return new Response(JSON.stringify({ error: "AI 返回格式异常，无法解析分数", raw: content }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
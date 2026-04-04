import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { getLatestGscData, insertInsight } from '@/lib/queries/growth';

const SYSTEM_PROMPT = `You are the SEO and Growth Strategist for Healing Soil (healingsoil.in), a small-batch handcrafted natural soap brand in Goa, India.

Your ONLY goal is to increase organic search traffic to healingsoil.in. Analyze the Google Search Console data, order sources, and existing blog content provided to generate specific, data-driven recommendations.

SITE CONTEXT:
- Brand: Healing Soil — handcrafted natural soaps, small-batch, Goa, India
- Tech stack: Next.js App Router, MDX blog at /blog/[slug]
- Target customers: people searching for natural, chemical-free skincare

FOCUS AREAS (in priority order):
1. seo — Near-miss pages: ranking 5–20 with meaningful impressions. Rewrite title/meta to reach top 5.
2. blog — Keyword gaps: queries with impressions but no ranking page, not already covered by existing blog posts. Generate a complete blog brief.
3. thin_content — Low CTR pages: impressions exist but CTR below 3%, suggesting title/content mismatch.
4. gsc_errors — Generate one self-contained ChatGPT/Gemini prompt the user can paste to audit and fix common GSC crawl errors, coverage issues, and 404s for healingsoil.in.

DO NOT suggest Instagram Reels, WhatsApp broadcasts, or social media content. Traffic from organic search only.`;

function buildUserPrompt(gscData) {
  const { queries, pages, orders, blog_posts, data_from, data_to } = gscData;
  return `GSC DATA (${data_from} to ${data_to}):

Top Search Queries:
${JSON.stringify(queries)}

Top Pages by Clicks:
${JSON.stringify(pages)}

Order Sources (last 60 days):
${JSON.stringify(orders)}

Existing Blog Posts on healingsoil.in — DO NOT suggest these topics as new content:
${JSON.stringify(blog_posts)}

TASK:
Identify 4–6 highest-leverage actions to increase organic traffic. Reference specific queries, pages, and metrics from the data above.

Return ONLY valid JSON with no markdown, no code fences, no explanation outside the JSON:
{
  "analysis": "2–3 sentence strategic summary of the SEO opportunity based on the data.",
  "observations": ["3–5 specific data signals you noticed — cite actual numbers"],
  "actions": [
    {
      "type": "seo|blog|thin_content|gsc_errors",
      "title": "Specific action title",
      "signal": "The exact data point that triggered this (e.g. 'ranks #9 for natural soap goa with 180 impressions, 0 clicks')",
      "rationale": "Why this is a priority and what traffic impact it could have.",
      "prompt": "The complete, self-contained prompt for the user to paste into ChatGPT or Gemini. Include all healingsoil.in context needed so the AI can act without additional input."
    }
  ]
}`;
}

async function callGemini(userPrompt, model = 'gemini-2.0-flash') {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const geminiModel = genAI.getGenerativeModel({
    model,
    systemInstruction: SYSTEM_PROMPT,
  });
  const result = await geminiModel.generateContent(userPrompt);
  return result.response.text();
}

async function callOpenAI(userPrompt) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
  });
  return completion.choices[0].message.content;
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const VALID_PROVIDERS = ['gemini', 'gemini-1.5-flash', 'openai'];
    const provider = VALID_PROVIDERS.includes(body.provider) ? body.provider : 'openai';

    if (provider !== 'openai' && !process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }
    if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not configured.' }, { status: 500 });
    }

    const gscData = await getLatestGscData();
    if (!gscData) {
      return NextResponse.json(
        { error: 'No GSC data found. Fetch GSC data first.' },
        { status: 400 }
      );
    }

    const userPrompt = buildUserPrompt(gscData);

    let rawText;
    try {
      rawText = provider === 'openai'
        ? await callOpenAI(userPrompt)
        : await callGemini(userPrompt, provider === 'gemini-1.5-flash' ? 'gemini-1.5-flash' : 'gemini-2.0-flash');
    } catch (aiError) {
      const msg = aiError.message || '';
      if (msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests')) {
        const retryMatch = msg.match(/retry in ([\d.]+)s/i);
        const retryMsg = retryMatch ? ` Retry in ${Math.ceil(parseFloat(retryMatch[1]))}s.` : '';
        return NextResponse.json(
          { error: `Gemini quota exceeded — billing may not be enabled on your Google AI Studio project.${retryMsg} Switch to OpenAI or enable billing at ai.google.dev.` },
          { status: 429 }
        );
      }
      throw aiError;
    }

    // Strip markdown code fences that Gemini sometimes wraps around JSON
    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '').trim();

    let response;
    try {
      response = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('AI JSON parse error:', parseError, '\nRaw output:', rawText);
      return NextResponse.json(
        { error: 'AI returned malformed JSON. Try again or switch provider.' },
        { status: 422 }
      );
    }

    const saved = await insertInsight({
      dataFrom: gscData.data_from,
      dateTo: gscData.data_to,
      analysis: response.analysis,
      observations: response.observations,
      actions: response.actions,
      provider,
      gscDataId: gscData.id,
    });

    return NextResponse.json(saved);
  } catch (error) {
    console.error('Growth Analysis Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

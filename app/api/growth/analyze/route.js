import { google } from 'googleapis';
import OpenAI from 'openai';
import sql from '@/lib/db';
import { getOrdersBySource } from '@/lib/queries/orders';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // 1. DATA COLLECTION PHASE (GSC + DB)
    const rawKey = process.env.GOOGLE_PRIVATE_KEY;
    const privateKey = rawKey
      .replace(/^"(.*)"$/, '$1')
      .replace(/\\n/g, '\n');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const searchconsole = google.searchconsole({ version: 'v1', auth });
    const today = new Date();
    const endDate = new Date(today.setDate(today.getDate() - 3)).toISOString().split('T')[0];
    const startDate = new Date(today.setDate(today.getDate() - 28)).toISOString().split('T')[0];
    const siteUrl = process.env.GSC_SITE_URL;

    // Fetch everything concurrently before AI starts
    const [queryResponse, pageResponse, orders] = await Promise.all([
      searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: { startDate, endDate, dimensions: ['query'], rowLimit: 50 },
      }),
      searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: { startDate, endDate, dimensions: ['page'], rowLimit: 20 },
      }),
      getOrdersBySource(60)
    ]);

    const rawInput = {
      gsc: {
        queries: queryResponse.data.rows || [],
        pages: pageResponse.data.rows || []
      },
      orders
    };

    // 2. AI ANALYSIS PHASE (OpenAI)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = `
      You are the Growth Strategy Lead for Healing Soil (healingsoil.in), a small-batch handcrafted natural soap brand in Goa, India.
      Your goal is to analyze Google Search Console data and order source data to provide 3-5 high-leverage marketing actions.
      
      SITE CONTEXT:
      - Next.js App Router, TypeScript, Tailwind, MDX blog.
      - Blog files: /content/blog/[slug].mdx (title, date, slug, excerpt, category, author).
      - Discovery channel is Instagram Reels. Purchase often happens via WhatsApp.
      
      EXISTING BLOG POSTS:
      1. Glycerin vs Goat Milk Soap, 2. Goat Milk Soap for Sensitive Skin, 3. Natural Soap for Eczema & Dry Skin, 4. Neem Tulsi Soap Benefits, 5. Shea Butter Soap Benefits, 6. What Makes Soap Chemical-Free, 7. Why Handmade Soap Lasts Longer, 8. Why We Make Soap in Small Batches.
    `;

    const userPrompt = `
      DATA INPUTS:
      Search Console Queries (Last 28 days): ${JSON.stringify(rawInput.gsc.queries)}
      Order Sources (Last 60 days): ${JSON.stringify(rawInput.orders)}

      TASK:
      Identify 3-5 highest-leverage actions. 
      Weight recommendations toward channels that are already converting (Instagram/WhatsApp).

      Return JSON in this EXACT format:
      {
        "analysis": "2-3 sentence strategic summary of performance vs conversion reality.",
        "observations": ["List 3-5 specific data signals noted"],
        "actions": [
          {
            "type": "seo|blog|reel|whatsapp",
            "title": "Action title",
            "signal": "What specific data point triggered this?",
            "rationale": "Detailed explanation of WHY this is a priority.",
            "prompt": "The full, self-contained prompt for the user to paste into ChatGPT/Claude to execute this. Bake in all healingsoil.in context."
          }
        ]
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(completion.choices[0].message.content);

    // 3. STORAGE PHASE
    const [savedInsight] = await sql`
      INSERT INTO growth_insights (
        data_from, data_to, analysis, observations, actions, raw_input
      ) VALUES (
        ${startDate}, ${endDate}, ${response.analysis}, 
        ${JSON.stringify(response.observations)}, 
        ${JSON.stringify(response.actions)}, 
        ${JSON.stringify(rawInput)}
      ) RETURNING *
    `;

    return NextResponse.json(savedInsight);
  } catch (error) {
    console.error('Growth Analysis Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

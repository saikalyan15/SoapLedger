import { google } from 'googleapis';
import { GoogleGenerativeAI } from '@google/generative-ai';
import sql from '@/lib/db';
import { getOrdersBySource } from '@/lib/queries/orders';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // 1. Fetch Data - GSC
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

    const [queryResponse, pageResponse] = await Promise.all([
      searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: { startDate, endDate, dimensions: ['query'], rowLimit: 50 },
      }),
      searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: { startDate, endDate, dimensions: ['page'], rowLimit: 20 },
      })
    ]);

    // 2. Fetch Data - Orders
    const orders = await getOrdersBySource(60);

    const rawInput = {
      gsc: {
        queries: queryResponse.data.rows || [],
        pages: pageResponse.data.rows || []
      },
      orders
    };

    // 3. Call AI (Gemini)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      BUSINESS CONTEXT
      Brand: Healing Soil (healingsoil.in)
      Description: Small-batch handcrafted natural soap, Goa, India. Founded 2023.
      Products: Goat Milk, Shea Butter, Glycerine, Loofah, Travel soaps.
      Market: India, D2C. Primary social channel: Instagram Reels.

      SITE STRUCTURE (Next.js App Router, TypeScript, Tailwind, MDX blog)
      Live pages: /, /shop, /blog, /blog/[slug], /our-story, /contact, /order, /cart, /faq, /eco-picks, /reviews, /returns
      SEO metadata: Next.js Metadata API in each page's layout/page.tsx
      Blog files: /content/blog/[slug].mdx with YAML frontmatter (title, date, slug, excerpt, category, author)

      EXISTING BLOG POSTS (do not suggest duplicates):
      1. Glycerin vs Goat Milk Soap
      2. Goat Milk Soap for Sensitive Skin
      3. Natural Soap for Eczema & Dry Skin
      4. Neem Tulsi Soap Benefits
      5. Shea Butter Soap Benefits
      6. What Makes Soap Chemical-Free
      7. Why Handmade Soap Lasts Longer
      8. Why We Make Soap in Small Batches

      DATA INPUTS
      Search Console Queries (Last 28 days): ${JSON.stringify(rawInput.gsc.queries)}
      Order Sources (Last 60 days): ${JSON.stringify(rawInput.orders)}

      TASK
      Analyze the data and identify the 3-5 highest-leverage growth actions. 
      Weight recommendations toward channels that are already converting (from Order Sources).

      Return JSON in this EXACT format:
      {
        "analysis": "2-3 sentence strategic summary of performance vs conversion reality.",
        "observations": ["List 3-5 specific data signals noted"],
        "actions": [
          {
            "type": "seo|blog|reel|whatsapp",
            "title": "Action title",
            "signal": "What specific data point triggered this?",
            "rationale": "Detailed explanation of WHY this is a priority and what it will achieve.",
            "prompt": "The full, self-contained prompt for the user to paste into an LLM to execute this. No placeholders. Bake in all healingsoil.in context."
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = JSON.parse(result.response.text());

    // 4. Save to DB
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

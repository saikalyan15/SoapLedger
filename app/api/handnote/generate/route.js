import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { name, baseType, ingredients, notes } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Soap name is required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const ingredientsList = Array.isArray(ingredients)
      ? ingredients.join(', ')
      : ingredients || '';

    const prompt = `You are writing copy for "Healing Soil", a handmade natural soap brand from Goa, India.

Write a short, warm description for a gift handnote card for this soap:
- Soap name: ${name}
${baseType ? `- Soap base: ${baseType}` : ''}
${ingredientsList ? `- Key ingredients: ${ingredientsList}` : ''}
${notes ? `- Additional context: ${notes}` : ''}

Write exactly 2 readable sentences:
1. What the soap contains (describe key ingredients in a warm, sensory way)
2. What it does for the skin or how it makes the person feel

Rules:
- Warm and genuine, not over-the-top or flowery
- Max 35 words total
- No bullet points, no quotation marks, no asterisks
- Plain prose only — write as if telling a friend about this soap`;

    const result = await model.generateContent(prompt);
    const description = result.response.text().trim();

    return NextResponse.json({ description });
  } catch (error) {
    console.error('Handnote generate error:', error);
    return NextResponse.json({ error: 'Failed to generate description' }, { status: 500 });
  }
}

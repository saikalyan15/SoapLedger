import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { name, baseType, ingredients, notes } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Soap name is required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const ingredientsList = Array.isArray(ingredients)
      ? ingredients.join(', ')
      : ingredients || '';

    const prompt = `You are writing a short description for a handmade soap gift card for "Healing Soil", a small natural soap brand from Goa, India.

Soap details:
- Name: ${name}
${baseType ? `- Base: ${baseType}` : ''}
${ingredientsList ? `- Ingredients: ${ingredientsList}` : ''}
${notes ? `- Extra context: ${notes}` : ''}

Write 2 short sentences that will go on a handwritten gift note. The tone should feel like a friend wrote it, not a brand.

Sentence 1: Mention what the soap is made with in a warm, natural way.
Sentence 2: Say what it does for the skin or how it feels to use.

Hard rules:
- No em-dashes, no hyphens joining words mid-sentence
- No words like "nourishing", "luxurious", "indulge", "elevate", or other marketing words
- No quotation marks, asterisks, or bullet points
- Under 35 words total
- Just plain, honest sentences`;

    const result = await model.generateContent(prompt);
    const description = result.response.text().trim();

    return NextResponse.json({ description });
  } catch (error) {
    console.error('Handnote generate error:', error);
    return NextResponse.json({ error: 'Failed to generate description' }, { status: 500 });
  }
}

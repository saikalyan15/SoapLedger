/**
 * Quick Gemini connectivity test.
 * Run: node test-gemini.mjs
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';

// Read key from .env.local
const env = readFileSync('.env.local', 'utf8');
const key = env.match(/GEMINI_API_KEY="?([^"\n]+)"?/)?.[1];

if (!key) {
  console.error('❌  GEMINI_API_KEY not found in .env.local');
  process.exit(1);
}

console.log(`🔑  Key: ${key.slice(0, 8)}...${key.slice(-4)}`);

const genAI = new GoogleGenerativeAI(key);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

try {
  const result = await model.generateContent(
    'In one sentence, describe a handmade rose soap from Goa, India. No em-dashes.'
  );
  const text = result.response.text().trim();
  console.log('✅  Gemini is working!\n');
  console.log('   Sample output:', text);
} catch (err) {
  console.error('❌  Gemini call failed:', err.message);
  if (err.message.includes('429')) {
    console.error('\n   → Quota exhausted. Generate a new API key at aistudio.google.com');
  } else if (err.message.includes('API_KEY_INVALID')) {
    console.error('\n   → Invalid key. Check GEMINI_API_KEY in .env.local');
  }
  process.exit(1);
}

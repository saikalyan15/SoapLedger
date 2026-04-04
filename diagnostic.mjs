import { google } from 'googleapis';
import fs from 'fs';

async function testGSC() {
  console.log('--- GSC Diagnostic (Domain Property Test) ---');
  
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const keyMatch = envContent.match(/GOOGLE_PRIVATE_KEY="([\s\S]*?)"/);
  const privateKey = keyMatch[1].replace(/\\n/g, '\n');

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: "soapledger-growth-insights@healingsoil.iam.gserviceaccount.com",
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const searchconsole = google.searchconsole({ version: 'v1', auth });

    // TRYING THE DOMAIN PROPERTY PREFIX
    const siteUrl = "sc-domain:healingsoil.in";
    console.log(`Testing with: ${siteUrl}`);

    const res = await searchconsole.searchanalytics.query({
      siteUrl: siteUrl,
      requestBody: {
        startDate: "2026-03-21",
        endDate: "2026-03-31",
        dimensions: ['query'],
        rowLimit: 5,
      },
    });

    console.log('✅ SUCCESS! Domain property access verified.');
    console.log('Data:', res.data.rows);

  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

testGSC();

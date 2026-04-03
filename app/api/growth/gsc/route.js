import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const rawKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!rawKey) {
      throw new Error('GOOGLE_PRIVATE_KEY is missing');
    }

    // More robust key parsing for Vercel/Node environment variables
    const privateKey = rawKey
      .replace(/^"(.*)"$/, '$1') // Remove surrounding double quotes
      .replace(/^'(.*)'$/, '$1') // Remove surrounding single quotes
      .replace(/\\n/g, '\n');    // Replace literal \n with real newlines

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const searchconsole = google.searchconsole({ version: 'v1', auth });

    // GSC lag is usually 3 days
    const today = new Date();
    const endDate = new Date(today.setDate(today.getDate() - 3)).toISOString().split('T')[0];
    const startDate = new Date(today.setDate(today.getDate() - 28)).toISOString().split('T')[0];

    const siteUrl = process.env.GSC_SITE_URL;

    // Fetch top queries
    const queryResponse = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 50,
      },
    });

    // Fetch top pages
    const pageResponse = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: 20,
      },
    });

    return NextResponse.json({
      startDate,
      endDate,
      queries: queryResponse.data.rows || [],
      pages: pageResponse.data.rows || [],
    });
  } catch (error) {
    console.error('GSC API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

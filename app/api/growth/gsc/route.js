import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getOrdersBySource } from '@/lib/queries/orders';
import { getLatestGscData, purgeAndInsertGscData, deleteGscData } from '@/lib/queries/growth';

function buildGoogleAuth() {
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!rawKey) throw new Error('GOOGLE_PRIVATE_KEY is missing');

  let privateKey = rawKey
    .replace(/^"(.*)"$/, '$1')
    .replace(/\\n/g, '\n');

  if (!privateKey.includes('\n') && privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    privateKey = privateKey
      .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
      .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
}

export async function GET() {
  try {
    const data = await getLatestGscData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('GSC GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const auth = buildGoogleAuth();
    const searchconsole = google.searchconsole({ version: 'v1', auth });

    const today = new Date();
    const endDate = new Date(today.setDate(today.getDate() - 3)).toISOString().split('T')[0];
    const startDate = new Date(today.setDate(today.getDate() - 28)).toISOString().split('T')[0];
    const siteUrl = process.env.GSC_SITE_URL;

    const [queryResponse, pageResponse, orders, blogRes] = await Promise.all([
      searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: { startDate, endDate, dimensions: ['query'], rowLimit: 50 },
      }),
      searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: { startDate, endDate, dimensions: ['page'], rowLimit: 20 },
      }),
      getOrdersBySource(60),
      fetch('https://healingsoil.in/api/blog-list').then(r => r.json()).catch(err => {
        console.warn('blog-list fetch failed, continuing without it:', err.message);
        return [];
      }),
    ]);

    const saved = await purgeAndInsertGscData({
      dataFrom: startDate,
      dateTo: endDate,
      queries: queryResponse.data.rows || [],
      pages: pageResponse.data.rows || [],
      orders,
      blogPosts: Array.isArray(blogRes) ? blogRes : [],
    });

    return NextResponse.json(saved);
  } catch (error) {
    console.error('GSC POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await deleteGscData();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('GSC DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

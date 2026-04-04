import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [latestInsight] = await sql`
      SELECT id, generated_at, data_from, data_to, analysis, observations, actions, provider, gsc_data_id
      FROM growth_insights
      ORDER BY generated_at DESC
      LIMIT 1
    `;

    if (!latestInsight) {
      return NextResponse.json({ actions: null });
    }

    return NextResponse.json(latestInsight);
  } catch (error) {
    console.error('Insights GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      await sql`DELETE FROM growth_insights WHERE id = ${id}`;
    } else {
      await sql`DELETE FROM growth_insights`; // Purge all
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Insights DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

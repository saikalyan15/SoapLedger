import sql from '@/lib/db';

// --- GSC Data (Phase 1) ---

export async function getLatestGscData() {
  const [row] = await sql`
    SELECT * FROM growth_gsc_data ORDER BY fetched_at DESC LIMIT 1
  `;
  return row || null;
}

export async function purgeAndInsertGscData({ dataFrom, dateTo, queries, pages, orders, blogPosts }) {
  await sql`DELETE FROM growth_gsc_data`;
  const [row] = await sql`
    INSERT INTO growth_gsc_data (data_from, data_to, queries, pages, orders, blog_posts)
    VALUES (
      ${dataFrom}, ${dateTo},
      ${JSON.stringify(queries)},
      ${JSON.stringify(pages)},
      ${JSON.stringify(orders)},
      ${JSON.stringify(blogPosts)}
    )
    RETURNING *
  `;
  return row;
}

export async function deleteGscData() {
  await sql`DELETE FROM growth_gsc_data`;
}

// --- Insights (Phase 2) ---

export async function getLatestInsight() {
  const [row] = await sql`
    SELECT id, generated_at, data_from, data_to, analysis, observations, actions, provider, gsc_data_id
    FROM growth_insights
    ORDER BY generated_at DESC
    LIMIT 1
  `;
  return row || null;
}

export async function insertInsight({ dataFrom, dateTo, analysis, observations, actions, provider, gscDataId }) {
  const [row] = await sql`
    INSERT INTO growth_insights (data_from, data_to, analysis, observations, actions, provider, gsc_data_id)
    VALUES (
      ${dataFrom}, ${dateTo}, ${analysis},
      ${JSON.stringify(observations)},
      ${JSON.stringify(actions)},
      ${provider}, ${gscDataId}
    )
    RETURNING *
  `;
  return row;
}

export async function deleteInsights(id = null) {
  if (id) {
    await sql`DELETE FROM growth_insights WHERE id = ${id}`;
  } else {
    await sql`DELETE FROM growth_insights`;
  }
}

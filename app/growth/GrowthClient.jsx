'use client';

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Trash2,
  Database,
  ClipboardList,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';

function buildLLMPrompt(gscData) {
  const { queries = [], pages = [], orders = [], blog_posts = [], data_from, data_to } = gscData;

  const queriesTable = [
    'Query                                    | Clicks | Impressions | Position',
    '---------------------------------------- | ------ | ----------- | --------',
    ...(queries).map(q =>
      `${(q.keys?.[0] ?? '').padEnd(40)} | ${String(q.clicks ?? 0).padStart(6)} | ${String(q.impressions ?? 0).padStart(11)} | ${(q.position ?? 0).toFixed(1).padStart(8)}`
    ),
  ].join('\n');

  const pagesTable = [
    'Page                                     | Clicks | Impressions |   CTR   | Position',
    '---------------------------------------- | ------ | ----------- | ------- | --------',
    ...(pages).map(p => {
      const slug = (p.keys?.[0] ?? '').replace('https://healingsoil.in', '') || p.keys?.[0] ?? '';
      const ctr = p.impressions > 0 ? ((p.clicks / p.impressions) * 100).toFixed(1) + '%' : '0.0%';
      return `${slug.padEnd(40)} | ${String(p.clicks ?? 0).padStart(6)} | ${String(p.impressions ?? 0).padStart(11)} | ${ctr.padStart(7)} | ${(p.position ?? 0).toFixed(1).padStart(8)}`;
    }),
  ].join('\n');

  const ordersText = Array.isArray(orders) && orders.length
    ? orders.map(o => `  ${o.source ?? o.channel ?? 'unknown'}: ${o.count ?? o.orders ?? 0} orders`).join('\n')
    : '  (no order source data)';

  const blogList = Array.isArray(blog_posts) && blog_posts.length
    ? blog_posts.map((b, i) => `  ${i + 1}. ${b.title ?? b.slug ?? b}`).join('\n')
    : '  (no existing blog posts found)';

  return `You are the SEO and Growth Strategist for Healing Soil (healingsoil.in), a small-batch handcrafted natural soap brand in Goa, India.

Your ONLY goal is to increase organic search traffic to healingsoil.in. Analyze the Google Search Console data, order sources, and existing blog content provided to generate specific, data-driven recommendations.

SITE CONTEXT:
- Brand: Healing Soil — handcrafted natural soaps, small-batch, Goa, India
- Tech stack: Next.js App Router, MDX blog at /blog/[slug]
- Target customers: people searching for natural, chemical-free skincare

FOCUS AREAS (in priority order):
1. seo — Near-miss pages: ranking 5–20 with meaningful impressions. Rewrite title/meta to reach top 5.
2. blog — Keyword gaps: queries with impressions but no ranking page, not already covered by existing blog posts. Generate a complete blog brief.
3. thin_content — Low CTR pages: impressions exist but CTR below 3%, suggesting title/content mismatch.
4. gsc_errors — Generate one self-contained prompt the user can paste to audit and fix common GSC crawl errors, coverage issues, and 404s for healingsoil.in.

DO NOT suggest Instagram Reels, WhatsApp broadcasts, or social media content. Traffic from organic search only.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GSC DATA: ${data_from} to ${data_to}

── TOP SEARCH QUERIES (${queries.length} total) ──
${queriesTable}

── TOP PAGES BY CLICKS (${pages.length} total) ──
${pagesTable}

── ORDER SOURCES (last 60 days) ──
${ordersText}

── EXISTING BLOG POSTS (do NOT suggest these as new content) ──
${blogList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TASK:
Identify 4–6 highest-leverage actions to increase organic traffic. Reference specific queries, pages, and metrics from the data above.

For each action provide:
- type: seo | blog | thin_content | gsc_errors
- title: specific action title
- signal: the exact data point that triggered this (cite actual numbers)
- rationale: why this is a priority and what traffic impact it could have
- prompt: a complete, self-contained prompt the user can paste into an LLM to execute this action (include all healingsoil.in context needed so no extra input is required)

Also include:
- A 2–3 sentence strategic summary of the overall SEO opportunity
- 3–5 specific observations citing actual numbers from the data`;
}

export default function GrowthClient() {
  const [gscData, setGscData] = useState(null);
  const [fetchingGsc, setFetchingGsc] = useState(false);
  const [gscError, setGscError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const gscRes = await fetch('/api/growth/gsc').then(r => r.json());
      setGscData(gscRes?.id ? gscRes : null);
    } catch {
      // non-critical
    } finally {
      setLoading(false);
    }
  };

  const handleFetchGsc = async () => {
    setFetchingGsc(true);
    setGscError(null);
    try {
      const res = await fetch('/api/growth/gsc', { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGscData(data);
    } catch (err) {
      setGscError(err.message);
    } finally {
      setFetchingGsc(false);
    }
  };

  const handleClearGsc = async () => {
    if (!confirm('Clear GSC data?')) return;
    await fetch('/api/growth/gsc', { method: 'DELETE' });
    setGscData(null);
  };

  const handleCopyPrompt = () => {
    if (!gscData) return;
    navigator.clipboard.writeText(buildLLMPrompt(gscData));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="Growth Insights"
        subtitle="Fetch your GSC data, then copy the ready-made prompt to paste into any LLM"
      />

      {/* ── Section 1: GSC Data ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Database className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 text-sm">GSC Data</h2>
              {gscData ? (
                <p className="text-xs text-slate-500">
                  {new Date(gscData.data_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} –{' '}
                  {new Date(gscData.data_to).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  {' · '}fetched {new Date(gscData.fetched_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              ) : (
                <p className="text-xs text-slate-400">No data fetched yet</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {gscData && (
              <button
                onClick={handleClearGsc}
                className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
            <button
              onClick={handleFetchGsc}
              disabled={fetchingGsc}
              className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${fetchingGsc ? 'animate-spin' : ''}`} />
              {fetchingGsc ? 'Fetching…' : gscData ? 'Re-fetch' : 'Fetch GSC Data'}
            </button>
          </div>
        </div>

        {gscError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {gscError}
          </div>
        )}

        {!gscData && !fetchingGsc && (
          <div className="px-6 py-10 text-center text-slate-400 text-sm">
            Click <span className="font-medium text-slate-600">Fetch GSC Data</span> to pull your latest Search Console data.
          </div>
        )}

        {fetchingGsc && (
          <div className="px-6 py-10 text-center text-slate-500 text-sm space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
            <p>Fetching from Google Search Console…</p>
          </div>
        )}

        {gscData && !fetchingGsc && (
          <div className="divide-y divide-slate-100">
            {/* Top Queries */}
            <div className="px-6 py-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                Top Queries ({gscData.queries?.length ?? 0})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-400">
                      <th className="pb-2 font-medium w-1/2">Query</th>
                      <th className="pb-2 font-medium text-right">Clicks</th>
                      <th className="pb-2 font-medium text-right">Impressions</th>
                      <th className="pb-2 font-medium text-right">Position</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(gscData.queries || []).slice(0, 15).map((q, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-1.5 pr-4 text-slate-700 truncate max-w-60">{q.keys?.[0]}</td>
                        <td className="py-1.5 text-right text-slate-600">{q.clicks}</td>
                        <td className="py-1.5 text-right text-slate-600">{q.impressions}</td>
                        <td className="py-1.5 text-right text-slate-600">{q.position?.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(gscData.queries?.length ?? 0) > 15 && (
                  <p className="mt-2 text-xs text-slate-400 text-center">+{gscData.queries.length - 15} more queries saved</p>
                )}
              </div>
            </div>

            {/* Top Pages */}
            <div className="px-6 py-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                Top Pages ({gscData.pages?.length ?? 0})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-400">
                      <th className="pb-2 font-medium w-1/2">Page</th>
                      <th className="pb-2 font-medium text-right">Clicks</th>
                      <th className="pb-2 font-medium text-right">Impressions</th>
                      <th className="pb-2 font-medium text-right">CTR</th>
                      <th className="pb-2 font-medium text-right">Position</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(gscData.pages || []).map((p, i) => {
                      const ctr = p.impressions > 0 ? ((p.clicks / p.impressions) * 100).toFixed(1) : '0.0';
                      const slug = p.keys?.[0]?.replace('https://healingsoil.in', '') || p.keys?.[0];
                      return (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-1.5 pr-4 text-slate-700 truncate max-w-60" title={slug}>{slug}</td>
                          <td className="py-1.5 text-right text-slate-600">{p.clicks}</td>
                          <td className="py-1.5 text-right text-slate-600">{p.impressions}</td>
                          <td className={`py-1.5 text-right font-medium ${parseFloat(ctr) < 3 && p.impressions > 10 ? 'text-amber-600' : 'text-slate-600'}`}>{ctr}%</td>
                          <td className="py-1.5 text-right text-slate-600">{p.position?.toFixed(1)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 2: LLM Prompt ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <ClipboardList className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 text-sm">LLM Prompt</h2>
              <p className="text-xs text-slate-400">
                {gscData ? 'Ready to copy — paste into ChatGPT, Claude, or Gemini' : 'Fetch GSC data first'}
              </p>
            </div>
          </div>
          <button
            onClick={handleCopyPrompt}
            disabled={!gscData}
            className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
          >
            {copied ? (
              <><Check className="w-3.5 h-3.5" /> Copied!</>
            ) : (
              <><Copy className="w-3.5 h-3.5" /> Copy Prompt</>
            )}
          </button>
        </div>

        {!gscData ? (
          <div className="px-6 py-10 text-center text-slate-400 text-sm">
            Fetch GSC data above to generate the prompt.
          </div>
        ) : (
          <div className="px-6 py-5">
            <pre className="p-4 bg-slate-900 text-slate-300 rounded-xl text-xs overflow-auto whitespace-pre-wrap leading-relaxed font-mono max-h-96">
              {buildLLMPrompt(gscData)}
            </pre>
            <p className="mt-3 text-[11px] text-slate-400 text-center">
              This prompt includes your GSC data, site context, and task instructions — paste it as-is into any LLM.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

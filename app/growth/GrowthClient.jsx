'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  FileText,
  AlertTriangle,
  BarChart2,
  AlertCircle,
  Trash2,
  Database,
  Sparkles,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function GrowthClient() {
  // Phase 1 — GSC data
  const [gscData, setGscData] = useState(null);
  const [fetchingGsc, setFetchingGsc] = useState(false);
  const [gscError, setGscError] = useState(null);

  // Phase 2 — AI insight
  const [insight, setInsight] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [insightError, setInsightError] = useState(null);
  const [provider, setProvider] = useState('gemini');

  // UI state
  const [expandedAction, setExpandedAction] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [gscRes, insightRes] = await Promise.all([
        fetch('/api/growth/gsc').then(r => r.json()),
        fetch('/api/growth/insights').then(r => r.json()),
      ]);
      setGscData(gscRes?.id ? gscRes : null);
      setInsight(insightRes?.id ? insightRes : null);
    } catch {
      // non-critical — sections just show empty state
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
      // Stale insight no longer matches new GSC data
      setInsight(null);
    } catch (err) {
      setGscError(err.message);
    } finally {
      setFetchingGsc(false);
    }
  };

  const handleClearGsc = async () => {
    if (!confirm('Clear GSC data? This will also remove the current analysis.')) return;
    await fetch('/api/growth/gsc', { method: 'DELETE' });
    await fetch('/api/growth/insights', { method: 'DELETE' });
    setGscData(null);
    setInsight(null);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setInsightError(null);
    try {
      const res = await fetch('/api/growth/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setInsight(data);
    } catch (err) {
      setInsightError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClearInsight = async () => {
    await fetch('/api/growth/insights', { method: 'DELETE' });
    setInsight(null);
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const ACTION_CONFIG = {
    seo:          { icon: Search,        label: 'SEO Fix',      color: 'bg-blue-50 text-blue-600' },
    blog:         { icon: FileText,      label: 'Blog Post',    color: 'bg-green-50 text-green-600' },
    thin_content: { icon: BarChart2,     label: 'Thin Content', color: 'bg-amber-50 text-amber-600' },
    gsc_errors:   { icon: AlertTriangle, label: 'GSC Errors',   color: 'bg-red-50 text-red-600' },
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
        subtitle="Fetch your GSC data, then let AI generate traffic-focused actions"
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

      {/* ── Section 2: AI Analysis ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 text-sm">AI Analysis</h2>
              {insight ? (
                <p className="text-xs text-slate-500">
                  {insight.provider === 'openai' ? 'OpenAI GPT-4o mini' : 'Gemini 2.0 Flash'}
                  {' · '}generated {new Date(insight.generated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              ) : (
                <p className="text-xs text-slate-400">No analysis yet</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {insight && (
              <button
                onClick={handleClearInsight}
                className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
            <select
              value={provider}
              onChange={e => setProvider(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="gemini">Gemini 2.0 Flash</option>
              <option value="openai">OpenAI GPT-4o mini</option>
            </select>
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !gscData}
              title={!gscData ? 'Fetch GSC data first' : ''}
              className="px-4 py-1.5 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Sparkles className={`w-3.5 h-3.5 ${analyzing ? 'animate-pulse' : ''}`} />
              {analyzing ? 'Analyzing…' : insight ? 'Re-analyze' : 'Analyze with AI'}
            </button>
          </div>
        </div>

        {insightError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {insightError}
          </div>
        )}

        {!insight && !analyzing && (
          <div className="px-6 py-10 text-center text-slate-400 text-sm">
            {gscData
              ? <>Select a provider and click <span className="font-medium text-slate-600">Analyze with AI</span>.</>
              : 'Fetch GSC data first, then run the AI analysis.'}
          </div>
        )}

        {analyzing && (
          <div className="px-6 py-10 text-center space-y-3">
            <Sparkles className="w-6 h-6 animate-pulse mx-auto text-purple-400" />
            <p className="text-sm text-slate-500">Reading your data and generating recommendations…</p>
          </div>
        )}

        {insight && !analyzing && (
          <div className="space-y-0 animate-in fade-in duration-500">
            {/* Strategic Summary */}
            <div className="bg-indigo-900 text-white px-8 py-7 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <TrendingUp className="w-24 h-24" />
              </div>
              <div className="relative z-10 space-y-3">
                <div className="text-indigo-300 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Strategic Summary
                </div>
                <p className="text-lg font-medium leading-relaxed max-w-3xl">{insight.analysis}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
              {/* Observations */}
              <div className="px-6 py-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Search className="w-3.5 h-3.5" />
                  Observations
                </h3>
                <div className="space-y-2">
                  {(insight.observations || []).map((obs, i) => (
                    <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <p className="text-xs text-slate-700 leading-relaxed">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2 align-middle" />
                        {obs}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="lg:col-span-2 px-6 py-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  Recommended Actions
                </h3>
                <div className="space-y-3">
                  {(insight.actions || []).map((action, i) => {
                    const cfg = ACTION_CONFIG[action.type] || ACTION_CONFIG.seo;
                    const Icon = cfg.icon;
                    const isExpanded = expandedAction === i;

                    return (
                      <div
                        key={i}
                        className={`border rounded-xl overflow-hidden transition-all duration-200 ${isExpanded ? 'border-indigo-300 ring-1 ring-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                        <div
                          className="p-4 cursor-pointer flex items-center justify-between"
                          onClick={() => setExpandedAction(isExpanded ? null : i)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${cfg.color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.color}`}>
                                  {cfg.label}
                                </span>
                                <span className="text-xs text-slate-400 truncate max-w-50">{action.signal}</span>
                              </div>
                              <h4 className="text-sm font-semibold text-slate-900">{action.title}</h4>
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>

                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Rationale</h5>
                              <p className="text-xs text-slate-600 leading-relaxed">{action.rationale}</p>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                                  <Copy className="w-3 h-3" />
                                  Ready-to-use Prompt
                                </h5>
                                <button
                                  onClick={() => copyToClipboard(action.prompt, i)}
                                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                >
                                  {copiedIndex === i ? (
                                    <><Check className="w-3 h-3" /> Copied!</>
                                  ) : (
                                    <><Copy className="w-3 h-3" /> Copy</>
                                  )}
                                </button>
                              </div>
                              <pre className="p-4 bg-slate-900 text-slate-200 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono max-h-70">
                                {action.prompt}
                              </pre>
                              <p className="mt-1.5 text-[10px] text-slate-400 text-center italic">
                                Paste into ChatGPT or Gemini to execute this action.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

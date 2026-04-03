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
  Instagram, 
  MessageSquare,
  AlertCircle,
  Trash2
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';

export default function GrowthClient() {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedAction, setExpandedAction] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLatestInsight();
  }, []);

  const fetchLatestInsight = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/growth/insights');
      const data = await res.json();
      if (data.id) {
        setInsight(data);
      } else {
        setInsight(null);
      }
    } catch (err) {
      setError('Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      const res = await fetch('/api/growth/analyze', { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setInsight(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete all growth insights? This will clear the history.')) return;
    
    try {
      setLoading(true);
      await fetch('/api/growth/insights', { method: 'DELETE' });
      setInsight(null);
    } catch (err) {
      setError('Failed to delete insights');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader 
        title="Growth Insights" 
        subtitle="AI-driven marketing actions based on your actual performance"
      >
        <div className="flex gap-2">
          {insight && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Purge
            </button>
          )}
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
            {insight ? 'Regenerate Analysis' : 'Run First Analysis'}
          </button>
        </div>
      </PageHeader>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!insight && !analyzing && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-sm">
          <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <TrendingUp className="w-8 h-8 text-indigo-600" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-semibold text-slate-900">No insights yet</h3>
            <p className="mt-2 text-slate-500">
              Run an analysis to let the AI read your Search Console and order data to find growth opportunities for healingsoil.in.
            </p>
            <button
              onClick={handleAnalyze}
              className="mt-6 px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm transition-all active:scale-95"
            >
              Analyze Now
            </button>
          </div>
        </div>
      )}

      {analyzing && (
        <div className="bg-white border border-indigo-100 rounded-2xl p-12 text-center space-y-6 shadow-sm animate-pulse">
          <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <TrendingUp className="w-10 h-10 text-indigo-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-slate-900">AI is thinking...</h3>
            <p className="text-slate-500 text-sm">
              Reading GSC data, checking conversion sources, and drafting custom prompts.
            </p>
          </div>
          <div className="max-w-xs mx-auto space-y-3">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 w-1/3 animate-[loading_2s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>
      )}

      {insight && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Executive Summary */}
          <div className="bg-indigo-900 text-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <TrendingUp className="w-32 h-32" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2 text-indigo-200 text-xs font-bold uppercase tracking-widest">
                <TrendingUp className="w-4 h-4" />
                Strategic Analysis
              </div>
              <p className="text-xl md:text-2xl font-medium leading-relaxed max-w-3xl">
                {insight.analysis}
              </p>
              <div className="pt-4 flex flex-wrap gap-4 text-sm text-indigo-100 border-t border-indigo-800">
                <div className="flex items-center gap-2">
                  <span className="text-indigo-300">Generated:</span>
                  {new Date(insight.generated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-indigo-300">Data Window:</span>
                  {new Date(insight.data_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {new Date(insight.data_to).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Observations Column */}
            <div className="lg:col-span-1 space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 px-1">
                <Search className="w-5 h-5 text-indigo-500" />
                Key Observations
              </h3>
              <div className="space-y-3">
                {insight.observations.map((obs, i) => (
                  <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-200 transition-colors group">
                    <p className="text-sm text-slate-700 leading-relaxed leading-snug">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2 group-hover:scale-125 transition-transform" />
                      {obs}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions Column */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 px-1">
                <AlertCircle className="w-5 h-5 text-indigo-500" />
                Recommended Actions
              </h3>
              <div className="space-y-4">
                {insight.actions.map((action, i) => {
                  const Icon = action.type === 'seo' ? Search : 
                               action.type === 'blog' ? FileText :
                               action.type === 'reel' ? Instagram : MessageSquare;
                  
                  const colorClass = action.type === 'seo' ? 'bg-blue-50 text-blue-600' :
                                    action.type === 'blog' ? 'bg-green-50 text-green-600' :
                                    action.type === 'reel' ? 'bg-pink-50 text-pink-600' : 'bg-orange-50 text-orange-600';

                  const isExpanded = expandedAction === i;

                  return (
                    <div key={i} className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ${isExpanded ? 'border-indigo-300 ring-1 ring-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <div 
                        className="p-5 cursor-pointer flex items-center justify-between"
                        onClick={() => setExpandedAction(isExpanded ? null : i)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${colorClass}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${colorClass}`}>
                                {action.type}
                              </span>
                              <span className="text-xs text-slate-400">•</span>
                              <span className="text-xs text-slate-500 truncate max-w-[200px]">{action.signal}</span>
                            </div>
                            <h4 className="font-semibold text-slate-900 leading-tight">
                              {action.title}
                            </h4>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                      </div>

                      {isExpanded && (
                        <div className="px-5 pb-5 space-y-5 animate-in slide-in-from-top-2 duration-300">
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Rationale</h5>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {action.rationale}
                            </p>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                              <h5 className="text-xs font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                <Copy className="w-3 h-3" />
                                Ready-to-use Prompt
                              </h5>
                              <button 
                                onClick={() => copyToClipboard(action.prompt, i)}
                                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 transition-colors"
                              >
                                {copiedIndex === i ? (
                                  <><Check className="w-3.5 h-3.5" /> Copied!</>
                                ) : (
                                  <><Copy className="w-3.5 h-3.5" /> Copy Prompt</>
                                )}
                              </button>
                            </div>
                            <div className="relative group">
                              <pre className="p-5 bg-slate-900 text-slate-200 rounded-xl text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono max-h-[300px]">
                                {action.prompt}
                              </pre>
                            </div>
                            <p className="text-[10px] text-slate-400 text-center italic">
                              Paste this into ChatGPT or Gemini to get your content.
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
  );
}

'use client';

import React, { useState, useMemo, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { 
  Plus, Settings, Search, X, Pencil, Trash2, ChevronDown, 
  Check, AlertCircle, Loader2, MoreVertical, Edit3
} from 'lucide-react';
import { 
  addExpenseAction, updateExpenseAction, deleteExpenseAction, 
  createCategoryAction, updateCategoryAction, deleteCategoryAction,
  bulkRenameExpensesAction, bulkRecategoriseExpensesAction, bulkDeleteExpensesAction
} from '@/lib/actions/expenses';
import EmptyState from '@/components/EmptyState';

const PRESET_COLORS = [
  '#1B4332', '#D4A017', '#6B21A8', '#0F766E', '#DC2626', 
  '#92400E', '#6B7280', '#0369A1', '#BE185D', '#CA8A04'
];

export default function ExpensesClient({ initialExpenses, initialCategories, summary, monthlyTrend = [] }) {
  const router = useRouter();
  const [expenses, setExpenses] = useState(initialExpenses);
  const [categories, setCategories] = useState(initialCategories);
  const [isPending, startTransition] = useTransition();
  const [isMobile, setIsMobile] = useState(false); /* mobile only */

  // Detect Mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync state with props when they change
  useEffect(() => {
    setExpenses(initialExpenses);
  }, [initialExpenses]);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  // UI States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isCategoriesPanelOpen, setIsCategoriesPanelOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('recurring'); // 'recurring' or 'one_time'
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');

  // --- Logic ---
  const fmt = (val) => `₹${Number(val).toLocaleString('en-IN')}`;

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch = e.description.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      const matchesTab = e.category_type === activeTab;
      if (!matchesTab) return false;

      if (selectedCategoryId === 'all') return true;
      return e.category_id === selectedCategoryId;
    });
  }, [expenses, searchQuery, activeTab, selectedCategoryId]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="min-h-screen pb-20 relative page-content" style={{ padding: isMobile ? '16px' : '40px' }}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-2 gap-4">
        <div>
          <h1 className="text-[32px] md:text-[36px] font-dm-serif text-[#1B4332] leading-tight">Expenses</h1>
          <p className="text-[14px] font-plus-jakarta text-[#6B7280] mt-1">Track your operating costs</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsCategoriesPanelOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[14px] font-semibold text-[#374151] hover:bg-gray-50 transition-colors font-plus-jakarta flex-1 md:flex-none justify-center"
          >
            <Settings size={18} />
            {isMobile ? 'Categories' : 'Manage Categories'}
          </button>
          <button 
            onClick={() => { setEditingExpense(null); setIsFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#1B4332] text-white rounded-lg text-[14px] font-semibold hover:bg-[#143225] transition-colors font-plus-jakarta flex-1 md:flex-none justify-center"
          >
            <Plus size={18} />
            Add Expense
          </button>
        </div>
      </div>
      <div className="h-[2px] bg-[#E5E7EB] mb-8" />

      {/* Summary Section */}
      <div className="space-y-6 mb-12">
        {/* Row 1 — KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 kpi-grid">
          <KPICard label="Total Month" value={fmt(summary.total_this_month)} color="#1B4332" />
          <KPICard label="Total Year" value={fmt(summary.total_this_year)} color="#D4A017" />
          <KPICard label="Recurring" value={fmt(summary.recurring_total)} color="#0F766E" />
          <KPICard 
            label="Cost/Soap" 
            value={summary.cost_price_per_soap > 0 ? fmt(Math.round(summary.cost_price_per_soap)) : "—"} 
            color="#6B21A8" 
          />
        </div>

        {/* Row 2 — Spend Split Bar */}
        <div className="space-y-4">
          <div className="w-full h-[14px] rounded-[7px] bg-[#F3F4F6] flex overflow-hidden">
            <div 
              style={{ width: `${(summary.recurring_total / (summary.total_this_month || 1)) * 100}%` }}
              className="bg-[#1B4332] h-full"
            />
            <div
              style={{ width: `${(summary.one_time_total / (summary.total_this_month || 1)) * 100}%` }} 
              className="bg-[#6B7280] h-full"
            />
          </div>
          <div className="flex gap-4 text-[12px] font-plus-jakarta overflow-x-auto pb-1 scrollbar-hide">
            <span className="flex items-center gap-1.5 text-[#1B4332] font-medium whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-[#1B4332]" />
              Recurring {fmt(summary.recurring_total)}
            </span>
            <span className="flex items-center gap-1.5 text-[#6B7280] font-medium whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-[#6B7280]" />
              One-time {fmt(summary.one_time_total)}
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      {monthlyTrend.length > 0 && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[16px] font-semibold font-plus-jakarta text-[#111827] m-0">Monthly Spend</h2>
              <p className="text-[12px] font-plus-jakarta text-[#6B7280] mt-1 m-0">Last 12 months — recurring vs one-time</p>
            </div>
          </div>
          <div style={{ height: isMobile ? '220px' : '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={isMobile ? 14 : 20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'Plus Jakarta Sans, sans-serif' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'Plus Jakarta Sans, sans-serif' }} axisLine={false} tickLine={false} width={44} />
                <Tooltip
                  formatter={(value, name) => [`₹${Number(value).toLocaleString('en-IN')}`, name === 'recurring' ? 'Fixed Costs' : 'Variable Costs']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  cursor={{ fill: '#F9FAFB' }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', fontFamily: 'Plus Jakarta Sans, sans-serif', paddingTop: '12px' }}
                  formatter={name => name === 'recurring' ? 'Fixed Costs' : 'Variable Costs'} />
                <Bar dataKey="recurring" stackId="a" fill="#1B4332" radius={[0, 0, 0, 0]} />
                <Bar dataKey="one_time" stackId="a" fill="#D4A017" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="relative border-b border-[#E5E7EB] mb-8">
        <div className="flex gap-8">
          <button 
            onClick={() => { setActiveTab('recurring'); setSelectedCategoryId('all'); }}
            className={`pb-3 text-[14px] font-plus-jakarta transition-all relative ${activeTab === 'recurring' ? 'text-[#1B4332] font-semibold' : 'text-[#6B7280] font-normal hover:text-[#1B4332]'}`}
          >
            Recurring
            {activeTab === 'recurring' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1B4332]" />}
          </button>
          <button 
            onClick={() => { setActiveTab('one_time'); setSelectedCategoryId('all'); }}
            className={`pb-3 text-[14px] font-plus-jakarta transition-all relative ${activeTab === 'one_time' ? 'text-[#1B4332] font-semibold' : 'text-[#6B7280] font-normal hover:text-[#1B4332]'}`}
          >
            One-time
            {activeTab === 'one_time' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1B4332]" />}
          </button>
        </div>
      </div>

      {/* Filter + Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div 
          className="category-filter-bar flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <FilterPill label="All" active={selectedCategoryId === 'all'} onClick={() => setSelectedCategoryId('all')} color="#1B4332" />
          {categories.filter(c => c.type === activeTab).map(cat => (
            <FilterPill 
              key={cat.id} 
              label={cat.name} 
              active={selectedCategoryId === cat.id} 
              onClick={() => setSelectedCategoryId(cat.id)} 
              color={cat.color} 
              className="filter-pill"
            />
          ))}
        </div>
        <div className="relative w-full md:w-[300px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-[#E5E7EB] rounded-lg text-[16px] md:text-[14px] font-plus-jakarta focus:ring-4 focus:ring-[#1B4332]/10 outline-none transition-all"
          />
          {searchQuery && (
            <X 
              size={16} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600" 
              onClick={() => setSearchQuery('')}
            />
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <div className={`
        overflow-hidden transition-all duration-300 ease-in-out
        ${selectedIds.length > 0 ? 'max-h-[140px] md:max-h-[70px] opacity-100 mb-6' : 'max-h-0 opacity-0'}
      `}>
        <BulkActionsBar 
          selectedCount={selectedIds.length}
          ids={selectedIds}
          categories={categories}
          onCancel={() => setSelectedIds([])}
          onSuccess={() => setSelectedIds([])}
          isMobile={isMobile}
        />
      </div>

      {/* Add / Edit Form Inline */}
      {isFormOpen && (
        <div className="mb-10 animate-in slide-in-from-top duration-300">
          <ExpenseForm 
            expense={editingExpense}
            categories={categories}
            onClose={() => setIsFormOpen(false)}
            isMobile={isMobile}
          />
        </div>
      )}

      {/* Expense List */}
      {filteredExpenses.length === 0 ? (
        <EmptyState title="No expenses found" message={`Add your first ${activeTab.replace('_', '-')} expense to see it here`} />
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider font-plus-jakarta">
              {activeTab === 'recurring' ? 'RECURRING' : 'ONE-TIME & OVERHEAD'}
            </h3>
            <span className="text-[12px] font-semibold text-[#1B4332] font-plus-jakarta">
              {fmt(filteredExpenses.reduce((acc, e) => acc + Number(e.amount), 0))} total
            </span>
          </div>
          <div className="space-y-3">
            {filteredExpenses.map(exp => (
              <ExpenseRowCard 
                key={exp.id}
                expense={exp}
                isSelected={selectedIds.includes(exp.id)}
                onSelect={() => toggleSelect(exp.id)}
                onEdit={(exp) => { setEditingExpense(exp); setIsFormOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                onDelete={async (id) => { if(confirm('Delete expense?')) { await deleteExpenseAction(id); router.refresh(); } }}
                isMobile={isMobile}
              />
            ))}
          </div>
        </div>
      )}

      {/* Category Panel */}
      <CategoriesPanel 
        isOpen={isCategoriesPanelOpen}
        onClose={() => setIsCategoriesPanelOpen(false)}
        categories={categories}
      />
    </div>
  );
}

// ── Sub-Components ──────────────────────────────────────────

function KPICard({ label, value, color, sub }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 md:p-5" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="text-[10px] md:text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2 font-plus-jakarta">{label}</div>
      <div className="text-[20px] md:text-[28px] font-bold text-[#1A1A1A] font-dm-serif">{value}</div>
      {sub && <div className="text-[12px] text-[#9CA3AF] mt-1 font-plus-jakarta hidden md:block">{sub}</div>}
    </div>
  );
}

function FilterPill({ label, active, onClick, color, className }) {
  return (
    <button
      onClick={onClick}
      style={{ 
        backgroundColor: active ? color : 'white',
        color: active ? 'white' : color,
        borderColor: active ? color : '#E5E7EB'
      }}
      className={`px-4 py-1.5 rounded-full border text-[13px] font-semibold whitespace-nowrap transition-all font-plus-jakarta ${className}`}
    >
      {label}
    </button>
  );
}

function ExpenseRowCard({ expense, isSelected, onSelect, onEdit, onDelete, isMobile }) {
  const date = new Date(expense.expense_date);
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();

  return (
    <div 
      className={`group bg-white border border-[#E5E7EB] rounded-xl p-4 flex items-center gap-3 md:gap-5 transition-all expense-row`} 
      style={{ borderLeft: isSelected ? `4px solid ${expense.category_color}` : '1px solid #E5E7EB' }}
    >
      <input 
        type="checkbox" 
        checked={isSelected}
        onChange={onSelect}
        className="w-4 h-4 rounded cursor-pointer accent-[#1B4332] expense-row-checkbox"
      />
      
      {!isMobile && (
        <div className="flex flex-col items-center justify-center border-r border-gray-100 pr-5 min-w-[50px]">
          <div className="text-[11px] font-semibold text-[#9CA3AF] font-plus-jakarta">{month}</div>
          <div className="text-[18px] font-bold text-[#4B5563] font-plus-jakarta">{day}</div>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold text-[#1A1A1A] font-plus-jakarta leading-tight truncate">{expense.description}</div>
        <div className="flex items-center gap-2 mt-1">
          {isMobile && <span className="text-[11px] font-bold text-[#9CA3AF] font-plus-jakarta">{day} {month}</span>}
          <span 
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-plus-jakarta"
            style={{ 
              backgroundColor: `${expense.category_color}1F`,
              color: expense.category_color 
            }}
          >
            {expense.category_name}
          </span>
        </div>
      </div>

      <div className="text-[15px] font-bold text-[#1A1A1A] font-plus-jakarta min-w-[80px] text-right">
        ₹{Number(expense.amount).toLocaleString('en-IN')}
      </div>

      <div className={`flex gap-1 md:gap-2 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity expense-actions`}>
        <button onClick={() => onEdit(expense)} className="p-2 text-gray-400 hover:text-[#1B4332] hover:bg-gray-50 rounded-lg transition-colors">
          <Pencil size={16} />
        </button>
        <button onClick={() => onDelete(expense.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function ExpenseForm({ expense, categories, onClose, isMobile }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCatId, setSelectedCatId] = useState(expense?.category_id || '');
  const categorySelectRef = useRef(null);

  const selectedCategory = categories.find(c => c.id === selectedCatId);

  useEffect(() => {
    if (categorySelectRef.current && !expense) {
      categorySelectRef.current.focus();
    }
  }, [expense]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.target);
    const data = {
      description: formData.get('description'),
      amount: parseFloat(formData.get('amount')),
      expense_date: formData.get('expense_date'),
      category_id: formData.get('category_id'),
      notes: formData.get('notes'),
    };

    try {
      if (expense) {
        await updateExpenseAction(expense.id, data.description, data.amount, data.expense_date, data.category_id, data.notes);
      } else {
        await addExpenseAction(data.description, data.amount, data.expense_date, data.category_id, data.notes);
      }
      router.refresh();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAFDF9] border border-[#D8F3DC] rounded-2xl p-6 md:p-8 shadow-[0_2px_12px_rgba(27,67,50,0.08)]">
      <div className="flex justify-between items-center mb-6 md:mb-8">
        <h3 className="text-[20px] md:text-[22px] font-dm-serif text-[#1B4332]">
          {expense ? 'Edit Expense' : 'Log New Expense'}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
        <div>
          <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2 font-plus-jakarta">Category</label>
          <select 
            name="category_id" 
            ref={categorySelectRef}
            required 
            value={selectedCatId}
            onChange={(e) => setSelectedCatId(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg text-[16px] font-plus-jakarta font-semibold text-[#1A1A1A] focus:ring-4 focus:ring-[#1B4332]/10 outline-none transition-all appearance-none"
          >
            <option value="" disabled>Select Category</option>
            <optgroup label="RECURRING">
              {categories.filter(c => c.type === 'recurring').map(cat => (
                <option key={cat.id} value={cat.id}>● {cat.name}</option>
              ))}
            </optgroup>
            <optgroup label="ONE-TIME">
              {categories.filter(c => c.type === 'one_time').map(cat => (
                <option key={cat.id} value={cat.id}>● {cat.name}</option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className="h-[1px] bg-[#E5E7EB]" />

        <div className="flex flex-col md:grid md:grid-cols-2 gap-5 md:gap-6 expense-form-row">
          <div className="md:col-span-1">
            <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2 font-plus-jakarta">Description</label>
            <input 
              name="description" 
              required 
              defaultValue={expense?.description}
              placeholder="e.g. 1kg Glycerine base"
              className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-[16px] md:text-[14px] font-plus-jakarta focus:ring-4 focus:ring-[#1B4332]/10 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2 font-plus-jakarta">Amount ₹</label>
            <input 
              name="amount" 
              type="number" 
              step="0.01" 
              required 
              defaultValue={expense?.amount}
              placeholder="0.00"
              className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-[16px] md:text-[14px] font-plus-jakarta focus:ring-4 focus:ring-[#1B4332]/10 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex flex-col md:grid md:grid-cols-2 gap-5 md:gap-6 expense-form-row">
          <div>
            <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2 font-plus-jakarta">Date</label>
            <input 
              name="expense_date" 
              type="date" 
              required 
              defaultValue={expense ? new Date(expense.expense_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-[16px] md:text-[14px] font-plus-jakarta focus:ring-4 focus:ring-[#1B4332]/10 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2 font-plus-jakarta">Notes</label>
            <input 
              name="notes" 
              defaultValue={expense?.notes}
              placeholder="Optional details..."
              className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-[16px] md:text-[14px] font-plus-jakarta focus:ring-4 focus:ring-[#1B4332]/10 outline-none transition-all"
            />
          </div>
        </div>

        {error && <div className="text-red-600 text-[13px] font-plus-jakarta flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>}

        <div className="flex flex-col md:flex-row gap-3 pt-4 md:justify-end">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full md:w-auto md:px-8 py-3 bg-[#1B4332] text-white rounded-xl font-semibold text-[14px] hover:bg-[#143225] transition-all flex items-center gap-2 shadow-[0_2px_8px_rgba(27,67,50,0.25)] justify-center disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (expense ? 'Update' : 'Save Expense')}
          </button>
          <button 
            type="button" 
            onClick={onClose}
            className="w-full md:w-auto md:px-8 py-3 border border-[#E5E7EB] text-[#6B7280] rounded-xl font-semibold text-[14px] hover:bg-white transition-colors justify-center"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function BulkActionsBar({ selectedCount, ids, categories, onCancel, onSuccess, isMobile }) {
  const router = useRouter();
  const [activeAction, setActiveAction] = useState(null);

  return (
    <div className={`bg-[#F9F6F0] border border-[#E5E7EB] rounded-xl px-4 py-3 flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'} shadow-sm`}>
      <div className={`flex items-center gap-4 ${isMobile ? 'justify-between' : ''}`}>
        <span className="text-[13px] font-bold text-[#1B4332] font-plus-jakarta">{selectedCount} selected</span>
        {!activeAction && isMobile && (
          <button onClick={onCancel} className="text-gray-500 font-semibold text-[13px]">Cancel</button>
        )}
      </div>

      <div className={`flex items-center gap-4 ${isMobile ? 'flex-wrap' : ''}`}>
        <button onClick={async () => { if(confirm(`Delete ${selectedCount}?`)) { await bulkDeleteExpensesAction(ids); router.refresh(); onSuccess(); }}} className="text-[13px] font-semibold text-red-600 hover:underline flex items-center gap-1">
          <Trash2 size={14} /> Delete
        </button>
        <button onClick={onCancel} className={`text-gray-500 font-semibold text-[13px] ${isMobile ? 'hidden' : 'block'}`}>Cancel</button>
      </div>
    </div>
  );
}

function CategoriesPanel({ isOpen, onClose, categories }) {
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-[190] backdrop-blur-[2px]" onClick={onClose} />}
      <div className={`
        fixed top-0 right-0 h-full w-full md:w-[380px] bg-white z-[200] shadow-2xl transition-transform duration-300 ease-in-out flex flex-col categories-panel
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-[22px] font-dm-serif text-[#1B4332]">Categories</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-[14px] text-gray-500 font-plus-jakarta">Manage your expense categories here.</p>
          {/* Rest of categories logic stays same as Part 1 style */}
        </div>
      </div>
    </>
  );
}

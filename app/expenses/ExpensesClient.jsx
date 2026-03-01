'use client';

import React, { useState, useMemo, useTransition, useEffect, useRef } from 'react';
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

export default function ExpensesClient({ initialExpenses, initialCategories, summary }) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [categories, setCategories] = useState(initialCategories);
  const [isPending, startTransition] = useTransition();

  // Sync state with props when they change (e.g. after revalidatePath)
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
    <div className="min-h-screen pb-20 relative">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-2 gap-4">
        <div>
          <h1 className="text-[36px] font-dm-serif text-[#1B4332] leading-tight">Expenses</h1>
          <p className="text-[14px] font-plus-jakarta text-[#6B7280] mt-1">Track your operating costs</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsCategoriesPanelOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[14px] font-semibold text-[#374151] hover:bg-gray-50 transition-colors font-plus-jakarta"
          >
            <Settings size={18} />
            Manage Categories
          </button>
          <button 
            onClick={() => { setEditingExpense(null); setIsFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#1B4332] text-white rounded-lg text-[14px] font-semibold hover:bg-[#143225] transition-colors font-plus-jakarta"
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard label="Total This Month" value={fmt(summary.total_this_month)} color="#1B4332" />
          <KPICard label="Total This Year" value={fmt(summary.total_this_year)} color="#D4A017" />
          <KPICard label="Recurring Spend" value={fmt(summary.recurring_total)} color="#0F766E" sub="Raw material + packaging + shipping" />
          <KPICard 
            label="Cost Price Per Soap" 
            value={summary.cost_price_per_soap > 0 ? fmt(Math.round(summary.cost_price_per_soap)) : "—"} 
            color="#6B21A8" 
            sub="Blended cost (last 3 months)" 
          />
        </div>

        {/* Row 2 — Simplified Spend Split Bar */}
        <div className="space-y-4">
          <div className="w-full h-[14px] rounded-[7px] bg-[#F3F4F6] flex overflow-hidden">
            <div 
              style={{ width: `${(summary.recurring_total / (summary.total_all_time || 1)) * 100}%` }} 
              className="bg-[#1B4332] h-full"
            />
            <div 
              style={{ width: `${(summary.one_time_total / (summary.total_all_time || 1)) * 100}%` }} 
              className="bg-[#6B7280] h-full"
            />
          </div>
          <div className="flex gap-4 text-[12px] font-plus-jakarta">
            <span className="flex items-center gap-1.5 text-[#1B4332] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#1B4332]" />
              Recurring {fmt(summary.recurring_total)} ({((summary.recurring_total / (summary.total_all_time || 1)) * 100).toFixed(0)}%)
            </span>
            <span className="flex items-center gap-1.5 text-[#6B7280] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#6B7280]" />
              One-time {fmt(summary.one_time_total)} ({((summary.one_time_total / (summary.total_all_time || 1)) * 100).toFixed(0)}%)
            </span>
          </div>
        </div>
      </div>

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
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <FilterPill label="All" active={selectedCategoryId === 'all'} onClick={() => setSelectedCategoryId('all')} color="#1B4332" />
          {categories.filter(c => c.type === activeTab).map(cat => (
            <FilterPill 
              key={cat.id} 
              label={cat.name} 
              active={selectedCategoryId === cat.id} 
              onClick={() => setSelectedCategoryId(cat.id)} 
              color={cat.color} 
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
            className="w-full pl-10 pr-10 py-2 border border-[#E5E7EB] rounded-lg text-[14px] font-plus-jakarta focus:ring-4 focus:ring-[#1B4332]/10 outline-none transition-all"
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
        ${selectedIds.length > 0 ? 'max-h-[70px] opacity-100 mb-6' : 'max-h-0 opacity-0'}
      `}>
        <BulkActionsBar 
          selectedCount={selectedIds.length}
          ids={selectedIds}
          categories={categories}
          onCancel={() => setSelectedIds([])}
          onSuccess={() => setSelectedIds([])}
        />
      </div>

      {/* Add / Edit Form Inline */}
      {isFormOpen && (
        <div className="mb-10 animate-in slide-in-from-top duration-300">
          <ExpenseForm 
            expense={editingExpense}
            categories={categories}
            onClose={() => setIsFormOpen(false)}
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
                onDelete={async (id) => { if(confirm('Delete expense?')) await deleteExpenseAction(id); }}
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
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2 font-plus-jakarta">{label}</div>
      <div className="text-[28px] font-bold text-[#1A1A1A] font-dm-serif">{value}</div>
      {sub && <div className="text-[12px] text-[#9CA3AF] mt-1 font-plus-jakarta">{sub}</div>}
    </div>
  );
}

function FilterPill({ label, active, onClick, color }) {
  return (
    <button
      onClick={onClick}
      style={{ 
        backgroundColor: active ? color : 'white',
        color: active ? 'white' : color,
        borderColor: active ? color : '#E5E7EB'
      }}
      className="px-4 py-1.5 rounded-full border text-[13px] font-semibold whitespace-nowrap transition-all font-plus-jakarta"
    >
      {label}
    </button>
  );
}

function ExpenseRowCard({ expense, isSelected, onSelect, onEdit, onDelete }) {
  const date = new Date(expense.expense_date);
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();

  return (
    <div className={`
      group bg-white border border-[#E5E7EB] rounded-xl p-4 flex items-center gap-5 transition-all
      hover:shadow-md hover:border-opacity-100
    `} style={{ borderLeft: isSelected ? `4px solid ${expense.category_color}` : '1px solid #E5E7EB' }}>
      <input 
        type="checkbox" 
        checked={isSelected}
        onChange={onSelect}
        className="w-4 h-4 rounded cursor-pointer accent-[#1B4332]"
      />
      
      <div className="flex flex-col items-center justify-center border-r border-gray-100 pr-5 min-w-[50px]">
        <div className="text-[11px] font-semibold text-[#9CA3AF] font-plus-jakarta">{month}</div>
        <div className="text-[18px] font-bold text-[#4B5563] font-plus-jakarta">{day}</div>
      </div>

      <div className="flex-1">
        <div className="text-[15px] font-semibold text-[#1A1A1A] font-plus-jakarta leading-tight">{expense.description}</div>
        {expense.notes && <div className="text-[12px] text-[#9CA3AF] italic mt-1 font-plus-jakarta">{expense.notes}</div>}
      </div>

      <div 
        className="px-3 py-1 rounded-full text-[12px] font-semibold font-plus-jakarta"
        style={{ 
          backgroundColor: `${expense.category_color}1F`, // 12% opacity
          color: expense.category_color 
        }}
      >
        {expense.category_name}
      </div>

      <div className="text-[15px] font-bold text-[#1A1A1A] font-plus-jakarta w-[100px] text-right">
        ₹{Number(expense.amount).toLocaleString('en-IN')}
      </div>

      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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

function ExpenseForm({ expense, categories, onClose }) {
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
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAFDF9] border border-[#D8F3DC] rounded-2xl p-8 shadow-[0_2px_12px_rgba(27,67,50,0.08)]">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-[22px] font-dm-serif text-[#1B4332]">
          {expense ? 'Edit Expense' : 'Log New Expense'}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
          {selectedCategory && (
            <div className="mt-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold font-plus-jakarta ${selectedCategory.type === 'recurring' ? 'bg-[#D8F3DC] text-[#1B4332]' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${selectedCategory.type === 'recurring' ? 'bg-[#1B4332]' : 'bg-[#6B7280]'}`} />
                {selectedCategory.type === 'recurring' ? 'Recurring — included in cost price' : 'One-time — setup & overhead'}
              </span>
            </div>
          )}
        </div>

        <div className="h-[1px] bg-[#E5E7EB]" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-1">
            <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2 font-plus-jakarta">Description</label>
            <input 
              name="description" 
              required 
              defaultValue={expense?.description}
              placeholder="e.g. 1kg Glycerine base"
              className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-[14px] font-plus-jakarta focus:ring-4 focus:ring-[#1B4332]/10 outline-none transition-all"
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
              className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-[14px] font-plus-jakarta focus:ring-4 focus:ring-[#1B4332]/10 outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2 font-plus-jakarta">Date</label>
            <input 
              name="expense_date" 
              type="date" 
              required 
              defaultValue={expense ? new Date(expense.expense_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-[14px] font-plus-jakarta focus:ring-4 focus:ring-[#1B4332]/10 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2 font-plus-jakarta">Notes</label>
            <input 
              name="notes" 
              defaultValue={expense?.notes}
              placeholder="Optional details..."
              className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-[14px] font-plus-jakarta focus:ring-4 focus:ring-[#1B4332]/10 outline-none transition-all"
            />
          </div>
        </div>

        {error && <div className="text-red-600 text-[13px] font-plus-jakarta flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>}

        <div className="flex gap-4 pt-4 justify-end">
          <button 
            type="button" 
            onClick={onClose}
            className="px-8 py-3 border border-[#E5E7EB] text-[#6B7280] rounded-xl font-semibold text-[14px] hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-8 py-3 bg-[#1B4332] text-white rounded-xl font-semibold text-[14px] hover:bg-[#143225] transition-all flex items-center gap-2 shadow-[0_2px_8px_rgba(27,67,50,0.25)] disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (expense ? 'Update Expense' : 'Save Expense')}
          </button>
        </div>
      </form>
    </div>
  );
}

function BulkActionsBar({ selectedCount, ids, categories, onCancel, onSuccess }) {
  const [activeAction, setActiveAction] = useState(null); // 'rename', 'move'
  const [newDescription, setNewDescription] = useState('');

  const handleRename = async () => {
    if (!newDescription) return;
    await bulkRenameExpensesAction(ids, newDescription);
    setActiveAction(null);
    onSuccess();
  };

  const handleMove = async (catId) => {
    await bulkRecategoriseExpensesAction(ids, catId);
    setActiveAction(null);
    onSuccess();
  };

  const handleDelete = async () => {
    if (confirm(`Delete ${selectedCount} expenses?`)) {
      await bulkDeleteExpensesAction(ids);
      onSuccess();
    }
  };

  return (
    <div className="bg-[#F9F6F0] border border-[#E5E7EB] rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-6">
        <span className="text-[13px] font-bold text-[#1B4332] font-plus-jakarta">{selectedCount} selected</span>
        
        {activeAction === 'rename' ? (
          <div className="flex items-center gap-2">
            <input 
              autoFocus
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              placeholder="Enter new description..."
              className="px-3 py-1.5 border border-[#E5E7EB] rounded-md text-[13px] w-[200px] outline-none"
            />
            <button onClick={handleRename} className="text-[#1B4332] font-bold text-[13px]">Apply</button>
            <button onClick={() => setActiveAction(null)} className="text-gray-400"><X size={16} /></button>
          </div>
        ) : activeAction === 'move' ? (
          <div className="flex items-center gap-2">
            <select 
              onChange={(e) => handleMove(e.target.value)}
              className="px-3 py-1.5 border border-[#E5E7EB] rounded-md text-[13px] outline-none"
            >
              <option value="">Move to Category...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button onClick={() => setActiveAction(null)} className="text-gray-400"><X size={16} /></button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveAction('rename')} className="text-[13px] font-semibold text-[#1B4332] hover:underline flex items-center gap-1">
              <Edit3 size={14} /> Rename
            </button>
            <button onClick={() => setActiveAction('move')} className="text-[13px] font-semibold text-[#1B4332] hover:underline flex items-center gap-1">
              <ChevronDown size={14} /> Move to Category
            </button>
            <button onClick={handleDelete} className="text-[13px] font-semibold text-red-600 hover:underline flex items-center gap-1">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>
      <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 font-semibold text-[13px]">Cancel</button>
    </div>
  );
}

function CategoriesPanel({ isOpen, onClose, categories }) {
  const [editingCat, setEditingCat] = useState(null);
  const [newCat, setNewCat] = useState({ name: '', color: PRESET_COLORS[0], type: 'recurring' });

  const handleAdd = async () => {
    if (!newCat.name) return;
    await createCategoryAction(newCat.name, newCat.color, newCat.type);
    setNewCat({ name: '', color: PRESET_COLORS[0], type: 'recurring' });
  };

  const handleUpdate = async (cat) => {
    await updateCategoryAction(cat.id, cat.name, cat.color, cat.type);
    setEditingCat(null);
  };

  const handleDelete = async (id) => {
    try {
      await deleteCategoryAction(id);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/40 z-[190] backdrop-blur-[2px]" onClick={onClose} />}
      
      {/* Panel */}
      <div className={`
        fixed top-0 right-0 h-full w-full md:w-[380px] bg-white z-[200] shadow-2xl transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-[22px] font-dm-serif text-[#1B4332]">Categories</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Recurring Section */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider font-plus-jakarta">RECURRING</h3>
            <div className="space-y-3">
              {categories.filter(c => c.type === 'recurring').map(cat => (
                <CategoryRow 
                  key={cat.id} 
                  cat={cat} 
                  isEditing={editingCat?.id === cat.id}
                  onEdit={() => setEditingCat(cat)}
                  onDelete={() => handleDelete(cat.id)}
                  onSave={handleUpdate}
                  onCancel={() => setEditingCat(null)}
                />
              ))}
            </div>
          </div>

          {/* One-time Section */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider font-plus-jakarta">ONE-TIME & OVERHEAD</h3>
            <div className="space-y-3">
              {categories.filter(c => c.type === 'one_time').map(cat => (
                <CategoryRow 
                  key={cat.id} 
                  cat={cat} 
                  isEditing={editingCat?.id === cat.id}
                  onEdit={() => setEditingCat(cat)}
                  onDelete={() => handleDelete(cat.id)}
                  onSave={handleUpdate}
                  onCancel={() => setEditingCat(null)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Add New Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-4">
          <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider font-plus-jakarta">ADD NEW CATEGORY</div>
          <input 
            value={newCat.name}
            onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
            placeholder="Category name..."
            className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-[14px] font-plus-jakarta focus:ring-4 focus:ring-[#1B4332]/10 outline-none transition-all"
          />
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map(c => (
              <button 
                key={c}
                onClick={() => setNewCat({ ...newCat, color: c })}
                className={`w-5 h-5 rounded-full transition-all ${newCat.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex bg-white rounded-lg p-1 border border-[#E5E7EB]">
            <button 
              onClick={() => setNewCat({ ...newCat, type: 'recurring' })}
              className={`flex-1 py-1.5 text-[12px] font-semibold rounded-md transition-all ${newCat.type === 'recurring' ? 'bg-[#1B4332] text-white' : 'text-gray-500'}`}
            >
              Recurring
            </button>
            <button 
              onClick={() => setNewCat({ ...newCat, type: 'one_time' })}
              className={`flex-1 py-1.5 text-[12px] font-semibold rounded-md transition-all ${newCat.type === 'one_time' ? 'bg-[#1B4332] text-white' : 'text-gray-500'}`}
            >
              One-time
            </button>
          </div>
          <button 
            onClick={handleAdd}
            className="w-full bg-[#1B4332] text-white py-2 rounded-lg font-semibold text-[14px] hover:bg-[#143225] transition-colors"
          >
            Add Category
          </button>
        </div>
      </div>
    </>
  );
}

function CategoryRow({ cat, isEditing, onEdit, onDelete, onSave, onCancel }) {
  const [edited, setEdited] = useState(cat);

  if (isEditing) {
    return (
      <div className="p-3 bg-white border border-[#E5E7EB] rounded-lg space-y-3">
        <input 
          value={edited.name}
          onChange={(e) => setEdited({ ...edited, name: e.target.value })}
          className="w-full px-3 py-1.5 border border-[#E5E7EB] rounded text-[13px] outline-none"
        />
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map(c => (
            <button 
              key={c}
              onClick={() => setEdited({ ...edited, color: c })}
              className={`w-4 h-4 rounded-full ${edited.color === c ? 'ring-1 ring-offset-1 ring-gray-400' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              if (edited.type !== cat.type) {
                if (!confirm('This will affect the cost price calculation. Continue?')) return;
              }
              onSave(edited);
            }} 
            className="flex-1 bg-[#1B4332] text-white py-1 rounded text-[12px] font-bold"
          >
            Save
          </button>
          <button onClick={onCancel} className="flex-1 bg-gray-100 text-gray-600 py-1 rounded text-[12px] font-bold">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
        <div className="flex flex-col">
          <span className="text-[14px] font-semibold text-[#1A1A1A] font-plus-jakarta">{cat.name}</span>
          <button 
            onClick={() => {
              if (confirm('This will affect the cost price calculation. Continue?')) {
                onSave({ ...cat, type: cat.type === 'recurring' ? 'one_time' : 'recurring' });
              }
            }}
            className="text-[10px] text-[#9CA3AF] hover:text-[#1B4332] transition-colors font-semibold"
          >
            {cat.type === 'recurring' ? 'Recurring' : 'One-time'}
          </button>
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-[#1B4332] hover:bg-gray-50 rounded transition-colors">
          <Pencil size={14} />
        </button>
        <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

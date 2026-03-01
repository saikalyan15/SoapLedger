'use client';

import React, { useState, useTransition } from 'react';
import { 
  Plus, Settings, Search, X, Pencil, Trash2, ChevronDown, 
  Check, AlertCircle, Loader2, MoreVertical
} from 'lucide-react';
import { 
  addExpense, updateExpense, deleteExpense, 
  createCategory, updateCategory, deleteCategory,
  bulkRenameExpenses, bulkRecategoriseExpenses, bulkDeleteExpenses
} from '@/lib/queries/expenses';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';

const PRESET_COLORS = [
  '#1B4332','#D4A017','#6B21A8','#0F766E',
  '#DC2626','#92400E','#6B7280','#0369A1',
  '#BE185D','#CA8A04'
];

const ExpensesClient = ({ initialExpenses, initialCategories, initialSummary }) => {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [categories, setCategories] = useState(initialCategories);
  const [summary, setSummary] = useState(initialSummary);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoriesPanelOpen, setIsCategoriesPanelOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [filterCategoryId, setFilterCategoryId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  // --- Helpers ---
  const fmt = (val) => `₹${Number(val).toLocaleString('en-IN')}`;

  const refreshData = async () => {
    const { getExpenses, getCategories, getExpenseSummary } = await import('@/lib/queries/expenses');
    const [e, c, s] = await Promise.all([
      getExpenses({ categoryId: filterCategoryId, search: searchQuery }),
      getCategories(),
      getExpenseSummary()
    ]);
    setExpenses(e);
    setCategories(c);
    setSummary(s);
  };

  const handleFilter = (catId) => {
    setFilterCategoryId(catId);
    startTransition(async () => {
      const { getExpenses } = await import('@/lib/queries/expenses');
      const e = await getExpenses({ categoryId: catId, search: searchQuery });
      setExpenses(e);
    });
  };

  const handleSearch = (q) => {
    setSearchQuery(q);
    startTransition(async () => {
      const { getExpenses } = await import('@/lib/queries/expenses');
      const e = await getExpenses({ categoryId: filterCategoryId, search: q });
      setExpenses(e);
    });
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // --- Render Sections ---

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <PageHeader 
        title="Expenses" 
        subtitle="Track your operating costs" 
        action={
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => setIsCategoriesPanelOpen(true)}
              style={secondaryButtonStyle}
            >
              <Settings size={18} />
              Manage Categories
            </button>
            <button 
              onClick={() => { setEditingExpense(null); setIsFormOpen(true); }}
              style={primaryButtonStyle}
            >
              <Plus size={18} />
              Add Expense
            </button>
          </div>
        }
      />

      <div style={{ height: '2px', background: '#E5E7EB', marginBottom: '32px' }} />

      {/* Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <KPICard label="Total This Month" value={fmt(summary.total_this_month)} />
        <KPICard label="Total This Year" value={fmt(summary.total_this_year)} />
        <KPICard label="Total All Time" value={fmt(summary.total_all_time)} />
      </div>

      {/* Category Breakdown Bar */}
      {summary.by_category.length > 0 && (
        <div style={{ marginBottom: '48px' }}>
          <div style={{ 
            width: '100%', 
            height: '12px', 
            borderRadius: '6px', 
            background: '#F3F4F6', 
            display: 'flex', 
            overflow: 'hidden',
            marginBottom: '16px'
          }}>
            {summary.by_category.map((cat, i) => {
              const percentage = (cat.total / summary.total_all_time) * 100;
              return (
                <div 
                  key={i} 
                  title={`${cat.category_name} — ${fmt(cat.total)} (${percentage.toFixed(1)}%)`}
                  style={{ 
                    width: `${percentage}%`, 
                    height: '100%', 
                    background: cat.color,
                    transition: 'all 0.3s'
                  }}
                />
              );
            })}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px 24px' }}>
            {summary.by_category.map((cat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color }} />
                <span style={{ fontSize: '13px', color: '#374151', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {cat.category_name}
                </span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A1A' }}>{fmt(cat.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter + Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          <button
            onClick={() => handleFilter(null)}
            style={filterPillStyle(filterCategoryId === null, '#1B4332')}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleFilter(cat.id)}
              style={filterPillStyle(filterCategoryId === cat.id, cat.color)}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input 
            type="text"
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: '40px' }}
          />
          {searchQuery && (
            <X 
              size={16} 
              onClick={() => handleSearch('')}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', cursor: 'pointer' }} 
            />
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <div style={{
        height: selectedIds.length > 0 ? '60px' : '0',
        opacity: selectedIds.length > 0 ? 1 : 0,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        marginBottom: selectedIds.length > 0 ? '24px' : '0'
      }}>
        <BulkActionsBar 
          selectedCount={selectedIds.length} 
          categories={categories}
          onCancel={() => setSelectedIds([])}
          onSuccess={() => { setSelectedIds([]); refreshData(); }}
          ids={selectedIds}
        />
      </div>

      {/* Add / Edit Form */}
      {isFormOpen && (
        <div style={{ marginBottom: '40px' }}>
          <ExpenseForm 
            expense={editingExpense} 
            categories={categories} 
            onClose={() => setIsFormOpen(false)}
            onSuccess={() => { setIsFormOpen(false); refreshData(); }}
          />
        </div>
      )}

      {/* Expense List */}
      {expenses.length === 0 ? (
        <EmptyState title="No expenses found" message="Add your first operating cost to see it here" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {expenses.map(expense => (
            <ExpenseCard 
              key={expense.id} 
              expense={expense}
              isSelected={selectedIds.includes(expense.id)}
              onSelect={() => toggleSelect(expense.id)}
              onEdit={() => { setEditingExpense(expense); setIsFormOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              onDelete={async () => { if(confirm('Delete expense?')) { await deleteExpense(expense.id); refreshData(); } }}
            />
          ))}
        </div>
      )}

      {/* Manage Categories Panel */}
      <CategoriesPanel 
        isOpen={isCategoriesPanelOpen} 
        onClose={() => setIsCategoriesPanelOpen(false)}
        categories={categories}
        onRefresh={refreshData}
      />
    </div>
  );
};

// --- Sub-Components ---

const KPICard = ({ label, value }) => (
  <div style={{
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderLeft: '3px solid #1B4332',
    borderRadius: '12px',
    padding: '20px 24px',
  }}>
    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', marginBottom: '8px', fontWeight: '600' }}>{label}</div>
    <div style={{ fontSize: '28px', fontWeight: '700', color: '#1A1A1A', fontFamily: 'DM Serif Display, serif' }}>{value}</div>
  </div>
);

const ExpenseCard = ({ expense, isSelected, onSelect, onEdit, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  const date = new Date(expense.expense_date);
  
  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: '#FFFFFF',
        border: `1px solid ${isHovered ? expense.category_color : '#E5E7EB'}`,
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        transition: 'all 0.2s',
        boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
      }}
    >
      <input 
        type="checkbox" 
        checked={isSelected}
        onChange={onSelect}
        style={{ 
          width: '18px', 
          height: '18px', 
          cursor: 'pointer',
          accentColor: expense.category_color,
          opacity: isSelected || isHovered ? 1 : 0.2
        }}
      />
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '45px', paddingRight: '20px', borderRight: '1px solid #F3F4F6' }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9CA3AF', fontWeight: '600' }}>
          {date.toLocaleDateString('en-GB', { month: 'short' })}
        </div>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#4B5563' }}>
          {date.getDate()}
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '15px', fontWeight: '600', color: '#1A1A1A', marginBottom: '2px' }}>{expense.description}</div>
        {expense.notes && <div style={{ fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic' }}>{expense.notes}</div>}
      </div>

      <div style={{
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        background: `${expense.category_color}26`, // 15% opacity
        color: expense.category_color
      }}>
        {expense.category_name}
      </div>

      <div style={{ fontSize: '16px', fontWeight: '700', color: '#1A1A1A', width: '100px', textAlign: 'right' }}>
        ₹{Number(expense.amount).toLocaleString('en-IN')}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onEdit} style={iconButtonStyle}><Pencil size={16} /></button>
        <button onClick={onDelete} style={{ ...iconButtonStyle, color: '#DC2626' }}><Trash2 size={16} /></button>
      </div>
    </div>
  );
};

const ExpenseForm = ({ expense, categories, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    const formData = new FormData(e.target);
    const data = {
      description: formData.get('description'),
      amount: formData.get('amount'),
      expense_date: formData.get('expense_date'),
      category_id: formData.get('category_id'),
      notes: formData.get('notes')
    };

    try {
      if (expense) {
        await updateExpense(expense.id, data.description, data.amount, data.expense_date, data.category_id, data.notes);
      } else {
        await addExpense(data.description, data.amount, data.expense_date, data.category_id, data.notes);
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '20px', color: '#1B4332' }}>
          {expense ? 'Edit Expense' : 'Add New Expense'}
        </h3>
        <X size={20} onClick={onClose} style={{ cursor: 'pointer', color: '#6B7280' }} />
      </div>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Description *</label>
          <input name="description" required defaultValue={expense?.description} style={inputStyle} placeholder="e.g. 5kg Goat Milk Base" />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Amount ₹ *</label>
            <input name="amount" type="number" step="0.01" required defaultValue={expense?.amount} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Date *</label>
            <input name="expense_date" type="date" required defaultValue={expense ? new Date(expense.expense_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} style={inputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Category *</label>
          <div style={{ position: 'relative' }}>
            <select name="category_id" required defaultValue={expense?.category_id} style={{ ...inputStyle, appearance: 'none' }}>
              <option value="">Select Category...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <ChevronDown size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280' }} />
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Notes</label>
          <textarea name="notes" rows={2} defaultValue={expense?.notes} style={inputStyle} placeholder="Add any extra details..." />
        </div>

        {error && <div style={{ color: '#DC2626', fontSize: '14px', marginBottom: '16px' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="submit" disabled={isSubmitting} style={primaryButtonStyle}>
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (expense ? 'Update Expense' : 'Save Expense')}
          </button>
          <button type="button" onClick={onClose} style={secondaryButtonStyle}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

const CategoriesPanel = ({ isOpen, onClose, categories, onRefresh }) => {
  const [editingId, setEditingId] = useState(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!newCatName) return;
    setIsSubmitting(true);
    await createCategory(newCatName, newCatColor);
    setNewCatName('');
    setIsSubmitting(false);
    onRefresh();
  };

  const handleUpdate = async (id, name, color) => {
    await updateCategory(id, name, color);
    setEditingId(null);
    onRefresh();
  };

  const handleDelete = async (id) => {
    try {
      await deleteCategory(id);
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, right: 0,
      width: '360px',
      height: '100vh',
      background: '#FFFFFF',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
      zIndex: 200,
      transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s ease-in-out',
      padding: '32px 24px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '22px', color: '#1B4332', margin: 0 }}>Categories</h2>
        <X size={24} onClick={onClose} style={{ cursor: 'pointer', color: '#6B7280' }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '24px' }}>
        {categories.map(cat => (
          <div key={cat.id} style={{ marginBottom: '16px', borderBottom: '1px solid #F3F4F6', paddingBottom: '16px' }}>
            {editingId === cat.id ? (
              <CategoryInlineForm 
                cat={cat} 
                onCancel={() => setEditingId(null)} 
                onSave={(name, color) => handleUpdate(cat.id, name, color)} 
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: cat.color }} />
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>{cat.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setEditingId(cat.id)} style={iconButtonStyle}><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(cat.id)} style={{ ...iconButtonStyle, color: '#DC2626' }}><Trash2 size={14} /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ background: '#F9FAFB', margin: '0 -24px -32px', padding: '24px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#6B7280', marginBottom: '12px' }}>Add New</div>
        <input 
          value={newCatName} 
          onChange={(e) => setNewCatName(e.target.value)}
          placeholder="Category name..."
          style={{ ...inputStyle, marginBottom: '12px' }}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {PRESET_COLORS.map(c => (
            <div 
              key={c}
              onClick={() => setNewCatColor(c)}
              style={{
                width: '20px', height: '20px', borderRadius: '50%', background: c, cursor: 'pointer',
                border: newCatColor === c ? '2px solid white' : 'none',
                boxShadow: newCatColor === c ? `0 0 0 2px ${c}` : 'none',
                transform: newCatColor === c ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.2s'
              }}
            />
          ))}
        </div>
        <button onClick={handleAdd} disabled={isSubmitting} style={{ ...primaryButtonStyle, width: '100%' }}>
          {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Add Category'}
        </button>
      </div>
    </div>
  );
};

const CategoryInlineForm = ({ cat, onCancel, onSave }) => {
  const [name, setName] = useState(cat.name);
  const [color, setColor] = useState(cat.color);
  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} style={{ ...inputStyle, marginBottom: '8px' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
        {PRESET_COLORS.map(c => (
          <div 
            key={c}
            onClick={() => setColor(c)}
            style={{
              width: '16px', height: '16px', borderRadius: '50%', background: c, cursor: 'pointer',
              border: color === c ? '2px solid white' : 'none',
              boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => onSave(name, color)} style={{ ...primaryButtonStyle, padding: '4px 12px', fontSize: '12px' }}>Save</button>
        <button onClick={onCancel} style={{ ...secondaryButtonStyle, padding: '4px 12px', fontSize: '12px' }}>Cancel</button>
      </div>
    </div>
  );
};

const BulkActionsBar = ({ selectedCount, categories, onCancel, onSuccess, ids }) => {
  const [showRename, setShowRename] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [showRecat, setShowRecat] = useState(false);

  const handleBulkRename = async () => {
    await bulkRenameExpenses(ids, newDesc);
    setShowRename(false);
    onSuccess();
  };

  const handleBulkRecat = async (catId) => {
    await bulkRecategoriseExpenses(ids, catId);
    setShowRecat(false);
    onSuccess();
  };

  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedCount} expenses?`)) {
      await bulkDeleteExpenses(ids);
      onSuccess();
    }
  };

  return (
    <div style={{ 
      background: '#F9F6F0', border: '1px solid #E5E7EB', borderRadius: '8px', 
      padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '16px' 
    }}>
      <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600' }}>{selectedCount} selected</span>
      
      {!showRename && !showRecat && (
        <>
          <button onClick={() => setShowRename(true)} style={actionButtonStyle}>Rename</button>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowRecat(!showRecat)} style={actionButtonStyle}>Move to Category <ChevronDown size={14} /></button>
          </div>
          <button onClick={handleBulkDelete} style={{ ...actionButtonStyle, color: '#DC2626' }}>Delete</button>
          <button onClick={onCancel} style={{ ...actionButtonStyle, marginLeft: 'auto' }}>Cancel</button>
        </>
      )}

      {showRename && (
        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
          <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="New description..." style={{ ...inputStyle, height: '32px' }} />
          <button onClick={handleBulkRename} style={primaryButtonStyle}>Save</button>
          <button onClick={() => setShowRename(false)} style={secondaryButtonStyle}>Cancel</button>
        </div>
      )}

      {showRecat && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => handleBulkRecat(cat.id)} style={{ ...filterPillStyle(false, cat.color), padding: '4px 12px' }}>{cat.name}</button>
          ))}
          <button onClick={() => setShowRecat(false)} style={secondaryButtonStyle}>Cancel</button>
        </div>
      )}
    </div>
  );
};

// --- Shared Styles ---

const primaryButtonStyle = {
  background: '#1B4332',
  color: '#FFFFFF',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '8px',
  fontWeight: '600',
  fontSize: '14px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontFamily: 'Plus Jakarta Sans, sans-serif'
};

const secondaryButtonStyle = {
  background: '#FFFFFF',
  color: '#374151',
  border: '1px solid #E5E7EB',
  padding: '8px 16px',
  borderRadius: '8px',
  fontWeight: '600',
  fontSize: '14px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontFamily: 'Plus Jakarta Sans, sans-serif'
};

const iconButtonStyle = {
  background: 'none',
  border: '1px solid #E5E7EB',
  padding: '6px',
  borderRadius: '6px',
  color: '#4B5563',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const actionButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '13px',
  fontWeight: '600',
  color: '#1B4332',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #E5E7EB',
  fontSize: '14px',
  fontFamily: 'Plus Jakarta Sans, sans-serif',
  outline: 'none',
};

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#6B7280',
  marginBottom: '8px',
  fontWeight: '600'
};

const filterPillStyle = (isActive, color) => ({
  padding: '6px 16px',
  borderRadius: '20px',
  fontSize: '13px',
  fontWeight: '600',
  cursor: 'pointer',
  fontFamily: 'Plus Jakarta Sans, sans-serif',
  whiteSpace: 'nowrap',
  transition: 'all 0.2s',
  border: isActive ? 'none' : '1px solid #E5E7EB',
  background: isActive ? color : '#FFFFFF',
  color: isActive ? '#FFFFFF' : color,
});

export default ExpensesClient;

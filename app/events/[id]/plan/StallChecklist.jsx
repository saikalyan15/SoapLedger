'use client';

import React, { useState, useTransition } from 'react';
import { Plus, X, CheckSquare, Square } from 'lucide-react';
import { addChecklistItemAction, toggleChecklistItemAction, deleteChecklistItemAction } from '@/lib/actions/events';

export default function StallChecklist({ eventId, initialChecklist }) {
  const [items, setItems] = useState(initialChecklist);
  const [newLabel, setNewLabel] = useState('');
  const [isPending, startTransition] = useTransition();

  const doneCount = items.filter((i) => i.is_done).length;

  const handleToggle = (item) => {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_done: !i.is_done } : i)));
    startTransition(async () => {
      await toggleChecklistItemAction(eventId, item.id, !item.is_done);
    });
  };

  const handleDelete = (itemId) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    startTransition(async () => {
      await deleteChecklistItemAction(eventId, itemId);
    });
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label) return;
    setNewLabel('');
    startTransition(async () => {
      const result = await addChecklistItemAction(eventId, label);
      if (result.itemId) {
        setItems((prev) => [...prev, { id: result.itemId, label, is_done: false }]);
      }
    });
  };

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-plus-jakarta font-bold text-[var(--color-primary)] text-sm uppercase tracking-wide">Stall setup checklist</h3>
        <span className="text-xs font-plus-jakarta text-[var(--color-muted)]">{doneCount}/{items.length} done</span>
      </div>
      <p className="text-xs font-plus-jakarta text-[var(--color-muted)] mb-3">Everything besides soaps — table, signage, payment, marketing. Add or remove whatever this event actually needs.</p>

      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 group py-1">
            <button onClick={() => handleToggle(item)} className="flex-shrink-0 text-[var(--color-primary)]">
              {item.is_done ? <CheckSquare size={18} /> : <Square size={18} className="text-gray-300" />}
            </button>
            <span className={`text-sm font-plus-jakarta flex-1 ${item.is_done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
              {item.label}
            </span>
            <button
              onClick={() => handleDelete(item.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
            >
              <X size={15} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-[var(--color-muted)] font-plus-jakarta py-2">No items yet — add what this stall needs below.</p>
        )}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Add an item…"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-plus-jakarta"
        />
        <button
          type="submit"
          disabled={isPending || !newLabel.trim()}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[var(--color-border)] rounded-lg text-sm font-semibold font-plus-jakarta disabled:opacity-50"
        >
          <Plus size={15} /> Add
        </button>
      </form>
    </div>
  );
}

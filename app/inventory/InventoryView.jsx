'use client';

import { useState } from 'react';
import { Plus, X, Pencil, Trash2, Droplets, Star } from 'lucide-react';
import {
  createEssentialOilAction,
  updateEssentialOilAction,
  deleteEssentialOilAction,
  toggleFrequentlyUsedAction,
} from '@/lib/actions/essential_oils';

const emptyForm = { name: '', notes: '', quantity_ml: '' };

export default function InventoryView({ oils }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOil, setEditingOil] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = (oil) => {
    setEditingOil(oil);
    setFormData({
      name: oil.name,
      notes: oil.notes || '',
      quantity_ml: oil.quantity_ml != null ? String(oil.quantity_ml) : '',
    });
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingOil(null);
    setFormData(emptyForm);
  };

  const handleDelete = async (oil) => {
    if (!confirm(`Delete "${oil.name}"? This cannot be undone.`)) return;
    const result = await deleteEssentialOilAction(oil.id);
    if (result.error) alert(result.error);
  };

  const handleToggleFrequent = async (oil) => {
    const result = await toggleFrequentlyUsedAction(oil.id, oil.is_frequently_used);
    if (result.error) alert(result.error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData();
    fd.set('name', formData.name.trim());
    fd.set('notes', formData.notes.trim());
    fd.set('quantity_ml', formData.quantity_ml);

    const result = editingOil
      ? await updateEssentialOilAction(editingOil.id, fd)
      : await createEssentialOilAction(fd);

    setIsSubmitting(false);
    if (result.error) {
      alert(result.error);
    } else {
      handleCancel();
    }
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="pt-[8px] flex justify-between items-start">
        <div>
          <h1 className="font-serif text-[28px] md:text-[36px] text-[#1B4332] font-normal leading-none m-0">
            Essential Oils
          </h1>
          <p className="font-sans text-[14px] text-[#6B7280] mt-[6px] m-0">
            Manage your oil inventory
          </p>
        </div>
        <button
          onClick={() => { setIsFormOpen(!isFormOpen); setEditingOil(null); setFormData(emptyForm); }}
          className="bg-[#1B4332] text-[#FFFFFF] font-sans text-[14px] font-semibold px-[16px] md:px-[24px] py-[10px] md:py-[12px] rounded-[10px] border-none cursor-pointer flex items-center gap-[8px] tracking-[0.01em] shadow-[0_2px_8px_rgba(27,67,50,0.25)]"
        >
          {isFormOpen && !editingOil ? <X size={16} /> : <Plus size={16} />}
          {isFormOpen && !editingOil ? 'Close' : 'Add Oil'}
        </button>
      </div>

      <div className="mt-[24px] md:mt-[32px] border-b-[2px] border-[#E5E7EB] mb-[24px] md:mb-[32px]" />

      {/* Form */}
      {isFormOpen && (
        <div className="bg-[#FAFDF9] border border-[#D8F3DC] rounded-[14px] p-[20px] md:p-[32px] mb-[32px] shadow-[0_2px_12px_rgba(27,67,50,0.08)]">
          <h2 className="font-serif text-[20px] md:text-[22px] text-[#1B4332] mb-[20px] md:mb-[24px] mt-0">
            {editingOil ? 'Edit Essential Oil' : 'Add New Essential Oil'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px] md:gap-[20px]">
              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">
                  Oil Name *
                </label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none"
                  placeholder="e.g. Lavender Essential Oil"
                />
              </div>

              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">
                  Quantity (ml) — optional
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.quantity_ml}
                  onChange={(e) => setFormData({ ...formData, quantity_ml: e.target.value })}
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none"
                  placeholder="e.g. 500"
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">
                  Notes — optional
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none resize-vertical"
                  placeholder="e.g. Used in floral range soaps, calming scent"
                />
              </div>
            </div>

            <div className="mt-[24px] flex flex-col md:flex-row gap-[12px] md:justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#1B4332] text-[#FFFFFF] font-sans text-[14px] font-semibold px-[24px] py-[12px] rounded-[10px] border-none cursor-pointer flex items-center gap-[8px] tracking-[0.01em] shadow-[0_2px_8px_rgba(27,67,50,0.25)] justify-center disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : editingOil ? 'Update Oil' : 'Save Oil'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-transparent border border-[#E5E7EB] text-[#6B7280] font-sans text-[14px] font-semibold px-[24px] py-[12px] rounded-[10px] cursor-pointer hover:bg-[#F9FAFB] m-0 order-first md:order-none"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Oils list */}
      {oils.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-[48px] text-center">
          <Droplets size={40} className="mx-auto mb-[16px] text-[#D1D5DB]" />
          <p className="font-sans text-[15px] text-[#6B7280] m-0">No essential oils added yet.</p>
          <p className="font-sans text-[13px] text-[#9CA3AF] mt-[6px] m-0">Add your first oil to get started.</p>
        </div>
      ) : (
        <div className="space-y-[10px]">
          {oils.map((oil) => (
            <div
              key={oil.id}
              className="bg-[#FFFFFF] border border-[#EBEBEB] rounded-[12px] px-[16px] md:px-[24px] py-[14px] md:py-[18px] flex flex-col md:flex-row md:items-center justify-between transition-all duration-[180ms] hover:border-[#D8F3DC]"
            >
              <div className="mb-[10px] md:mb-0">
                <div className="flex items-center gap-[8px]">
                  <Droplets size={15} className="text-[#1B4332] opacity-60 flex-shrink-0" />
                  <span className="font-sans text-[15px] font-semibold text-[#1A1A1A]">
                    {oil.name}
                  </span>
                  {oil.quantity_ml != null && (
                    <span className="bg-[#D8F3DC] text-[#1B4332] font-sans text-[10px] font-bold tracking-[0.06em] px-[10px] py-[3px] rounded-[20px] uppercase">
                      {oil.quantity_ml} ml
                    </span>
                  )}
                  {oil.is_frequently_used && (
                    <span className="bg-[#FEF9C3] text-[#A16207] font-sans text-[10px] font-bold tracking-[0.06em] px-[10px] py-[3px] rounded-[20px] uppercase flex items-center gap-1">
                      <Star size={10} fill="#A16207" /> Frequent
                    </span>
                  )}
                </div>
                {oil.notes && (
                  <p className="font-sans text-[13px] text-[#9CA3AF] mt-[4px] ml-[23px] m-0 line-clamp-1">
                    {oil.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-[8px]">
                <button
                  onClick={() => handleToggleFrequent(oil)}
                  title={oil.is_frequently_used ? 'Unmark as frequent' : 'Mark as frequent'}
                  className={`bg-transparent border font-sans text-[12px] font-semibold px-3 py-2 md:py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 ${
                    oil.is_frequently_used
                      ? 'border-[#FDE68A] text-[#A16207] hover:bg-[#FEF9C3]'
                      : 'border-[#E5E7EB] text-[#9CA3AF] hover:bg-[#F9FAFB]'
                  }`}
                >
                  <Star size={13} fill={oil.is_frequently_used ? '#A16207' : 'none'} />
                </button>
                <button
                  onClick={() => handleEdit(oil)}
                  className="bg-transparent border border-[#1B4332] text-[#1B4332] font-sans text-[12px] font-semibold px-[16px] py-[8px] md:py-[6px] rounded-[8px] cursor-pointer flex items-center gap-[6px]"
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(oil)}
                  className="bg-transparent border border-[#FEE2E2] text-[#B91C1C] font-sans text-[12px] font-semibold px-[16px] py-[8px] md:py-[6px] rounded-[8px] cursor-pointer flex items-center gap-[6px] hover:bg-[#FEF2F2]"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

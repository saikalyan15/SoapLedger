'use client';

import {
  createProductAction,
  toggleArchiveAction,
  updateProductAction,
  deleteProductAction,
  updateProductSequenceAction,
  updateFeaturedProductsAction,
  revalidateProductsAction,
} from '@/lib/actions/products';
import { saveProductOilsAction } from '@/lib/actions/essential_oils';
import {
  Archive,
  ArchiveRestore,
  ChevronRight,
  Download,
  LayoutList,
  Pencil,
  Plus,
  X,
  Trash2,
  GripVertical,
  Save,
  ArrowUpDown,
  RefreshCcw,
  Check,
  Star,
  Droplets,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const TEXTURE_LABELS = {
  'smooth': 'Smooth',
  'mildly-textured': 'Mildly Textured',
  'textured': 'Textured',
  'loofah': 'Loofah',
};

export default function ProductView({ products, allOils = [] }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isArchivedOpen, setIsArchivedOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSortMode, setIsSortMode] = useState(false);
  const [isFeaturedMode, setIsFeaturedMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReportMode, setIsReportMode] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [sortList, setSortList] = useState([]);
  const [featuredList, setFeaturedList] = useState([]);
  const [formData, setFormData] = useState({
    ingredients: '',
    slug: '',
    slugManuallyEdited: false,
    texture: '',
  });
  const [selectedOils, setSelectedOils] = useState([]);
  const [isOilsExpanded, setIsOilsExpanded] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const result = await revalidateProductsAction();
    setIsRefreshing(false);
    if (result.success) {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } else {
      alert(`Error refreshing products: ${result.error}`);
    }
  };

  const handleExportCSV = () => {
    const SITE_URL = 'https://healingsoil.in';
    const BRAND = 'Healing Soil';

    const csvEscape = (val) => {
      const str = val == null ? '' : String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };

    const headers = [
      'id', 'title', 'description', 'availability', 'condition',
      'price', 'link', 'image_link', 'brand', 'google_product_category',
      'sale_price', 'additional_image_link',
    ];

    const rows = activeProducts.map((p) => {
      const price = p.unit_price
        ? `${parseFloat(p.unit_price).toFixed(2)} INR`
        : '';
      const availability = p.in_stock ? 'in stock' : 'out of stock';
      const link = p.slug ? `${SITE_URL}/shop/${p.slug}` : SITE_URL;
      const description = p.short_description || p.name;

      // image_url is stored as a site-relative path ending .png, but the
      // storefront serves WebP and Google requires an absolute URL. Sending the
      // raw value gave Merchant Center a relative path pointing at a file that
      // no longer exists. WebP is an accepted image format for feeds.
      const imageLink = p.image_url
        ? `${SITE_URL}${p.image_url.replace(/\.(png|jpe?g)$/i, '.webp')}`
        : '';

      return [
        p.slug || p.id,
        p.name,
        description,
        availability,
        'new',
        price,
        link,
        imageLink,
        BRAND,
        'Health & Beauty > Personal Care > Skin Care',
        '',
        '',
      ].map(csvEscape).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `healing-soil-meta-catalog-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const buildSlug = (name) =>
    name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name' && !formData.slugManuallyEdited) {
      setFormData({ ...formData, name: value, slug: buildSlug(value) });
    } else if (name === 'slug') {
      setFormData({ ...formData, slug: value, slugManuallyEdited: true });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const buildSortList = () => {
    const activeOnes = products
      .filter((p) => p.is_active)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    return activeOnes.map(p => ({
      id: p.id,
      name: p.name,
      display_order: p.display_order || 0,
      base_type: p.base_type
    }));
  };

  const buildFeaturedList = () => {
    const activeOnes = products.filter((p) => p.is_active);
    const featured = activeOnes
      .filter(p => p.is_featured)
      .sort((a, b) => (a.featured_order ?? 999) - (b.featured_order ?? 999));
    const rest = activeOnes
      .filter(p => !p.is_featured)
      .sort((a, b) => a.name.localeCompare(b.name));

    return [...featured, ...rest].map((p, i) => ({
      id: p.id,
      name: p.name,
      base_type: p.base_type,
      is_featured: !!p.is_featured,
      featured_order: p.is_featured ? (p.featured_order ?? i + 1) : null,
    }));
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const activeProducts = products.filter((p) => p.is_active);
  const archivedProducts = products.filter((p) => !p.is_active);

  const groupedProducts = activeProducts.reduce((acc, product) => {
    const base = product.base_type || 'Other';
    if (!acc[base]) acc[base] = [];
    acc[base].push(product);
    return acc;
  }, {});

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      ingredients: product.ingredients || '',
      slug: product.slug || '',
      slugManuallyEdited: true, // editing existing — don't auto-overwrite slug
      texture: product.texture || '',
    });
    const linked = Array.isArray(product.linked_oils) ? product.linked_oils : [];
    setSelectedOils(linked.map(o => ({ essential_oil_id: o.id, is_default: o.is_default })));
    setIsOilsExpanded(false);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
    setFormData({ ingredients: '', slug: '', slugManuallyEdited: false, texture: '' });
    setSelectedOils([]);
    setIsOilsExpanded(false);
  };

  const handleSortChange = (id, newVal) => {
    const updated = sortList.map(item => 
      item.id === id ? { ...item, display_order: parseInt(newVal) || 0 } : item
    );
    // Auto-reorder in memory
    updated.sort((a, b) => a.display_order - b.display_order);
    setSortList(updated);
  };

  const saveSequence = async () => {
    const updates = sortList.map(item => ({ id: item.id, display_order: item.display_order }));
    await updateProductSequenceAction(updates);
    setIsSortMode(false);
  };

  const toggleFeatured = (id) => {
    setFeaturedList(prev => {
      const updated = prev.map(item => {
        if (item.id !== id) return item;
        const nowFeatured = !item.is_featured;
        return { ...item, is_featured: nowFeatured, featured_order: nowFeatured ? 99 : null };
      });
      // Re-sort: featured first (by featured_order), then unfeatured alphabetically
      const f = updated.filter(p => p.is_featured).sort((a, b) => (a.featured_order ?? 99) - (b.featured_order ?? 99));
      const u = updated.filter(p => !p.is_featured).sort((a, b) => a.name.localeCompare(b.name));
      return [...f, ...u];
    });
  };

  const handleFeaturedOrderChange = (id, val) => {
    setFeaturedList(prev => {
      const updated = prev.map(item =>
        item.id === id ? { ...item, featured_order: parseInt(val) || 1 } : item
      );
      const f = updated.filter(p => p.is_featured).sort((a, b) => (a.featured_order ?? 99) - (b.featured_order ?? 99));
      const u = updated.filter(p => !p.is_featured).sort((a, b) => a.name.localeCompare(b.name));
      return [...f, ...u];
    });
  };

  const saveFeatured = async () => {
    const updates = featuredList.map(item => ({
      id: item.id,
      is_featured: item.is_featured,
      featured_order: item.is_featured ? (item.featured_order ?? null) : null,
    }));
    await updateFeaturedProductsAction(updates);
    setIsFeaturedMode(false);
  };

  return (
    <div className="page-content" style={{ padding: isMobile ? '16px' : '0' }}>
      <div className="pt-[8px] flex justify-between items-start">
        <div>
          <h1 className="font-serif text-[28px] md:text-[36px] text-[#1B4332] font-normal leading-none m-0">
            Products
          </h1>
          <p className="font-sans text-[14px] text-[#6B7280] mt-[6px] m-0">
            Manage your soap range
          </p>
        </div>
        <div className="flex gap-[8px] md:gap-[12px]">
          <button
            onClick={handleExportCSV}
            className="font-sans text-[14px] font-semibold px-[16px] py-[10px] md:py-[12px] rounded-[10px] cursor-pointer flex items-center gap-[8px] tracking-[0.01em] shadow-[0_2px_8px_rgba(0,0,0,0.05)] bg-white text-[#4B5563] border border-[#E5E7EB] hover:bg-[#F9FAFB]"
          >
            <Download size={16} />
            {isMobile ? 'Export' : 'Meta Export'}
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`font-sans text-[14px] font-semibold px-[16px] py-[10px] md:py-[12px] rounded-[10px] cursor-pointer flex items-center gap-[8px] tracking-[0.01em] shadow-[0_2px_8px_rgba(0,0,0,0.05)] bg-white text-[#4B5563] border border-[#E5E7EB] hover:bg-[#F9FAFB] disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <RefreshCcw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing...' : isMobile ? 'Refresh' : 'Refresh Products'}
          </button>
          <button
            onClick={() => {
              if (!isFeaturedMode) setFeaturedList(buildFeaturedList());
              setIsFeaturedMode(!isFeaturedMode);
              setIsSortMode(false);
              setIsReportMode(false);
            }}
            className={`font-sans text-[14px] font-semibold px-[16px] py-[10px] md:py-[12px] rounded-[10px] cursor-pointer flex items-center gap-[8px] tracking-[0.01em] shadow-[0_2px_8px_rgba(0,0,0,0.05)] ${isFeaturedMode ? 'bg-[#4338CA] text-white border-none' : 'bg-white text-[#4B5563] border border-[#E5E7EB]'}`}
          >
            {isFeaturedMode ? <X size={16} /> : <Star size={16} />}
            {isFeaturedMode ? 'Cancel' : 'Featured'}
          </button>
          <button
            onClick={() => { setIsReportMode(!isReportMode); setIsSortMode(false); setIsFeaturedMode(false); }}
            className={`font-sans text-[14px] font-semibold px-[16px] py-[10px] md:py-[12px] rounded-[10px] cursor-pointer flex items-center gap-[8px] tracking-[0.01em] shadow-[0_2px_8px_rgba(0,0,0,0.05)] ${isReportMode ? 'bg-[#0F766E] text-white border-none' : 'bg-white text-[#4B5563] border border-[#E5E7EB]'}`}
          >
            {isReportMode ? <X size={16} /> : <LayoutList size={16} />}
            {isReportMode ? 'Cancel' : 'Report'}
          </button>
          <button
            onClick={() => {
              if (!isSortMode) setSortList(buildSortList());
              setIsSortMode(!isSortMode);
              setIsFeaturedMode(false);
              setIsReportMode(false);
            }}
            className={`font-sans text-[14px] font-semibold px-[16px] py-[10px] md:py-[12px] rounded-[10px] cursor-pointer flex items-center gap-[8px] tracking-[0.01em] shadow-[0_2px_8px_rgba(0,0,0,0.05)] ${isSortMode ? 'bg-[#111827] text-white border-none' : 'bg-white text-[#4B5563] border border-[#E5E7EB]'}`}
          >
            {isSortMode ? <X size={16} /> : <ArrowUpDown size={16} />}
            {isSortMode ? 'Cancel' : isMobile ? 'Sort' : 'Sort Mode'}
          </button>
          {!isSortMode && !isFeaturedMode && !isReportMode && (
            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="bg-[#1B4332] text-[#FFFFFF] font-sans text-[14px] font-semibold px-[16px] md:px-[24px] py-[10px] md:py-[12px] rounded-[10px] border-none cursor-pointer flex items-center gap-[8px] tracking-[0.01em] shadow-[0_2px_8px_rgba(27,67,50,0.25)] m-0"
            >
              {isFormOpen ? <X size={16} /> : <Plus size={16} />}
              {isFormOpen ? 'Close' : isMobile ? 'Add' : 'Add Product'}
            </button>
          )}
        </div>
      </div>

      <div className="mt-[24px] md:mt-[32px] border-b-[2px] border-[#E5E7EB] mb-[24px] md:mb-[32px]"></div>

      {isFeaturedMode ? (
        <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-[20px] md:p-[32px] mb-[32px] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex justify-between items-center mb-[24px]">
            <div>
              <h2 className="font-serif text-[20px] md:text-[22px] text-[#4338CA] m-0">
                Featured Products
              </h2>
              <p className="font-sans text-[13px] text-[#6B7280] mt-[4px] m-0">
                Toggle the star to feature a product on the website. Set order numbers to control display sequence.
              </p>
            </div>
            <button
              onClick={saveFeatured}
              className="bg-[#4338CA] text-white font-sans text-[14px] font-semibold px-[20px] py-[10px] rounded-[8px] border-none cursor-pointer flex items-center gap-[8px] shadow-[0_2px_8px_rgba(67,56,202,0.25)]"
            >
              <Save size={16} /> Save Changes
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[12px]">
            {featuredList.map((item) => (
              <div
                key={item.id}
                className={`border rounded-[10px] p-[16px] flex items-center justify-between transition-all duration-200 ${item.is_featured ? 'bg-[#EEF2FF] border-[#C7D2FE]' : 'bg-[#FAFAFA] border-[#E5E7EB]'}`}
              >
                <div className="flex items-center gap-[12px] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleFeatured(item.id)}
                    className="border-none bg-none p-0 cursor-pointer flex-shrink-0"
                    style={{ background: 'none' }}
                  >
                    <Star
                      size={20}
                      className={item.is_featured ? 'text-[#4338CA]' : 'text-[#D1D5DB]'}
                      fill={item.is_featured ? '#4338CA' : 'none'}
                    />
                  </button>
                  <div className="overflow-hidden">
                    <div className="font-sans text-[14px] font-semibold text-[#1A1A1A] truncate">
                      {item.name}
                    </div>
                    <div className="font-sans text-[11px] text-[#6B7280] uppercase tracking-wider">
                      {item.base_type}
                    </div>
                  </div>
                </div>
                {item.is_featured && (
                  <div className="flex items-center gap-[6px] flex-shrink-0">
                    <span className="font-sans text-[11px] text-[#6B7280]">#</span>
                    <input
                      type="number"
                      min="1"
                      value={item.featured_order ?? ''}
                      onChange={(e) => handleFeaturedOrderChange(item.id, e.target.value)}
                      className="w-[52px] px-[8px] py-[6px] border border-[#C7D2FE] rounded-[6px] font-sans text-[14px] text-center text-[#4338CA] font-bold outline-none focus:border-[#4338CA] bg-white"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : isSortMode ? (
        <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-[20px] md:p-[32px] mb-[32px] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex justify-between items-center mb-[24px]">
            <div>
              <h2 className="font-serif text-[20px] md:text-[22px] text-[#1B4332] m-0">
                Sequence Manager
              </h2>
              <p className="font-sans text-[13px] text-[#6B7280] mt-[4px] m-0">
                Change order numbers to re-sequence. The list re-orders instantly.
              </p>
            </div>
            <button
              onClick={saveSequence}
              className="bg-[#1B4332] text-white font-sans text-[14px] font-semibold px-[20px] py-[10px] rounded-[8px] border-none cursor-pointer flex items-center gap-[8px] shadow-[0_2px_8px_rgba(27,67,50,0.2)]"
            >
              <Save size={16} /> Save Changes
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[12px]">
            {sortList.map((item) => (
              <div 
                key={item.id}
                className="bg-[#FAFDF9] border border-[#D8F3DC] rounded-[10px] p-[16px] flex items-center justify-between transition-all duration-300"
              >
                <div className="flex items-center gap-[12px] overflow-hidden">
                  <div className="text-[#1B4332] opacity-30">
                    <GripVertical size={18} />
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-sans text-[14px] font-semibold text-[#1A1A1A] truncate">
                      {item.name}
                    </div>
                    <div className="font-sans text-[11px] text-[#6B7280] uppercase tracking-wider">
                      {item.base_type}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-[8px]">
                  <input
                    type="number"
                    value={item.display_order}
                    onChange={(e) => handleSortChange(item.id, e.target.value)}
                    className="w-[60px] px-[8px] py-[6px] border border-[#D8F3DC] rounded-[6px] font-sans text-[14px] text-center text-[#1B4332] font-bold outline-none focus:border-[#1B4332]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {isFormOpen && !isSortMode && !isFeaturedMode && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 overflow-y-auto flex items-start justify-center p-[16px] md:p-[32px]"
          onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
        >
        <div className="bg-[#FAFDF9] border border-[#D8F3DC] rounded-[14px] p-[20px] md:p-[32px] shadow-[0_8px_40px_rgba(27,67,50,0.18)] w-full max-w-[720px] my-[32px]">
          <h2 className="font-serif text-[20px] md:text-[22px] text-[#1B4332] mb-[20px] md:mb-[24px] mt-0">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h2>
          <form
            action={async (formData) => {
              if (editingProduct) {
                await updateProductAction(editingProduct.id, formData);
                await saveProductOilsAction(editingProduct.id, selectedOils);
              } else {
                const result = await createProductAction(formData);
                if (result?.id && selectedOils.length > 0) {
                  await saveProductOilsAction(result.id, selectedOils);
                }
              }
              handleCancel();
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px] md:gap-[20px]">
              {/* Basic Info */}
              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">
                  Product Name
                </label>
                <input
                  name="name"
                  value={formData.name ?? (editingProduct?.name || '')}
                  onChange={handleChange}
                  required
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[16px] md:text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none"
                  placeholder="e.g. Lavender Bliss"
                />
              </div>

              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">
                  Slug (URL)
                </label>
                <input
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[16px] md:text-[14px] text-[#9CA3AF] bg-[#FAFAFA] outline-none font-mono"
                  placeholder="auto-generated"
                />
              </div>


              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">
                  Base Type
                </label>
                <input
                  name="base_type"
                  defaultValue={editingProduct?.base_type}
                  required
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[16px] md:text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none"
                  placeholder="e.g. Glycerine"
                />
              </div>

              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">
                  Website Category
                </label>
                <input
                  name="category"
                  defaultValue={editingProduct?.category}
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[16px] md:text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none"
                  placeholder="e.g. Floral Collection"
                />
              </div>

              {/* Pricing and Weight */}
              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">
                  Unit Price (₹)
                </label>
                <input
                  name="unit_price"
                  type="number"
                  step="0.01"
                  defaultValue={editingProduct?.unit_price}
                  required
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[16px] md:text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none"
                  placeholder="250"
                />
              </div>

              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">
                  Price Range (for variants)
                </label>
                <input
                  name="price_range"
                  defaultValue={editingProduct?.price_range}
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[16px] md:text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none"
                  placeholder="e.g. ₹250 - ₹500"
                />
              </div>

              {/* Descriptions & Images */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">
                  Short Description
                </label>
                <textarea
                  name="short_description"
                  defaultValue={editingProduct?.short_description}
                  rows={2}
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none resize-vertical"
                  placeholder="Briefly describe this soap for the website catalogue..."
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">
                  ADDITIONAL INGREDIENTS
                </label>
                <textarea
                  name="ingredients"
                  value={formData.ingredients || ''}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none resize-vertical"
                  placeholder="e.g. Neem Extract, Tulsi Extract, Essential Oils"
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">
                  INTERNAL NOTES
                </label>
                <textarea
                  name="notes"
                  defaultValue={editingProduct?.notes || ''}
                  rows={3}
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none resize-vertical"
                  placeholder="e.g. essential oil recommendations, batch notes..."
                />
              </div>

              {/* Essential Oils Multi-Select */}
              <div style={{ gridColumn: '1 / -1' }}>
                  <div className="flex items-center justify-between mb-[10px]">
                    <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] flex items-center gap-[6px]">
                      <Droplets size={13} />
                      Essential Oils for this Product
                      {selectedOils.length > 0 && (
                        <span className="normal-case tracking-normal font-normal text-[#9CA3AF]">
                          ({selectedOils.length} selected)
                        </span>
                      )}
                    </label>
                    {allOils.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsOilsExpanded(v => !v)}
                        className="font-sans text-[11px] font-semibold text-[#1B4332] underline bg-transparent border-none cursor-pointer p-0"
                      >
                        {isOilsExpanded ? 'Collapse' : 'Edit'}
                      </button>
                    )}
                  </div>

                  {allOils.length === 0 ? (
                    <div className="border border-dashed border-[#E5E7EB] rounded-[8px] px-[14px] py-[14px] bg-[#FAFAFA] text-center">
                      <p className="font-sans text-[13px] text-[#9CA3AF] m-0">
                        No oils in inventory yet.{' '}
                        <a href="/inventory" className="text-[#1B4332] font-semibold underline">Add oils in Inventory</a>{' '}
                        first, then come back to link them.
                      </p>
                    </div>
                  ) : isOilsExpanded ? (
                  <div className="border border-[#E5E7EB] rounded-[8px] bg-white divide-y divide-[#F3F4F6] max-h-[220px] overflow-y-auto">
                    {allOils.map((oil) => {
                      const isChecked = selectedOils.some(o => o.essential_oil_id === oil.id);
                      const isDefault = selectedOils.some(o => o.essential_oil_id === oil.id && o.is_default);

                      const toggleOil = () => {
                        if (isChecked) {
                          setSelectedOils(prev => prev.filter(o => o.essential_oil_id !== oil.id));
                        } else {
                          setSelectedOils(prev => [...prev, { essential_oil_id: oil.id, is_default: false }]);
                        }
                      };

                      const setDefault = (e) => {
                        e.stopPropagation();
                        setSelectedOils(prev =>
                          prev.map(o => ({ ...o, is_default: o.essential_oil_id === oil.id }))
                        );
                      };

                      return (
                        <div
                          key={oil.id}
                          className={`flex items-center justify-between px-[14px] py-[10px] cursor-pointer transition-colors ${isChecked ? 'bg-[#F0FDF4]' : 'hover:bg-[#FAFAFA]'}`}
                          onClick={toggleOil}
                        >
                          <div className="flex items-center gap-[10px]">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={toggleOil}
                              onClick={e => e.stopPropagation()}
                              className="w-[16px] h-[16px] accent-[#1B4332] cursor-pointer"
                            />
                            <span className="font-sans text-[14px] text-[#1A1A1A]">{oil.name}</span>
                            {oil.quantity_ml != null && (
                              <span className="font-sans text-[11px] text-[#9CA3AF]">{oil.quantity_ml} ml</span>
                            )}
                          </div>
                          {isChecked && (
                            <button
                              type="button"
                              onClick={setDefault}
                              title={isDefault ? 'Default oil' : 'Set as default'}
                              className={`flex items-center gap-[4px] font-sans text-[11px] font-semibold px-[8px] py-[3px] rounded-[6px] border transition-colors ${isDefault ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#1B4332] hover:text-[#1B4332]'}`}
                            >
                              <Star size={11} fill={isDefault ? 'white' : 'none'} />
                              {isDefault ? 'Default' : 'Set default'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  ) : (
                    <div className="border border-[#E5E7EB] rounded-[8px] px-[14px] py-[10px] bg-white min-h-[42px] flex flex-wrap gap-[6px] items-center">
                      {selectedOils.length === 0 ? (
                        <span className="font-sans text-[13px] text-[#9CA3AF]">No oils selected</span>
                      ) : selectedOils.map((sel) => {
                        const oil = allOils.find(o => o.id === sel.essential_oil_id);
                        if (!oil) return null;
                        return (
                          <span
                            key={sel.essential_oil_id}
                            className={`inline-flex items-center gap-[4px] font-sans text-[12px] px-[8px] py-[3px] rounded-[20px] ${sel.is_default ? 'bg-[#D8F3DC] text-[#1B4332] font-semibold' : 'bg-[#F3F4F6] text-[#6B7280]'}`}
                          >
                            {sel.is_default && <Star size={10} fill="#1B4332" />}
                            {oil.name}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {isOilsExpanded && selectedOils.length > 0 && !selectedOils.some(o => o.is_default) && (
                    <p className="font-sans text-[12px] text-[#D97706] mt-[6px] m-0">
                      No default oil selected — tap Set default on one oil.
                    </p>
                  )}
                </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">
                  Image URL
                </label>
                <input
                  name="image_url"
                  defaultValue={editingProduct?.image_url}
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[16px] md:text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none"
                  placeholder="https://healingsoil.in/images/products/lavender.jpg"
                />
              </div>

              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">
                  Weight (g)
                </label>
                <input
                  name="weight_grams"
                  type="number"
                  defaultValue={editingProduct?.weight_grams}
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[16px] md:text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] mb-[6px] block">
                  Texture
                </label>
                <select
                  name="texture"
                  value={formData.texture || ''}
                  onChange={handleChange}
                  className="w-full px-[14px] py-[11px] border border-[#E5E7EB] rounded-[8px] font-sans text-[16px] md:text-[14px] text-[#1A1A1A] bg-[#FFFFFF] outline-none"
                >
                  <option value="">— unset (mixed) —</option>
                  <option value="smooth">Smooth — plain lather, no exfoliants</option>
                  <option value="mildly-textured">Mildly Textured — fine particles (oats, rice flour)</option>
                  <option value="textured">Textured — visible grit (neem powder, marigold petals)</option>
                  <option value="loofah">Loofah — embedded loofah, strong exfoliation</option>
                </select>
              </div>

              {/* Status Toggles */}
              <div className="flex flex-wrap gap-[20px] md:col-span-2 mt-[8px]">
                <div className="flex items-center gap-[10px]">
                  <input
                    id="in_stock"
                    name="in_stock"
                    type="checkbox"
                    defaultChecked={editingProduct ? editingProduct.in_stock : true}
                    className="w-[18px] h-[18px] accent-[#1B4332]"
                  />
                  <label htmlFor="in_stock" className="font-sans text-[14px] text-[#1A1A1A]">
                    In Stock
                  </label>
                </div>

                <div className="flex items-center gap-[10px]">
                  <input
                    id="is_featured"
                    name="is_featured"
                    type="checkbox"
                    defaultChecked={editingProduct?.is_featured}
                    className="w-[18px] h-[18px] accent-[#1B4332]"
                  />
                  <label htmlFor="is_featured" className="font-sans text-[14px] text-[#1A1A1A]">
                    Featured on Website
                  </label>
                </div>

                <div className="flex items-center gap-[10px]">
                  <input
                    id="is_wholesale_eligible"
                    name="is_wholesale_eligible"
                    type="checkbox"
                    defaultChecked={editingProduct ? editingProduct.is_wholesale_eligible !== false : true}
                    className="w-[18px] h-[18px] accent-[#1B4332]"
                  />
                  <label htmlFor="is_wholesale_eligible" className="font-sans text-[14px] text-[#1A1A1A]">
                    Wholesale Eligible
                  </label>
                </div>

                <div className="flex items-center gap-[10px]">
                  <input
                    id="is_gift"
                    name="is_gift"
                    type="checkbox"
                    defaultChecked={editingProduct?.is_gift}
                    className="w-[18px] h-[18px] accent-[#1B4332]"
                  />
                  <label htmlFor="is_gift" className="font-sans text-[14px] text-[#1A1A1A]">
                    Show in Gifts
                  </label>
                </div>

                <div className="flex items-center gap-[10px]">
                  <input
                    id="is_seasonal"
                    name="is_seasonal"
                    type="checkbox"
                    defaultChecked={editingProduct?.is_seasonal}
                    className="w-[18px] h-[18px] accent-[#1B4332]"
                  />
                  <label htmlFor="is_seasonal" className="font-sans text-[14px] text-[#1A1A1A]">
                    Seasonal Product
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-[24px] flex flex-col md:flex-row gap-[12px] md:justify-end">
              <button
                type="submit"
                className="bg-[#1B4332] text-[#FFFFFF] font-sans text-[14px] font-semibold px-[24px] py-[12px] rounded-[10px] border-none cursor-pointer flex items-center gap-[8px] tracking-[0.01em] shadow-[0_2px_8px_rgba(27,67,50,0.25)] justify-center"
              >
                {editingProduct ? 'Update Product' : 'Save Product'}
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
        </div>
      )}

      {!isSortMode && !isFeaturedMode && !isReportMode && (
        <div className="space-y-[32px] md:space-y-[40px]">
          {Object.entries(groupedProducts).map(([base, items]) => (
            <div key={base}>
              <div className="flex justify-between items-center mb-[12px]">
                <h3 className="font-serif text-[18px] text-[#1B4332] font-normal m-0">
                  {base}
                </h3>
                <span className="font-sans text-[12px] text-[#6B7280] bg-[#F3F4F6] px-[10px] py-[3px] rounded-[20px] font-medium m-0">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <div className="border-b-[1px] border-[#E5E7EB] mb-[16px]"></div>

              <div className="space-y-[10px]">
                {items.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleEdit(product)}
                    className="bg-[#FFFFFF] border border-[#EBEBEB] rounded-[12px] px-[16px] md:px-[24px] py-[14px] md:py-[18px] flex flex-col md:flex-row md:items-center justify-between transition-all duration-[180ms] hover:border-[#D8F3DC] hover:shadow-[0_2px_8px_rgba(27,67,50,0.06)] product-card cursor-pointer"
                  >
                    <div className="mb-[12px] md:mb-0">
                      <div className="flex items-center gap-2">
                        <div className="font-sans text-[15px] font-semibold text-[#1A1A1A] m-0">
                          {product.name}
                        </div>
                        {product.is_featured && (
                          <span className="bg-[#EEF2FF] text-[#4338CA] px-[6px] py-[1px] rounded text-[10px] font-bold uppercase">
                            Featured
                          </span>
                        )}
                        {product.is_gift && (
                          <span className="bg-[#FDF2F8] text-[#BE185D] px-[6px] py-[1px] rounded text-[10px] font-bold uppercase">
                            Gift
                          </span>
                        )}
                        {product.is_wholesale_eligible === false && (
                          <span className="bg-[#FEF3C7] text-[#92400E] px-[6px] py-[1px] rounded text-[10px] font-bold uppercase">
                            No Wholesale
                          </span>
                        )}
                        <span className="bg-[#F3F4F6] text-[#6B7280] px-[6px] py-[1px] rounded text-[10px] font-bold">
                          #{product.display_order || 0}
                        </span>
                      </div>
                      <div className="font-sans text-[13px] text-[#9CA3AF] mt-[4px] m-0">
                        {product.weight_grams ? `${product.weight_grams}g` : '-'}{' '}
                        • ₹{product.unit_price}
                        {product.slug && ` • /${product.slug}`}
                      </div>
                      {product.notes && (
                        <div className="mt-[4px] font-sans text-[11px] text-[#9CA3AF] leading-[1.4] line-clamp-1" title={product.notes}>
                          {product.notes}
                        </div>
                      )}
                      <div className="flex items-center gap-[5px] mt-[4px]">
                        <span className="font-sans text-[12px] text-[#6B7280]">
                          {TEXTURE_LABELS[product.texture] ?? 'Mixed'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-[12px]" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-[8px]">
                        {product.is_seasonal && (
                          <span className="bg-[#FEF3C7] text-[#92400E] font-sans text-[10px] font-bold tracking-[0.06em] px-[10px] py-[3px] rounded-[20px] uppercase m-0">
                            Seasonal
                          </span>
                        )}
                        {!product.in_stock ? (
                          <span className="bg-[#FEE2E2] text-[#B91C1C] font-sans text-[10px] font-bold tracking-[0.06em] px-[10px] py-[3px] rounded-[20px] uppercase m-0">
                            Out of Stock
                          </span>
                        ) : (
                          <span className="bg-[#D8F3DC] text-[#1B4332] font-sans text-[10px] font-bold tracking-[0.06em] px-[10px] py-[3px] rounded-[20px] uppercase m-0">
                            In Stock
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-[8px] product-actions">
                        <button
                          onClick={() => handleEdit(product)}
                          className="bg-transparent border border-[#1B4332] text-[#1B4332] font-sans text-[12px] font-semibold px-[16px] py-[8px] md:py-[6px] rounded-[8px] cursor-pointer flex items-center gap-[6px] flex-1 md:flex-none justify-center"
                        >
                          <Pencil size={13} /> Edit
                        </button>
                        <button
                          onClick={() => toggleArchiveAction(product.id)}
                          className="bg-transparent border border-[#E5E7EB] text-[#6B7280] font-sans text-[12px] font-semibold px-[16px] py-[8px] md:py-[6px] rounded-[8px] cursor-pointer flex items-center gap-[6px] flex-1 md:flex-none justify-center"
                        >
                          <Archive size={13} /> Archive
                        </button>
                        {product.order_count === 0 && (
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this product?')) {
                                deleteProductAction(product.id);
                              }
                            }}
                            className="bg-transparent border border-[#FEE2E2] text-[#B91C1C] font-sans text-[12px] font-semibold px-[16px] py-[8px] md:py-[6px] rounded-[8px] cursor-pointer flex items-center gap-[6px] flex-1 md:flex-none justify-center hover:bg-[#FEF2F2]"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isSortMode && !isFeaturedMode && !isReportMode && archivedProducts.length > 0 && (
        <div className="mt-[40px] md:mt-[48px]">
          <div
            onClick={() => setIsArchivedOpen(!isArchivedOpen)}
            className="flex items-center gap-[10px] font-sans text-[13px] font-semibold text-[#6B7280] cursor-pointer py-[12px] border-t-[1px] border-[#E5E7EB]"
          >
            <div
              className={`transition-transform duration-200 ${isArchivedOpen ? 'rotate-90' : ''}`}
            >
              <ChevronRight size={16} />
            </div>
            Archived ({archivedProducts.length})
          </div>

          {isArchivedOpen && (
            <div className="mt-[16px] space-y-[10px]">
              {archivedProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-[#FAFAFA] border border-[#EBEBEB] rounded-[12px] px-[16px] md:px-[24px] py-[14px] md:py-[18px] flex flex-col md:flex-row md:items-center justify-between opacity-60"
                >
                  <div className="mb-[10px] md:mb-0">
                    <div className="font-sans text-[15px] font-semibold text-[#1A1A1A] m-0">
                      {product.name}
                    </div>
                    <div className="font-sans text-[13px] text-[#9CA3AF] mt-[4px] m-0">
                      {product.base_type} • ₹{product.unit_price}
                    </div>
                  </div>
                  <div className="flex items-center gap-[8px]">
                    <button
                      onClick={() => toggleArchiveAction(product.id)}
                      className="bg-transparent border border-[#D8F3DC] text-[#1B4332] font-sans text-[12px] font-semibold px-[16px] py-[8px] md:py-[6px] rounded-[8px] cursor-pointer flex items-center gap-[6px] md:w-auto w-full justify-center"
                    >
                      <ArchiveRestore size={13} /> Restore
                    </button>
                    {product.order_count === 0 && (
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this product?')) {
                            deleteProductAction(product.id);
                          }
                        }}
                        className="bg-transparent border border-[#FEE2E2] text-[#B91C1C] font-sans text-[12px] font-semibold px-[16px] py-[8px] md:py-[6px] rounded-[8px] cursor-pointer flex items-center gap-[6px] md:w-auto w-full justify-center hover:bg-[#FEF2F2]"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isReportMode && (
        <div className="space-y-[32px] md:space-y-[40px]">
          {Object.entries(groupedProducts).map(([base, items]) => (
            <div key={base}>
              <div className="flex justify-between items-center mb-[12px]">
                <h3 className="font-serif text-[18px] text-[#1B4332] font-normal m-0">{base}</h3>
                <span className="font-sans text-[12px] text-[#6B7280] bg-[#F3F4F6] px-[10px] py-[3px] rounded-[20px] font-medium m-0">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <div className="border-b-[1px] border-[#E5E7EB] mb-[16px]"></div>

              <div className="space-y-[8px]">
                {/* Column headers — desktop only */}
                <div className="hidden md:grid md:grid-cols-[200px_1fr_2fr] gap-[20px] px-[20px] pb-[4px]">
                  <div className="font-sans text-[10px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">Product</div>
                  <div className="font-sans text-[10px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">Essential Oils</div>
                  <div className="font-sans text-[10px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">Internal Notes</div>
                </div>

                {items
                  .slice()
                  .sort((a, b) => (a.display_order || 0) - (b.display_order || 0) || a.name.localeCompare(b.name))
                  .map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleEdit(product)}
                    className="bg-white border border-[#EBEBEB] rounded-[12px] px-[16px] md:px-[20px] py-[14px] md:py-[16px] grid grid-cols-1 md:grid-cols-[200px_1fr_2fr] gap-[10px] md:gap-[20px] transition-all duration-[180ms] hover:border-[#A7F3D0] hover:shadow-[0_2px_8px_rgba(27,67,50,0.06)] cursor-pointer"
                  >
                    {/* Product name + meta */}
                    <div>
                      <div className="font-sans text-[14px] font-semibold text-[#1A1A1A] leading-snug">{product.name}</div>
                      <div className="font-sans text-[11px] text-[#6B7280] uppercase tracking-wider mt-[2px]">{product.base_type}</div>
                      <div className="font-sans text-[12px] text-[#9CA3AF] mt-[2px]">₹{product.unit_price}{product.weight_grams ? ` · ${product.weight_grams}g` : ''}</div>
                    </div>

                    {/* Essential oils */}
                    <div>
                      <div className="font-sans text-[10px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF] mb-[6px] md:hidden">Essential Oils</div>
                      {Array.isArray(product.linked_oils) && product.linked_oils.length > 0 ? (
                        <div className="flex flex-wrap gap-[5px]">
                          {product.linked_oils.map((oil) => (
                            <span
                              key={oil.id}
                              className={`inline-flex items-center gap-[3px] font-sans text-[12px] px-[8px] py-[3px] rounded-full border ${oil.is_default ? 'bg-[#F0FDF4] border-[#A7F3D0] text-[#1B4332] font-semibold' : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#4B5563]'}`}
                            >
                              {oil.is_default && <Star size={9} fill="#1B4332" className="text-[#1B4332]" />}
                              {oil.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="font-sans text-[12px] text-[#D1D5DB] italic">None linked</span>
                      )}
                    </div>

                    {/* Internal notes */}
                    <div>
                      <div className="font-sans text-[10px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF] mb-[6px] md:hidden">Internal Notes</div>
                      {product.notes ? (
                        <div className="font-sans text-[13px] text-[#4B5563] leading-[1.55] whitespace-pre-wrap">{product.notes}</div>
                      ) : (
                        <span className="font-sans text-[12px] text-[#D1D5DB] italic">No notes</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Success Notification */}
      {showNotification && (
        <div className="fixed bottom-[24px] left-1/2 -translate-x-1/2 z-[1000] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#1B4332] text-white px-[24px] py-[12px] rounded-[12px] shadow-[0_4px_20px_rgba(27,67,50,0.3)] flex items-center gap-[10px]">
            <div className="bg-white/20 p-[4px] rounded-full text-white">
              <Check size={16} strokeWidth={3} />
            </div>
            <span className="font-sans text-[14px] font-semibold">Product Refresh was successful</span>
          </div>
        </div>
      )}
    </div>
  );
}

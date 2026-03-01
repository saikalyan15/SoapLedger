'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  User, Phone, ChevronDown, Plus, X, 
  ShoppingBag, Loader2, CheckCircle2 
} from 'lucide-react';
import { submitOrderAction } from '@/lib/actions/orders';
import { useRouter } from 'next/navigation';
import { 
  DEFAULT_PACKAGING_COST, 
  FREE_SHIPPING_THRESHOLD, 
  SHIPPING_CHARGE_BELOW,
  ORDER_STATUSES 
} from '@/lib/constants';

export default function OrderForm({ products, settings }) {
  const router = useRouter();
  
  // Using centralized constants
  const FREE_SHIPPING = FREE_SHIPPING_THRESHOLD;
  const SHIPPING_FEE = SHIPPING_CHARGE_BELOW;
  const DEFAULT_PACKAGING = settings.default_packaging_cost !== undefined ? parseFloat(settings.default_packaging_cost) : DEFAULT_PACKAGING_COST;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState(ORDER_STATUSES[0]);
  const [items, setItems] = useState([{ product_id: '', quantity: 1, unit_price: 0 }]);
  const [packagingCost, setPackagingCost] = useState(DEFAULT_PACKAGING);
  const [materialCost, setMaterialCost] = useState(0);
  const [notes, setNotes] = useState('');
  
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [manualShipping, setManualShipping] = useState(null);

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const autoShipping = (subtotal >= FREE_SHIPPING || subtotal === 0) ? 0 : SHIPPING_FEE;
  const shippingCharge = manualShipping !== null ? manualShipping : autoShipping;
  const orderValue = subtotal;
  const estProfit = orderValue - packagingCost - materialCost;

  const groupedProducts = products.reduce((acc, p) => {
    const base = p.base_type || 'Other';
    if (!acc[base]) acc[base] = [];
    acc[base].push(p);
    return acc;
  }, {});

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (name.length >= 2 && !isSearching) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/customers/search?name=${encodeURIComponent(name)}`);
          const data = await res.json();
          setSearchResults(data);
          setShowResults(true);
        } catch (e) { console.error(e); } finally { setIsSearching(false); }
      } else { setSearchResults([]); }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [name]);

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectCustomer = (c) => {
    setName(c.name);
    setPhone(c.phone);
    setAddress(c.address || '');
    setShowResults(false);
  };

  const addItem = () => setItems([...items, { product_id: '', quantity: 1, unit_price: 0 }]);
  const removeItem = (i) => items.length > 1 && setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (index, field, value) => {
    const newItems = [...items];
    if (field === 'product_id') {
      const p = products.find(prod => prod.id === value);
      newItems[index] = { ...newItems[index], product_id: value, unit_price: p ? parseFloat(p.unit_price) : 0 };
    } else { newItems[index][field] = value; }
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await submitOrderAction({
        customerName: name, phone, address, orderDate, status,
        items: items.filter(i => i.product_id),
        orderValue, shippingCharge, packagingCost, materialCost, notes
      });
      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => router.push('/orders'), 1500);
      }
    } catch (err) { alert("Submission failed"); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="pb-32 max-w-[680px] mx-auto">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-[36px] text-primary font-normal leading-none m-0 font-serif">New Order</h1>
        <p className="text-sm text-muted mt-1.5 m-0 font-sans">Log an order from WhatsApp history</p>
      </div>

      <div className="mt-8 border-b-2 border-border mb-8"></div>

      <form onSubmit={handleSubmit} className="animate-in fade-in duration-500">
        {/* SECTION 1: CUSTOMER */}
        <div className="mb-7">
          <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted mb-4 block font-sans">Customer</label>
          <div className="space-y-5">
            <div className="relative" ref={searchRef}>
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-1.5 block font-sans">Customer Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-[50%] -translate-y-[50%] text-muted opacity-50" />
                <input 
                  autoFocus required value={name} 
                  onChange={(e) => {
                    const newVal = e.target.value;
                    setName(newVal);
                    if (newVal.length === 0) {
                      setPhone('');
                      setAddress('');
                    }
                  }}
                  onFocus={() => name.length >= 2 && setShowResults(true)}
                  className="w-full pl-10 pr-3.5 py-[11px] border border-border rounded-lg text-sm text-[#1A1A1A] outline-none transition-all duration-150 focus:border-primary focus:ring-[3px] focus:ring-primary/10 bg-white font-sans"
                  placeholder="Type to search existing or enter new..."
                />
                {isSearching && <Loader2 size={16} className="absolute right-3.5 top-[50%] -translate-y-[50%] animate-spin text-primary" />}
              </div>
              {showResults && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-lg shadow-xl overflow-hidden font-sans">
                  {searchResults.map(c => (
                    <div key={c.id} onClick={() => selectCustomer(c)} className="px-4 py-3 hover:bg-[#FAFDF9] cursor-pointer border-b border-[#F3F4F6] last:border-0 group">
                      <div className="text-sm font-semibold text-primary">{c.name}</div>
                      <div className="text-[12px] text-muted mt-0.5">{c.phone}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-1.5 block font-sans">WhatsApp Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-[50%] -translate-y-[50%] text-muted opacity-50" />
                <input 
                  required value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-[11px] border border-border rounded-lg text-sm text-[#1A1A1A] outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-primary/10 bg-white font-sans"
                  placeholder="e.g. 9876543210"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-1.5 block font-sans">Delivery Address (optional)</label>
              <textarea 
                rows={3} value={address} onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-[11px] border border-border rounded-lg text-sm text-[#1A1A1A] outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-primary/10 placeholder:text-muted/50 bg-white font-sans"
                placeholder="Add later when ready to dispatch"
              />
            </div>
          </div>
        </div>

        <div className="my-7 border-b border-border"></div>

        {/* SECTION 2: ORDER DETAILS */}
        <div className="mb-7">
          <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted mb-4 block font-sans">Order Details</label>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-1.5 block font-sans">Order Date</label>
              <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className="w-full px-3.5 py-[11px] border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 bg-white font-sans" />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-1.5 block font-sans">Status</label>
              <div className="relative">
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3.5 py-[11px] border border-border rounded-lg text-sm outline-none appearance-none bg-white focus:border-primary focus:ring-[3px] focus:ring-primary/10 font-sans">
                  {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3.5 top-[50%] -translate-y-[50%] text-muted pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="my-7 border-b border-border"></div>

        {/* SECTION 3: LINE ITEMS */}
        <div className="mb-7">
          <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted mb-4 block font-sans">Soaps Ordered</label>
          <div className="bg-[#FAFDF9] border border-primary-light rounded-xl p-6 space-y-5 shadow-[0_2px_12px_rgba(27,67,50,0.08)] font-sans">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-end animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-muted opacity-50 uppercase mb-1 block">Product</label>
                  <div className="relative">
                    <select required value={item.product_id} onChange={(e) => updateItem(idx, 'product_id', e.target.value)} className="w-full px-3 py-2.5 border border-border rounded-lg text-[13px] outline-none appearance-none bg-white focus:border-primary">
                      <option value="">Select soap...</option>
                      {Object.entries(groupedProducts).map(([base, products]) => (
                        <optgroup key={base} label={base.toUpperCase()}>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} — ₹{parseFloat(p.unit_price).toFixed(2)}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-[50%] -translate-y-[50%] text-muted pointer-events-none" />
                  </div>
                </div>
                <div className="w-20">
                  <label className="text-[10px] font-bold text-muted opacity-50 uppercase mb-1 block">Qty</label>
                  <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value)||0)} className="w-full px-2.5 py-2.5 border border-border rounded-lg text-[13px] text-center outline-none focus:border-primary" />
                </div>
                <div className="w-[100px]">
                  <label className="text-[10px] font-bold text-muted opacity-50 uppercase mb-1 block">Price</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-[50%] -translate-y-[50%] text-[13px] text-muted opacity-50">₹</span>
                    <input type="number" value={item.unit_price} onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value)||0)} className="w-full pl-6 pr-2.5 py-2.5 border border-border rounded-lg text-[13px] outline-none focus:border-primary" />
                  </div>
                </div>
                <div className="w-[100px] text-right mb-2.5">
                  <div className="text-[10px] font-bold text-muted opacity-50 uppercase mb-1">Total</div>
                  <div className="font-bold text-primary text-sm">₹{(item.quantity*item.unit_price).toFixed(2)}</div>
                </div>
                <div className="mb-1.5">
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="p-2 text-muted opacity-50 hover:text-danger hover:opacity-100 transition-colors cursor-pointer border-none bg-transparent">
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            <button type="button" onClick={addItem} className="mt-2 flex items-center gap-2 text-primary text-sm font-semibold hover:opacity-70 transition-all border-none bg-transparent cursor-pointer p-0 font-sans">
              <Plus size={16} /> Add Another Soap
            </button>
            
            <div className="mt-8 bg-bg border border-border rounded-lg p-5 space-y-3 shadow-inner">
              <div className="flex justify-between items-center text-sm"><span className="text-muted">Subtotal</span><span className="font-semibold text-[#1A1A1A]">₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex flex-col"><span className="text-muted">Shipping Charge</span>{manualShipping===null && <span className="text-[10px] text-primary/60">(auto-applied)</span>}</div>
                <div className="flex items-center gap-2">
                  <span className="text-muted opacity-50">₹</span>
                  <input type="number" value={shippingCharge} onChange={(e)=>setManualShipping(parseFloat(e.target.value)||0)} className="w-20 bg-transparent border-b border-border text-right text-[14px] font-semibold outline-none focus:border-primary transition-all" />
                </div>
              </div>
              <div className="pt-4 border-t border-border flex justify-between items-center font-bold text-primary"><span>Order Value</span><span className="text-xl">₹{orderValue.toFixed(2)}</span></div>
            </div>
          </div>
        </div>

        <div className="my-7 border-b border-border"></div>

        {/* SECTION 4: COST TRACKING */}
        <div className="mb-7 font-sans">
          <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted mb-4 block">Cost Tracking</label>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-1.5 block">Packaging Cost ₹</label>
              <input type="number" value={packagingCost} onChange={(e)=>setPackagingCost(parseFloat(e.target.value)||0)} className="w-full px-3.5 py-[11px] border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 bg-white" />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-1.5 block">Material Cost ₹</label>
              <input type="number" value={materialCost} onChange={(e)=>setMaterialCost(parseFloat(e.target.value)||0)} className="w-full px-3.5 py-[11px] border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 bg-white" />
            </div>
          </div>
        </div>

        {/* SECTION 5: NOTES */}
        <div className="mb-10 font-sans">
          <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-1.5 block">Notes (optional)</label>
          <textarea rows={3} value={notes} onChange={(e)=>setNotes(e.target.value)} className="w-full px-3.5 py-[11px] border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 bg-white" placeholder="Special instructions, Instagram handle..." />
        </div>

        {/* SUBMIT */}
        <button 
          disabled={isSubmitting||isSuccess} 
          className={`w-full h-[52px] rounded-[10px] text-base font-semibold text-white flex items-center justify-center gap-3 shadow-[0_2px_8px_rgba(27,67,50,0.25)] transition-all border-none cursor-pointer font-sans ${isSuccess ? 'bg-[#10B981]' : 'bg-primary hover:bg-[#2D6A4F] active:scale-[0.99] disabled:opacity-50'}`}
        >
          {isSubmitting ? <><Loader2 size={20} className="animate-spin" /> Saving...</> : isSuccess ? <><CheckCircle2 size={20} /> Order Saved!</> : <><ShoppingBag size={18} /> Save Order</>}
        </button>
      </form>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, Check, Plus, Trash2, ChevronDown, 
  Search, UserPlus, UserCheck, AlertCircle, Loader2, X, Clock, Printer, Package, MapPin
} from 'lucide-react';
import { createOrderAction, updateOrderAction } from '@/lib/actions/orders';
import { ORDER_STATUSES, ORDER_SOURCES } from '@/lib/constants';

const OrderForm = ({ products, settings, initialData = null }) => {
  const router = useRouter();
  const isEdit = !!initialData;
  const isPendingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Customer State
  const [customer, setCustomer] = useState({
    id: initialData?.order?.customer_id || '',
    name: initialData?.order?.customer_name || '',
    phone: initialData?.order?.customer_phone || '',
    address: initialData?.order?.customer_address || '',
    isExisting: !!initialData?.order?.customer_id
  });

  // Shipments State
  const [shipments, setShipments] = useState(() => {
    if (initialData?.shipments && initialData.shipments.length > 0) {
      return initialData.shipments.map(s => ({
        id: s.id,
        label: s.label,
        address_text: s.address_text,
        status: s.status
      }));
    }
    return [{ label: 'Primary Shipment', address_text: customer.address, status: 'Order Placed' }];
  });

  // Sync primary shipment address with customer address if it hasn't been manually edited
  useEffect(() => {
    if (shipments.length === 1 && shipments[0].label === 'Primary Shipment') {
      const newShipments = [...shipments];
      newShipments[0].address_text = customer.address;
      setShipments(newShipments);
    }
  }, [customer.address]);

  // Items State
  const [items, setItems] = useState(() => {
    if (initialData?.items) {
      return initialData.items.map(item => {
        // Find shipment index based on shipment_id
        const sIndex = initialData.shipments?.findIndex(s => s.id === item.shipment_id);
        return {
          product_id: item.product_id,
          quantity: parseInt(item.quantity) || 0,
          unit_price: parseFloat(item.unit_price) || 0,
          total_price: (parseInt(item.quantity) || 0) * (parseFloat(item.unit_price) || 0),
          shipmentIndex: sIndex !== -1 ? sIndex : 0
        };
      });
    }
    return [{ product_id: '', quantity: 1, unit_price: 0, total_price: 0, shipmentIndex: 0 }];
  });

  const [orderDate, setOrderDate] = useState(
    initialData?.order?.order_date 
      ? new Date(initialData.order.order_date).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );
  const [status, setStatus] = useState(initialData?.order?.status || 'Order Placed');
  const [shipping, setShipping] = useState(Number(initialData?.order?.shipping_charge) || 0);
  const [packaging, setPackaging] = useState(Number(initialData?.order?.packaging_cost) || (settings?.default_packaging_cost || 0));
  const [customization, setCustomization] = useState(Number(initialData?.order?.customization_amount) || 0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState(initialData?.order?.notes || '');
  const [source, setSource] = useState(initialData?.order?.source || '');

  // Initial discount calculation for edit mode
  useEffect(() => {
    if (isEdit) {
      const initialSubtotal = items.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0);
      const initialRevenue = Number(initialData?.order?.revenue || 0);
      const initialCustomization = Number(initialData?.order?.customization_amount) || 0;
      setDiscount(Math.max(0, initialSubtotal + shipping + initialCustomization - initialRevenue));
    }
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        const res = await fetch(`/api/customers/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data.customers || []);
        setShowResults(true);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  useEffect(() => {
    if (customer.id) {
      fetch(`/api/customers/${customer.id}/orders`)
        .then(res => res.json())
        .then(data => setCustomerOrders(data.orders || []));
    }
  }, [customer.id]);

  const handleSelectCustomer = async (c) => {
    setCustomer({ id: c.id, name: c.name, phone: c.phone, address: c.address || '', isExisting: true });
    
    // Fetch saved addresses for this customer
    try {
      const res = await fetch(`/api/customers/${c.id}/addresses`);
      const data = await res.json();
      if (data.addresses && data.addresses.length > 0) {
        setShipments([{ 
          label: data.addresses[0].label || 'Primary Shipment', 
          address_text: data.addresses[0].address_text, 
          status: 'Order Placed' 
        }]);
      }
    } catch (err) {
      console.error('Failed to fetch customer addresses:', err);
    }
    
    setSearchQuery('');
    setShowResults(false);
  };

  const resetCustomer = () => {
    setCustomer({ id: '', name: '', phone: '', address: '', isExisting: false });
    setSearchQuery('');
  };

  const addShipment = () => {
    setShipments([...shipments, { 
      label: `Shipment ${shipments.length + 1}`, 
      address_text: '', 
      status: 'Order Placed' 
    }]);
  };

  const removeShipment = (index) => {
    if (shipments.length > 1) {
      const newShipments = shipments.filter((_, i) => i !== index);
      // Move items from deleted shipment back to primary (0)
      const newItems = items.map(item => ({
        ...item,
        shipmentIndex: item.shipmentIndex === index ? 0 : (item.shipmentIndex > index ? item.shipmentIndex - 1 : item.shipmentIndex)
      }));
      setShipments(newShipments);
      setItems(newItems);
    }
  };

  const addItem = () => {
    setItems([...items, { product_id: '', quantity: 1, unit_price: 0, total_price: 0, shipmentIndex: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    const item = { ...newItems[index] };
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      item.product_id = value;
      item.unit_price = product ? parseFloat(product.unit_price) : 0;
    } else if (field === 'quantity') {
      item.quantity = parseInt(value) || 0;
    } else if (field === 'unit_price') {
      item.unit_price = parseFloat(value) || 0;
    } else if (field === 'shipmentIndex') {
      item.shipmentIndex = parseInt(value);
    }
    item.total_price = item.quantity * item.unit_price;
    newItems[index] = item;
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0);
  const orderValue = Math.max(0, subtotal - parseFloat(discount || 0) + parseFloat(shipping || 0) + parseFloat(customization || 0));

  useEffect(() => {
    if (!isEdit) {
      setShipping(subtotal >= (settings?.free_shipping_threshold || 1000) ? 0 : (settings?.shipping_charge_below || 100));
    }
  }, [subtotal, settings, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isPendingRef.current) return;
    if (!customer.name || !customer.phone) return alert("Please provide customer name and phone");
    if (items.some(item => !item.product_id || item.quantity <= 0)) return alert("Please complete all product lines");

    isPendingRef.current = true;
    setIsSubmitting(true);

    const orderData = {
      order_date: orderDate,
      status,
      shipping_charge: parseFloat(shipping || 0),
      packaging_cost: parseFloat(packaging || 0),
      customization_amount: parseFloat(customization || 0),
      order_value: parseFloat(orderValue || 0),
      source: source || null,
      notes,
      shipments: shipments // Pass shipments to action
    };

    try {
      let result;
      if (isEdit) {
        result = await updateOrderAction(initialData.order.id, customer, orderData, items);
      } else {
        result = await createOrderAction(customer, orderData, items);
      }

      if (result.success) {
        setIsSaved(true);
        setTimeout(() => {
          router.push(isEdit ? `/orders/${initialData.order.id}` : '/orders');
          router.refresh();
        }, 800);
      } else {
        alert(result.error || "Something went wrong");
        isPendingRef.current = false;
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred");
      isPendingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const cardStyle = { background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: isMobile ? '20px' : '32px', marginBottom: '24px' };
  const sectionTitleStyle = { fontFamily: 'DM Serif Display, serif', fontSize: isMobile ? '18px' : '20px', color: '#1B4332', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' };
  const inputBaseStyle = { width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: isMobile ? '16px' : '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: isMobile ? '28px' : '32px', color: '#1B4332', margin: '0 0 8px 0' }}>{isEdit ? 'Edit Order' : 'New Order'}</h1>
        <p style={{ color: '#6B7280', fontSize: '14px' }}>Manage items and destinations for this order.</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Customer & Primary Address */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}><Search size={20} /> Customer Information</div>
          
          {!customer.isExisting && !isEdit ? (
            <div style={{ position: 'relative', marginBottom: '20px' }} ref={searchRef}>
              <div style={{ position: 'relative' }}>
                <input type="text" placeholder="Search existing customer..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ ...inputBaseStyle, paddingLeft: '44px' }} />
                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              </div>
              {showResults && searchResults.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', marginTop: '4px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', zIndex: 50 }}>
                  {searchResults.map(c => (
                    <div key={c.id} onClick={() => handleSelectCustomer(c)} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }}>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{c.name}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>{c.phone}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between' }}>
              <div><div style={{ fontWeight: '700', fontSize: '16px' }}>{customer.name}</div><div>{customer.phone}</div></div>
              {!isEdit && <button type="button" onClick={resetCustomer} style={{ background: 'none', border: 'none', color: '#DC2626', fontWeight: '600', cursor: 'pointer' }}>Change</button>}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div><label style={labelStyle}>Name</label><input type="text" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} style={inputBaseStyle} required disabled={customer.isExisting} /></div>
            <div><label style={labelStyle}>Phone</label><input type="text" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} style={inputBaseStyle} required /></div>
          </div>
          <label style={labelStyle}>Primary Address</label>
          <textarea value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} placeholder="Default delivery address..." rows={2} style={{ ...inputBaseStyle, resize: 'none' }} />
        </div>

        {/* Shipments Section */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ ...sectionTitleStyle, marginBottom: 0 }}><Package size={20} /> Shipping Destinations</div>
            <button type="button" onClick={addShipment} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#D8F3DC', color: '#1B4332', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
              <Plus size={16} /> Add Address
            </button>
          </div>

          {shipments.map((s, idx) => (
            <div key={idx} style={{ padding: '16px', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '16px', background: idx === 0 ? '#F9FAFB' : '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#1B4332' }}>{s.label}</div>
                {idx > 0 && <button type="button" onClick={() => removeShipment(idx)} style={{ color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>}
              </div>
              <textarea 
                value={s.address_text} 
                onChange={(e) => {
                  const newShipments = [...shipments];
                  newShipments[idx].address_text = e.target.value;
                  setShipments(newShipments);
                }}
                placeholder="Enter destination address..."
                rows={2}
                style={{ ...inputBaseStyle, fontSize: '13px' }}
                required
              />
            </div>
          ))}
        </div>

        {/* Products Section */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ ...sectionTitleStyle, marginBottom: 0 }}><ShoppingBag size={20} /> Order Items</div>
            <button type="button" onClick={addItem} style={{ color: '#1B4332', background: 'none', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={14} /> Add Soap
            </button>
          </div>

          {items.map((item, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 80px 100px 1.5fr 40px', gap: '12px', marginBottom: '16px', alignItems: 'end' }}>
              <div>
                <label style={labelStyle}>Product</label>
                <select value={item.product_id} onChange={(e) => updateItem(index, 'product_id', e.target.value)} style={inputBaseStyle} required>
                  <option value="">Select...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Qty</label><input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} style={inputBaseStyle} required /></div>
              <div><label style={labelStyle}>Price</label><input type="number" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', e.target.value)} style={inputBaseStyle} required /></div>
              <div>
                <label style={labelStyle}>Send To</label>
                <select value={item.shipmentIndex} onChange={(e) => updateItem(index, 'shipmentIndex', e.target.value)} style={{ ...inputBaseStyle, background: '#F3F4F6' }}>
                  {shipments.map((s, sIdx) => <option key={sIdx} value={sIdx}>{s.label}</option>)}
                </select>
              </div>
              <button type="button" onClick={() => removeItem(index)} disabled={items.length === 1} style={{ padding: '12px', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
            </div>
          ))}

          {items.length > 2 && (
            <button type="button" onClick={addItem} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px dashed #A7F3D0', background: '#F0FDF4', color: '#1B4332', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px' }}>
              <Plus size={16} /> Add Soap
            </button>
          )}
        </div>

        {/* Source & Notes */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Order Details</div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Order Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              style={inputBaseStyle}
            >
              <option value="">Select source...</option>
              {ORDER_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special instructions, packaging preferences, etc..."
              rows={3}
              style={{ ...inputBaseStyle, resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Pricing Summary */}
        <div style={{ ...cardStyle, background: '#1B4332', color: '#FFFFFF' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr 1fr', gap: '20px' }}>
            <div><label style={{ ...labelStyle, color: '#FFFFFF' }}>Shipping (₹)</label><input type="number" value={shipping} onChange={(e) => setShipping(e.target.value)} style={{ ...inputBaseStyle, background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.2)' }} /></div>
            <div><label style={{ ...labelStyle, color: '#FFFFFF' }}>Customization (₹)</label><input type="number" value={customization} onChange={(e) => setCustomization(e.target.value)} style={{ ...inputBaseStyle, background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.2)' }} /></div>
            <div><label style={{ ...labelStyle, color: '#FFFFFF' }}>Discount (₹)</label><input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} style={{ ...inputBaseStyle, background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.2)' }} /></div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>Total Order Value</div>
              <div style={{ fontSize: '32px', fontWeight: '800' }}>₹{orderValue.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginBottom: '80px' }}>
          <button type="button" onClick={() => router.back()} style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FFFFFF', cursor: 'pointer' }}>Cancel</button>
          <button type="submit" disabled={isSubmitting} style={{ padding: '12px 40px', borderRadius: '8px', border: 'none', background: isSaved ? '#2D6A4F' : '#1B4332', color: '#FFFFFF', fontWeight: '700', cursor: 'pointer', opacity: isSubmitting && !isSaved ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }}>
            {isSaved ? <><Check size={18} /> Order Saved!</> : isSubmitting ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;

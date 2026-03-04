'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, Check, Plus, Trash2, ChevronDown, 
  Search, UserPlus, UserCheck, AlertCircle, Loader2, X, Clock, Printer
} from 'lucide-react';
import { createOrderAction, updateOrderAction } from '@/lib/actions/orders';
import { ORDER_STATUSES } from '@/lib/constants';

const OrderForm = ({ products, settings, initialData = null }) => {
  const router = useRouter();
  const isEdit = !!initialData;
  const isPendingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false); /* mobile only */

  // Detect Mobile
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

  // Order Info State
  const [orderDate, setOrderDate] = useState(
    initialData?.order?.order_date 
      ? new Date(initialData.order.order_date).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );
  const [status, setStatus] = useState(initialData?.order?.status || 'Order Placed');
  
  // Shipping and Packaging
  const [shipping, setShipping] = useState(Number(initialData?.order?.shipping_charge) || 0);
  const [packaging, setPackaging] = useState(Number(initialData?.order?.packaging_cost) || (settings?.default_packaging_cost || 0));

  // Items State
  const [items, setItems] = useState(() => {
    if (initialData?.items) {
      return initialData.items.map(item => ({
        product_id: item.product_id,
        quantity: parseInt(item.quantity) || 0,
        unit_price: parseFloat(item.unit_price) || 0,
        total_price: parseFloat(item.line_total) || (parseInt(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)
      }));
    }
    return [{ product_id: '', quantity: 1, unit_price: 0, total_price: 0 }];
  });

  // Discount (Calculated for display in edit mode since it's not in DB)
  const initialSubtotal = items.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0);
  const initialRevenue = Number(initialData?.order?.revenue || 0);
  const initialDiscount = isEdit ? Math.max(0, initialSubtotal + shipping - initialRevenue) : 0;
  const [discount, setDiscount] = useState(initialDiscount);

  // Search/UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const searchRef = useRef(null);

  // Close search results on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Customer Search
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

  // Fetch Customer History
  useEffect(() => {
    if (customer.id) {
      fetch(`/api/customers/${customer.id}/orders`)
        .then(res => res.json())
        .then(data => setCustomerOrders(data.orders || []));
    } else {
      setCustomerOrders([]);
    }
  }, [customer.id]);

  const handleSelectCustomer = (c) => {
    setCustomer({
      id: c.id,
      name: c.name,
      phone: c.phone,
      address: c.address || '',
      isExisting: true
    });
    setSearchQuery('');
    setShowResults(false);
  };

  const resetCustomer = () => {
    setCustomer({ id: '', name: '', phone: '', address: '', isExisting: false });
    setSearchQuery('');
  };

  // Item Management
  const addItem = () => {
    setItems([...items, { product_id: '', quantity: 1, unit_price: 0, total_price: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
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
    }

    item.total_price = item.quantity * item.unit_price;
    newItems[index] = item;
    setItems(newItems);
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0);
  const orderValue = Math.max(0, subtotal - parseFloat(discount || 0) + parseFloat(shipping || 0));

  // Auto-shipping logic
  useEffect(() => {
    if (!isEdit) {
      if (subtotal >= (settings?.free_shipping_threshold || 1000)) {
        setShipping(0);
      } else {
        setShipping(settings?.shipping_charge_below || 100);
      }
    }
  }, [subtotal, settings, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isPendingRef.current) return;
    
    if (!customer.name || !customer.phone) {
      alert("Please provide customer name and phone number");
      return;
    }

    if (items.some(item => !item.product_id || item.quantity <= 0)) {
      alert("Please select products and quantities for all items");
      return;
    }

    isPendingRef.current = true;
    setIsSubmitting(true);

    const orderData = {
      order_date: orderDate,
      status,
      shipping_charge: parseFloat(shipping || 0),
      packaging_cost: parseFloat(packaging || 0),
      order_value: parseFloat(orderValue || 0)
    };

    try {
      let result;
      if (isEdit) {
        result = await updateOrderAction(initialData.order.id, customer, orderData, items);
      } else {
        result = await createOrderAction(customer, orderData, items);
      }

      if (result.success) {
        router.push(isEdit ? `/orders/${initialData.order.id}` : '/orders');
        router.refresh();
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

  // Order history logic
  const displayedOrders = isMobile ? customerOrders.slice(0, 3) : customerOrders; /* mobile only */

  // Styles
  const containerStyle = {
    maxWidth: '800px',
    margin: '0 auto',
    fontFamily: '"Plus Jakarta Sans", sans-serif'
  };

  const cardStyle = {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: isMobile ? '20px' : '32px', /* mobile adjustment */
    marginBottom: '24px'
  };

  const sectionTitleStyle = {
    fontFamily: 'DM Serif Display, serif',
    fontSize: isMobile ? '18px' : '20px', /* mobile adjustment */
    color: '#1B4332',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  };

  const inputBaseStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    fontSize: isMobile ? '16px' : '14px', /* prevent iOS zoom */
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px'
  };

  const rowStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '20px'
  };

  return (
    <div style={containerStyle} className="order-form-container">
      <div style={{ 
        marginBottom: '32px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start' 
      }}>
        <div>
          <h1 style={{ 
            fontFamily: 'DM Serif Display, serif', 
            fontSize: isMobile ? '28px' : '32px', /* mobile only */
            color: '#1B4332', 
            margin: '0 0 8px 0' 
          }}>
            {isEdit ? 'Edit Order' : 'New Order'}
          </h1>
          <p style={{ color: '#6B7280', fontSize: '14px' }}>
            {isEdit ? `Modifying order #${initialData.order.id.slice(0,8)}` : 'Fill in the details to create a new order'}
          </p>
        </div>
        
        {isEdit && (
          <a 
            href={`/orders/${initialData.order.id}/labels`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              border: '1px solid #1B4332',
              borderRadius: '8px',
              fontFamily: 'inherit',
              fontSize: '14px',
              fontWeight: 600,
              color: '#1B4332',
              textDecoration: 'none',
              background: '#FFFFFF',
              cursor: 'pointer',
              marginTop: '4px'
            }}
          >
            <Printer size={16} />
            {!isMobile && 'Print Labels'}
          </a>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Customer Section */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            <Search size={20} />
            Customer Information
          </div>

          {!customer.isExisting && !isEdit ? (
            <div style={{ position: 'relative', marginBottom: '20px' }} ref={searchRef}>
              <label style={labelStyle}>Search Existing Customer</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                  style={{ ...inputBaseStyle, paddingLeft: '44px' }}
                />
                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              </div>

              {showResults && searchResults.length > 0 && (
                <div 
                  className="customer-dropdown"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    marginTop: '4px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    zIndex: 50,
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}
                >
                  {searchResults.map(c => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #F3F4F6',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
                    >
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{c.name}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>{c.phone}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              background: '#F9FAFB', 
              padding: '16px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              border: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '16px', color: '#111827', marginBottom: '4px' }}>{customer.name}</div>
                <div style={{ fontSize: '14px', color: '#4B5563' }}>{customer.phone}</div>
              </div>
              {!isEdit && (
                <button 
                  type="button" 
                  onClick={resetCustomer}
                  style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Change
                </button>
              )}
            </div>
          )}

          <div style={rowStyle} className="form-row-2col">
            <div>
              <label style={labelStyle}>Customer Name</label>
              <input
                type="text"
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                placeholder="Full Name"
                style={inputBaseStyle}
                required
                disabled={customer.isExisting}
              />
            </div>
            <div>
              <label style={labelStyle}>Phone Number (WhatsApp)</label>
              <input
                type="text"
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                placeholder="WhatsApp Number"
                style={inputBaseStyle}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: 0 }}>
            <label style={labelStyle}>Shipping Address</label>
            <textarea
              value={customer.address}
              onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
              placeholder="Full delivery address..."
              rows={3}
              style={{ ...inputBaseStyle, resize: 'none' }}
            />
          </div>

          {/* Customer Feedback Pills */}
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {customer.isExisting && (
              <>
                <div 
                  onClick={() => setShowHistory(!showHistory)}
                  style={{
                    background: customerOrders.length > (isEdit ? 1 : 0) ? '#D8F3DC' : '#FEF3C7',
                    color: customerOrders.length > (isEdit ? 1 : 0) ? '#1B4332' : '#92400E',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    width: 'fit-content',
                    cursor: 'pointer'
                  }}
                >
                  {customerOrders.length > (isEdit ? 1 : 0) ? (
                    <>
                      <UserCheck size={14} />
                      Returning customer
                    </>
                  ) : (
                    <>
                      <AlertCircle size={14} />
                      New customer
                    </>
                  )}
                  {customerOrders.length > (isEdit ? 1 : 0) && <ChevronDown size={14} style={{ transform: showHistory ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}
                </div>
                
                {customerOrders.length > (isEdit ? 1 : 0) && (
                  <div style={{ fontSize: '12px', color: '#059669', fontWeight: '500', marginLeft: '4px' }}>
                    Has ordered {customerOrders.length} times before
                  </div>
                )}

                {/* Order History Panel — mobile optimized */}
                {showHistory && customerOrders.length > 0 && (
                  <div style={{ 
                    marginTop: '12px', 
                    border: '1px solid #E5E7EB', 
                    borderRadius: '8px', 
                    background: '#FFFFFF',
                    overflow: 'hidden'
                  }}>
                    <div style={{ background: '#F9FAFB', padding: '8px 12px', fontSize: '12px', fontWeight: '600', color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>
                      Recent Orders
                    </div>
                    {displayedOrders.map((ord, idx) => (
                      <div key={ord.id} style={{ padding: '10px 12px', borderBottom: idx === displayedOrders.length - 1 ? 'none' : '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600' }}>₹{ord.order_value.toLocaleString()}</div>
                          <div style={{ fontSize: '11px', color: '#6B7280' }}>{new Date(ord.order_date).toLocaleDateString()}</div>
                        </div>
                        <div style={{ fontSize: '11px', background: '#F3F4F6', padding: '2px 8px', borderRadius: '10px' }}>{ord.status}</div>
                      </div>
                    ))}
                    {isMobile && customerOrders.length > 3 && (
                      <div style={{ padding: '8px', textAlign: 'center', fontSize: '11px', color: '#6B7280', borderTop: '1px solid #F3F4F6', background: '#F9FAFB' }}>
                        + {customerOrders.length - 3} more orders
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            {!customer.isExisting && customer.name && (
              <div style={{
                background: '#FEF3C7',
                color: '#92400E',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                width: 'fit-content'
              }}>
                <UserPlus size={14} />
                New customer — please add phone number
              </div>
            )}
          </div>
        </div>

        {/* Order Details Section */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>
            <ShoppingBag size={20} />
            Order Details
          </div>

          <div style={rowStyle} className="form-row-2col">
            <div>
              <label style={labelStyle}>Order Date</label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                style={inputBaseStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Order Status</label>
              <div style={{ position: 'relative' }}>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ ...inputBaseStyle, appearance: 'none' }}
                >
                  {ORDER_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Products</span>
              <button 
                type="button" 
                onClick={addItem}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#1B4332', 
                  fontSize: '12px', 
                  fontWeight: '700', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus size={14} /> Add Product
              </button>
            </div>

            <div style={{ border: isMobile ? 'none' : '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }} className="line-items-table">
                {!isMobile && (
                  <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '600', color: '#4B5563' }}>Product</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: '600', color: '#4B5563', width: '80px' }}>Qty</th>
                      <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: '600', color: '#4B5563', width: '100px' }}>Price</th>
                      <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: '600', color: '#4B5563', width: '100px' }}>Total</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                )}
                <tbody>
                  {items.map((item, index) => (
                    <tr 
                      key={index} 
                      className="line-item-row"
                      style={{ borderBottom: index === items.length - 1 ? 'none' : '1px solid #F3F4F6' }}
                    >
                      <td style={{ padding: isMobile ? '0' : '12px 16px' }} className="product-select">
                        <select
                          value={item.product_id}
                          onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                          style={{ ...inputBaseStyle, padding: '8px 12px' }}
                          required
                        >
                          <option value="">Select Product</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.base_type})</option>
                          ))}
                        </select>
                      </td>
                      
                      {isMobile ? (
                        /* Mobile Item Sub-row */
                        <td style={{ padding: 0 }}>
                          <div className="line-item-bottom">
                            <input
                              type="number"
                              min="1"
                              placeholder="Qty"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                              style={{ ...inputBaseStyle, padding: '8px', textAlign: 'center', width: '70px' }}
                              className="qty-input"
                              required
                            />
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Price"
                              value={item.unit_price}
                              onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                              style={{ ...inputBaseStyle, padding: '8px', textAlign: 'right', width: '90px' }}
                              className="price-input"
                              required
                            />
                            <div style={{ flex: 1, textAlign: 'right', fontWeight: '700', fontSize: '14px' }} className="line-total">
                              ₹{(item.total_price || 0).toLocaleString()}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              style={{ background: '#FEE2E2', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '8px', borderRadius: '6px' }}
                              className="remove-btn"
                              disabled={items.length === 1}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      ) : (
                        /* Desktop Table Cells */
                        <>
                          <td style={{ padding: '12px 16px' }}>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                              style={{ ...inputBaseStyle, padding: '8px', textAlign: 'center' }}
                              required
                            />
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <input
                              type="number"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                              style={{ ...inputBaseStyle, padding: '8px', textAlign: 'right' }}
                              required
                            />
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#111827' }}>
                            ₹{parseFloat(item.total_price || 0).toLocaleString()}
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}
                              disabled={items.length === 1}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charges & Summary */}
          <div 
            style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap: isMobile ? '24px' : '40px' }}
            className="order-summary-grid"
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="form-row-2col">
              <div>
                <label style={labelStyle}>Shipping Charge (₹)</label>
                <input
                  type="number"
                  value={shipping}
                  onChange={(e) => setShipping(e.target.value)}
                  style={inputBaseStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Packaging Cost (₹)</label>
                <input
                  type="number"
                  value={packaging}
                  onChange={(e) => setPackaging(e.target.value)}
                  style={inputBaseStyle}
                />
              </div>
              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                <label style={labelStyle}>Discount (₹)</label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  style={inputBaseStyle}
                />
              </div>
            </div>

            <div style={{ 
              background: '#F9FAFB', 
              borderRadius: '12px', 
              padding: '20px',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#4B5563' }}>
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#4B5563' }}>
                <span>Shipping</span>
                <span>₹{parseFloat(shipping || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px', color: '#DC2626' }}>
                <span>Discount</span>
                <span>-₹{parseFloat(discount || 0).toLocaleString()}</span>
              </div>
              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>Final Bill</span>
                  <span style={{ fontSize: '10px', color: '#6B7280' }}>Exc. Packaging</span>
                </div>
                <span style={{ fontSize: '24px', fontWeight: '800', color: '#1B4332' }}>₹{orderValue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginBottom: '100px' }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              background: '#FFFFFF',
              color: '#374151',
              fontWeight: '600',
              cursor: 'pointer',
              flex: isMobile ? 1 : 'none'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '12px 32px',
              borderRadius: '8px',
              border: 'none',
              background: '#1B4332',
              color: '#FFFFFF',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: isMobile ? 'none' : '160px',
              flex: isMobile ? 2 : 'none',
              justifyContent: 'center',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <ShoppingBag size={20} />
                Save Order
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, Check, Plus, Trash2, ChevronDown, 
  Search, UserPlus, UserCheck, AlertCircle, Loader2
} from 'lucide-react';
import { createOrderAction, updateOrderAction } from '@/lib/actions/orders';
import StatusBadge from '@/components/StatusBadge';

const OrderForm = ({ products, settings, initialData }) => {
  const router = useRouter();
  const isEdit = !!initialData;
  
  // --- Form State ---
  const [customer, setCustomer] = useState(initialData?.order ? {
    id: initialData.order.customer_id,
    name: initialData.order.customer_name,
    phone: initialData.order.customer_phone,
    address: initialData.order.customer_address,
    isExisting: true
  } : {
    id: null,
    name: '',
    phone: '',
    address: '',
    isExisting: false,
    isNew: false
  });

  const [orderDate, setOrderDate] = useState(
    initialData?.order?.order_date 
    ? new Date(initialData.order.order_date).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]
  );
  
  const [status, setStatus] = useState(initialData?.order?.status || 'Received');
  
  const [items, setItems] = useState(initialData?.items?.map(item => ({
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    line_total: item.quantity * item.unit_price
  })) || [{ product_id: '', quantity: 1, unit_price: 0, line_total: 0 }]);

  const [shippingCharge, setShippingCharge] = useState(
    initialData?.order?.shipping_charge || 0
  );
  
  const [packagingCost, setPackagingCost] = useState(
    initialData?.order?.packaging_cost || settings.default_packaging_cost || 30
  );
  
  const [materialCost, setMaterialCost] = useState(
    initialData?.order?.material_cost || 0
  );
  
  const [notes, setNotes] = useState(initialData?.order?.notes || '');

  // --- UI State ---
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'loading', 'success', 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const [customerOrders, setCustomerOrders] = useState([]);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  const searchRef = useRef(null);

  // --- Calculations ---
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.line_total) || 0), 0);
  
  const fetchCustomerHistory = async (customerId) => {
    try {
      const res = await fetch(`/api/customers/${customerId}/orders`);
      const data = await res.json();
      setCustomerOrders(data.orders || []);
    } catch (err) {
      console.error('Error fetching customer history:', err);
    }
  };

  useEffect(() => {
    if (isEdit && initialData?.order?.customer_id) {
      fetchCustomerHistory(initialData.order.customer_id);
    }
  }, [isEdit, initialData]);

  // Auto-calculate shipping if not manually changed (in new mode)
  useEffect(() => {
    if (!isEdit && subtotal > 0) {
      const threshold = parseFloat(settings.free_shipping_threshold) || 1000;
      const charge = parseFloat(settings.shipping_charge_below) || 100;
      if (subtotal >= threshold) {
        setShippingCharge(0);
      } else {
        setShippingCharge(charge);
      }
    }
  }, [subtotal, settings, isEdit]);

  const orderValue = subtotal; // Revenue from soaps
  const profit = orderValue - packagingCost - materialCost;

  // --- Handlers ---
  const handleCustomerSearch = async (query) => {
    // If name is edited or cleared, reset everything customer-related
    setCustomer({
      id: null,
      name: query,
      phone: '',
      address: '',
      isExisting: false,
      isNew: false
    });
    setCustomerOrders([]);
    setIsHistoryExpanded(false);

    if (query.length >= 2) {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/customers/search?name=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSearchResults(data.customers || []);
        setShowDropdown(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const selectCustomer = (c) => {
    setCustomer({
      id: c.id,
      name: c.name,
      phone: c.phone,
      address: c.address || '',
      isExisting: true,
      isNew: false
    });
    setShowDropdown(false);
    fetchCustomerHistory(c.id);
  };

  const startNewCustomer = () => {
    setCustomer(prev => ({
      ...prev,
      isExisting: false,
      isNew: true
    }));
    setShowDropdown(false);
  };

  const addItem = () => {
    setItems([...items, { product_id: '', quantity: 1, unit_price: 0, line_total: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    const item = { ...newItems[index] };
    
    item[field] = value;
    
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        item.unit_price = parseFloat(product.unit_price);
      }
    }
    
    item.line_total = (parseInt(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
    newItems[index] = item;
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customer.phone) {
      setErrorMsg('Phone number is required');
      return;
    }
    if (items.some(item => !item.product_id)) {
      setErrorMsg('Please select a product for all line items');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('loading');
    setErrorMsg('');

    const customerData = {
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      notes: '' // Not used in customer upsert here
    };

    const orderData = {
      order_date: orderDate,
      order_value: orderValue,
      shipping_charge: parseFloat(shippingCharge),
      packaging_cost: parseFloat(packagingCost),
      material_cost: parseFloat(materialCost),
      status: status,
      notes: notes
    };

    const formattedItems = items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price
    }));

    try {
      let result;
      if (isEdit) {
        result = await updateOrderAction(initialData.order.id, orderData, formattedItems);
      } else {
        result = await createOrderAction(customerData, orderData, formattedItems);
      }

      if (result.success) {
        setSubmitStatus('success');
        setTimeout(() => {
          router.push('/orders');
        }, 1500);
      } else {
        setSubmitStatus('error');
        setErrorMsg(result.error || 'Something went wrong');
      }
    } catch (err) {
      setSubmitStatus('error');
      setErrorMsg('Failed to save order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Styles ---
  const sectionLabelStyle = {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#6B7280',
    marginBottom: '16px',
    fontWeight: '600',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
  };

  const inputBaseStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    fontSize: '14px',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    outline: 'none',
    transition: 'all 0.2s',
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingBottom: '100px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontFamily: '"DM Serif Display", serif', 
          fontSize: '36px', 
          color: '#1B4332',
          margin: '0 0 8px 0'
        }}>
          {isEdit ? 'Edit Order' : 'New Order'}
        </h1>
        <p style={{ 
          fontFamily: '"Plus Jakarta Sans", sans-serif', 
          fontSize: '14px', 
          color: '#6B7280',
          margin: 0
        }}>
          {isEdit ? `Order #${initialData.order.id.slice(0, 8)}` : 'Log an order from WhatsApp'}
        </p>
        <div style={{ height: '2px', background: '#E5E7EB', marginTop: '16px' }} />
      </div>

      <form onSubmit={handleSubmit}>
        {/* Section 1: Customer */}
        <section style={{ marginBottom: '40px' }}>
          <div style={sectionLabelStyle}>Customer</div>
          
          <div style={{ position: 'relative' }} ref={searchRef}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Type customer name..."
                value={customer.name}
                onChange={(e) => handleCustomerSearch(e.target.value)}
                autoFocus={!isEdit}
                required
                style={{
                  ...inputBaseStyle,
                  paddingLeft: '36px',
                }}
              />
              <Search 
                size={16} 
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} 
              />
              {isSearching && (
                <Loader2 
                  size={16} 
                  className="animate-spin" 
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} 
                />
              )}
            </div>

            {/* Customer Dropdown */}
            {showDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                marginTop: '4px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                zIndex: 50,
                overflow: 'hidden'
              }}>
                {searchResults.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectCustomer(c)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      borderBottom: '1px solid #F3F4F6',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{c.name}</span>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>{c.phone}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={startNewCustomer}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: 'none',
                    background: '#F9FAFB',
                    cursor: 'pointer',
                    color: '#1B4332',
                    fontWeight: '600',
                    fontSize: '14px',
                    textAlign: 'left'
                  }}
                >
                  <UserPlus size={16} />
                  Add "{customer.name}" as new customer
                </button>
              </div>
            )}
          </div>

          {/* Customer Feedback Pills */}
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {customer.isExisting && (
              <>
                <div style={{
                  background: '#D8F3DC',
                  color: '#1B4332',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  width: 'fit-content'
                }}>
                  <UserCheck size={14} />
                  Returning customer
                </div>
                
                {customerOrders.length > 0 && (
                  <div style={{ marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        fontFamily: '"Plus Jakarta Sans", sans-serif',
                        fontSize: '12px',
                        color: '#6B7280'
                      }}
                    >
                      <span>
                        {customerOrders.length} previous order{customerOrders.length > 1 ? 's' : ''} · ₹{customerOrders.reduce((sum, o) => sum + parseFloat(o.order_value), 0)} total
                      </span>
                      <ChevronDown 
                        size={14} 
                        style={{ 
                          transition: 'transform 0.2s', 
                          transform: isHistoryExpanded ? 'rotate(180deg)' : 'rotate(0)' 
                        }} 
                      />
                    </button>
                    
                    {isHistoryExpanded && (
                      <div style={{
                        marginTop: '8px',
                        background: '#FAFAFA',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '12px 16px',
                      }}>
                        {customerOrders.map((order, idx) => (
                          <div key={order.id}>
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              padding: '8px 0'
                            }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                                <div style={{ fontSize: '13px', color: '#6B7280' }}>
                                  {new Date(order.order_date).toLocaleDateString('en-GB', { 
                                    day: 'numeric', month: 'short', year: 'numeric' 
                                  })}
                                </div>
                                <div style={{ 
                                  fontSize: '13px', 
                                  color: '#1A1A1A',
                                  maxWidth: '280px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {order.products}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                                  ₹{order.order_value}
                                </div>
                                <StatusBadge status={order.status} />
                              </div>
                            </div>
                            {idx < customerOrders.length - 1 && (
                              <div style={{ height: '1px', background: '#F3F4F6' }} />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            {customer.isNew && (
              <div style={{
                background: '#FEF3C7',
                color: '#92400E',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <AlertCircle size={14} />
                New customer — please add phone number
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginTop: '16px' }}>
            <div>
              <label style={{ ...sectionLabelStyle, marginBottom: '8px', display: 'block' }}>Phone Number</label>
              <input
                type="text"
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                required
                placeholder="WhatsApp Number"
                style={{
                  ...inputBaseStyle,
                  borderColor: !customer.phone && submitStatus === 'error' ? '#EF4444' : '#E5E7EB'
                }}
              />
            </div>
            <div>
              <label style={{ ...sectionLabelStyle, marginBottom: '8px', display: 'block' }}>Delivery Address</label>
              <textarea
                value={customer.address}
                onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                rows={3}
                placeholder="Add later when ready to dispatch"
                style={{
                  ...inputBaseStyle,
                  fontSize: '13px',
                  borderColor: '#E5E7EB',
                }}
              />
            </div>
          </div>
        </section>

        <div style={{ height: '1px', background: '#E5E7EB', margin: '28px 0' }} />

        {/* Section 2: Order Details */}
        <section style={{ marginBottom: '40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <div style={sectionLabelStyle}>Order Date</div>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                style={inputBaseStyle}
              />
            </div>
            <div>
              <div style={sectionLabelStyle}>Status</div>
              <div style={{ position: 'relative' }}>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{
                    ...inputBaseStyle,
                    appearance: 'none',
                    paddingRight: '40px',
                  }}
                >
                  <option value="Received">Received</option>
                  <option value="Payment Confirmed">Payment Confirmed</option>
                  <option value="In Production">In Production</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <ChevronDown 
                  size={18} 
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280' }} 
                />
              </div>
            </div>
          </div>
        </section>

        <div style={{ height: '1px', background: '#E5E7EB', margin: '28px 0' }} />

        {/* Section 3: Soaps Ordered */}
        <section style={{ marginBottom: '40px' }}>
          <div style={sectionLabelStyle}>Soaps Ordered</div>
          <div style={{
            background: '#FAFDF9',
            border: '1px solid #D8F3DC',
            borderRadius: '12px',
            padding: '20px',
          }}>
            {items.map((item, index) => (
              <div key={index} style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 70px 90px 80px 40px', 
                gap: '12px', 
                alignItems: 'end',
                marginBottom: index === items.length - 1 ? 0 : '16px'
              }}>
                <div>
                  {index === 0 && <label style={{ ...sectionLabelStyle, fontSize: '10px' }}>Product</label>}
                  <select
                    value={item.product_id}
                    onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                    style={inputBaseStyle}
                  >
                    <option value="">Select Soap...</option>
                    {/* Group by base_type if possible, but keep it simple for now */}
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} — ₹{p.unit_price}</option>
                    ))}
                  </select>
                </div>
                <div>
                  {index === 0 && <label style={{ ...sectionLabelStyle, fontSize: '10px' }}>Qty</label>}
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    style={inputBaseStyle}
                  />
                </div>
                <div>
                  {index === 0 && <label style={{ ...sectionLabelStyle, fontSize: '10px' }}>Price ₹</label>}
                  <input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                    style={inputBaseStyle}
                  />
                </div>
                <div style={{ textAlign: 'right', paddingBottom: '10px' }}>
                  {index === 0 && <label style={{ ...sectionLabelStyle, fontSize: '10px', display: 'block', textAlign: 'right' }}>Total</label>}
                  <div style={{ 
                    fontFamily: '"DM Serif Display", serif', 
                    fontSize: '15px', 
                    color: '#1B4332' 
                  }}>
                    ₹{item.line_total}
                  </div>
                </div>
                <div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#9CA3AF',
                        cursor: 'pointer',
                        padding: '10px',
                        marginBottom: '2px'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.color = '#EF4444'}
                      onMouseOut={(e) => e.currentTarget.style.color = '#9CA3AF'}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addItem}
              style={{
                background: 'none',
                border: 'none',
                color: '#1B4332',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: 0
              }}
            >
              <Plus size={16} />
              Add Another Soap
            </button>
          </div>

          {/* Order Summary Box */}
          <div style={{
            background: '#F9F6F0',
            border: '1px solid #E5E7EB',
            borderRadius: '10px',
            padding: '16px 20px',
            marginTop: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', gap: '32px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>Subtotal</div>
                <div style={{ fontWeight: '600', fontSize: '16px' }}>₹{subtotal}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>Shipping</div>
                <input
                  type="number"
                  value={shippingCharge}
                  onChange={(e) => setShippingCharge(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px dashed #9CA3AF',
                    width: '60px',
                    fontWeight: '600',
                    fontSize: '16px',
                    padding: 0,
                    outline: 'none'
                  }}
                />
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>Order Value</div>
              <div style={{ 
                fontFamily: '"DM Serif Display", serif', 
                fontSize: '24px', 
                color: '#1B4332' 
              }}>
                ₹{subtotal}
              </div>
            </div>
          </div>
        </section>

        <div style={{ height: '1px', background: '#E5E7EB', margin: '28px 0' }} />

        {/* Section 4: Cost Tracking */}
        <section style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ ...sectionLabelStyle, marginBottom: 0 }}>Cost Tracking</div>
            <div style={{
              fontSize: '12px',
              color: '#6B7280',
              fontStyle: 'italic'
            }}>
              Used to calculate profit. An estimate is fine.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ ...sectionLabelStyle, fontSize: '10px' }}>Packaging Cost ₹</label>
              <input
                type="number"
                value={packagingCost}
                onChange={(e) => setPackagingCost(e.target.value)}
                style={inputBaseStyle}
              />
            </div>
            <div>
              <label style={{ ...sectionLabelStyle, fontSize: '10px' }}>Material Cost ₹</label>
              <input
                type="number"
                value={materialCost}
                onChange={(e) => setMaterialCost(e.target.value)}
                style={inputBaseStyle}
              />
            </div>
          </div>
        </section>

        <div style={{ height: '1px', background: '#E5E7EB', margin: '28px 0' }} />

        {/* Section 5: Notes */}
        <section style={{ marginBottom: '48px' }}>
          <div style={sectionLabelStyle}>Notes</div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Special instructions, gift message, how they found us..."
            style={inputBaseStyle}
          />
        </section>

        {/* Submit Button */}
        <div style={{ position: 'sticky', bottom: '24px', zIndex: 10 }}>
          {errorMsg && (
            <div style={{ 
              background: '#FEE2E2', 
              color: '#DC2626', 
              padding: '12px', 
              borderRadius: '8px', 
              marginBottom: '16px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid #FECACA'
            }}>
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting || submitStatus === 'success'}
            style={{
              width: '100%',
              height: '52px',
              background: submitStatus === 'success' ? '#1B4332' : '#1B4332',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: '0 4px 12px rgba(27,67,50,0.2)',
              transition: 'all 0.2s'
            }}
          >
            {submitStatus === 'loading' ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Saving...
              </>
            ) : submitStatus === 'success' ? (
              <>
                <Check size={20} />
                Order Saved!
              </>
            ) : isEdit ? (
              <>
                <Check size={20} />
                Update Order
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

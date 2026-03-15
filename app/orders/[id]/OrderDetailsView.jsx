'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, ArrowLeft, ChevronDown, CheckCircle, UserCheck, AlertCircle, Printer, Package, MapPin } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { updateShipmentStatusAction, updateOrderStatusAction } from '@/lib/actions/orders';
import { ORDER_STATUSES, EDITABLE_STATUSES } from '@/lib/constants';

const OrderStatusBar = ({ order, onStatusUpdate }) => {
  const [newStatus, setNewStatus] = useState(order.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (val) => {
    setNewStatus(val);
    setIsUpdating(true);
    const result = await onStatusUpdate(order.id, val);
    setIsUpdating(false);
    if (!result.success) alert(result.error);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: '#F9FAFB',
      padding: '12px 20px',
      borderRadius: '12px',
      border: '1px solid #E5E7EB',
      marginBottom: '32px'
    }}>
      <div style={{ fontSize: '13px', fontWeight: '700', color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Update Order Status:
      </div>
      <div style={{ position: 'relative', flex: 1, maxWidth: '240px' }}>
        <select 
          value={newStatus}
          onChange={(e) => handleUpdate(e.target.value)}
          disabled={isUpdating}
          style={{
            width: '100%',
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #D1D5DB',
            fontSize: '14px',
            fontWeight: '600',
            appearance: 'none',
            background: '#FFFFFF',
            color: '#111827',
            cursor: isUpdating ? 'wait' : 'pointer',
            outline: 'none'
          }}
        >
          {ORDER_STATUSES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280', pointerEvents: 'none' }} />
      </div>
      {isUpdating && <div style={{ fontSize: '12px', color: '#1B4332', fontWeight: '600' }}>Updating...</div>}
    </div>
  );
};

const ShipmentCard = ({ shipment, items, isMobile, onStatusUpdate }) => {
  const [newStatus, setNewStatus] = useState(shipment.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    const result = await onStatusUpdate(shipment.id, newStatus);
    setIsUpdating(false);
    if (!result.success) alert(result.error);
  };

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Package size={20} color="#1B4332" />
          <div style={{ fontWeight: '700', color: '#111827', fontSize: '16px' }}>{shipment.label}</div>
        </div>
        <StatusBadge status={shipment.status} />
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        color: '#4B5563', 
        fontSize: '14px', 
        marginBottom: '20px',
        background: '#F9FAFB',
        padding: '12px',
        borderRadius: '8px'
      }}>
        <MapPin size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>{shipment.address_text}</div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '8px' }}>Items in this package</div>
        {items.map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '4px 0' }}>
            <span>{item.product_name} × {item.quantity}</span>
            <span style={{ fontWeight: '600' }}>₹{Number(item.line_total).toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <select 
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #E5E7EB',
                fontSize: '13px',
                appearance: 'none',
                background: '#FFFFFF',
                fontFamily: 'inherit'
              }}
            >
              {ORDER_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
          </div>
          <button
            onClick={handleUpdate}
            disabled={newStatus === shipment.status || isUpdating}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: newStatus === shipment.status ? '#F3F4F6' : '#1B4332',
              color: newStatus === shipment.status ? '#9CA3AF' : '#FFFFFF',
              fontWeight: '600',
              fontSize: '13px',
              cursor: newStatus === shipment.status ? 'default' : 'pointer'
            }}
          >
            {isUpdating ? '...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

const OrderDetailsView = ({ order, items, shipments = [] }) => {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isEditable = EDITABLE_STATUSES.includes(order.status);
  const subtotal = items.reduce((sum, item) => sum + (Number(item.line_total) || 0), 0);
  const revenue = Number(order.revenue) || 0;
  const shipping = Number(order.shipping_charge) || 0;
  const discount = Math.max(0, subtotal + shipping - revenue);

  const handleUpdateShipmentStatus = async (shipmentId, status) => {
    const result = await updateShipmentStatusAction(shipmentId, status);
    if (result.success) {
      router.refresh();
    }
    return result;
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    const result = await updateOrderStatusAction(orderId, status);
    if (result.success) {
      router.refresh();
    }
    return result;
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/orders" style={{ color: '#6B7280' }}><ArrowLeft size={24} /></Link>
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: isMobile ? '24px' : '28px', color: '#1B4332', margin: 0 }}>
            Order #{order.id.slice(0, 8)}
          </h1>
          <StatusBadge status={order.status} />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {isEditable && (
            <Link 
              href={`/orders/${order.id}/edit`}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFFFF', color: '#374151', border: '1px solid #E5E7EB', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', textDecoration: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              <Pencil size={18} />
              {!isMobile && 'Edit Order'}
            </Link>
          )}
          <a href={`/orders/${order.id}/labels`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: '1px solid #1B4332', borderRadius: '8px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '13px', fontWeight: 600, color: '#1B4332', textDecoration: 'none', background: '#FFFFFF', cursor: 'pointer' }}>
            <Printer size={14} />
            Print Labels
          </a>
        </div>
      </div>

      <OrderStatusBar order={order} onStatusUpdate={handleUpdateOrderStatus} />

      <div style={{ display: isMobile ? 'flex' : 'grid', flexDirection: 'column', gridTemplateColumns: '1fr 360px', gap: '40px' }}>
        {/* Left: Shipments and Customer Info */}
        <div>
          {/* Customer Card */}
          <div style={cardStyle}>
            <div style={sectionLabelStyle}>Customer Info</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontWeight: '700', fontSize: '20px', color: '#111827' }}>{order.customer_name}</div>
              <div style={{ background: order.customer_type === 'Returning' ? '#D8F3DC' : '#FEF3C7', color: order.customer_type === 'Returning' ? '#1B4332' : '#92400E', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                {order.customer_type}
              </div>
            </div>
            <div style={{ color: '#4B5563' }}>{order.customer_phone}</div>
          </div>

          <div style={sectionLabelStyle}>Shipping & Delivery</div>
          {shipments.map(shipment => (
            <ShipmentCard 
              key={shipment.id} 
              shipment={shipment} 
              items={items.filter(i => i.shipment_id === shipment.id)}
              isMobile={isMobile}
              onStatusUpdate={handleUpdateShipmentStatus}
            />
          ))}

          {/* Pricing Summary */}
          <div style={cardStyle}>
            <div style={sectionLabelStyle}>Financial Summary</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={summaryLineStyle}>
                <span>Subtotal ({items.length} items)</span>
                <span style={{ fontWeight: '600' }}>₹{subtotal.toLocaleString()}</span>
              </div>
              <div style={summaryLineStyle}>
                <span>Shipping & Packaging</span>
                <span style={{ fontWeight: '600' }}>₹{(shipping + Number(order.packaging_cost)).toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div style={summaryLineStyle}>
                  <span>Discount Applied</span>
                  <span style={{ fontWeight: '600', color: '#DC2626' }}>-₹{discount.toLocaleString()}</span>
                </div>
              )}
              <div style={{ ...summaryLineStyle, borderTop: '1px solid #F3F4F6', paddingTop: '12px', marginTop: '4px' }}>
                <span style={{ fontWeight: '700', color: '#111827' }}>Total Revenue</span>
                <span style={{ fontWeight: '800', fontSize: '24px', color: '#1B4332' }}>₹{revenue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Internal Notes / Helper info */}
        <div>
          <div style={cardStyle}>
            <div style={sectionLabelStyle}>Order Notes</div>
            <div style={{ color: '#4B5563', fontSize: '14px', lineHeight: '1.6', minHeight: '100px' }}>
              {order.notes || <em style={{ color: '#9CA3AF' }}>No notes provided for this order.</em>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const cardStyle = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px'
};

const sectionLabelStyle = {
  fontSize: '11px',
  fontWeight: '800',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#9CA3AF',
  marginBottom: '16px',
  fontFamily: 'Plus Jakarta Sans, sans-serif'
};

const summaryLineStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '14px',
  color: '#4B5563',
  fontFamily: 'Plus Jakarta Sans, sans-serif'
};

export default OrderDetailsView;

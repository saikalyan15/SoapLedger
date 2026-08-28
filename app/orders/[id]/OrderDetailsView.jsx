'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, ArrowLeft, ChevronDown, Printer, Package, MapPin, Droplets, CreditCard, ShieldCheck, MessageCircle } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { markOrderComplimentaryAction, reconcileRazorpayPaymentAction, updateShipmentStatusAction, updateOrderStatusAction, sendOrderStatusAlertAction } from '@/lib/actions/orders';
import { SETTABLE_STATUSES, EDITABLE_STATUSES } from '@/lib/constants';
import { formatPhoneForDisplay } from '@/lib/utils/phone';

const ShipmentCard = ({ shipment, items, onStatusUpdate }) => {
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
              {SETTABLE_STATUSES.map(s => (
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

const PAYMENT_CONFIRMED_WORKFLOW_STATUSES = new Set([
  'Payment Confirmed', 'In Manufacturing', 'Ready to Dispatch', 'Dispatched',
  'Partially Dispatched', 'Partially Delivered', 'Delivered',
]);

const PaymentCard = ({ order, paymentAttempts = [], amountCollected = null, paymentCharge = null, onReconciled }) => {
  const [paymentId, setPaymentId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isMarkingComplimentary, setIsMarkingComplimentary] = useState(false);
  const [message, setMessage] = useState(null);
  const isRazorpay = order.payment_provider === 'razorpay';
  const displayStatus = isRazorpay
    ? (order.payment_status || 'pending')
    : order.status === 'Cancelled'
      ? 'cancelled'
      : PAYMENT_CONFIRMED_WORKFLOW_STATUSES.has(order.status) ? 'confirmed' : 'pending payment';
  const isSettled = ['paid', 'confirmed'].includes(displayStatus);
  const isPaid = isRazorpay && order.payment_status === 'paid';
  const isComplimentary = order.payment_status === 'manual' && Number(order.revenue) === 0;
  const canReconcile = isRazorpay && !isSettled && order.provider_order_id;
  const canMarkComplimentary = !isRazorpay && !isSettled && Number(order.revenue) === 0;
  const paymentIdIsValid = /^pay_[A-Za-z0-9]+$/.test(paymentId.trim());
  const failureDetails = order.payment_failure_details && typeof order.payment_failure_details === 'object'
    ? order.payment_failure_details
    : {};
  const failureRows = [
    ['Failed Payment ID', failureDetails.payment_id],
    ['Method', failureDetails.method],
    ['Error Code', failureDetails.code],
    ['Error Source', failureDetails.source],
    ['Error Step', failureDetails.step],
    ['Reason Code', failureDetails.reason],
  ].filter(([, value]) => value);

  const handleReconcile = async () => {
    if (!paymentIdIsValid || isVerifying) return;
    setIsVerifying(true);
    setMessage(null);
    const result = await reconcileRazorpayPaymentAction({
      orderId: order.id,
      providerOrderId: order.provider_order_id,
      paymentId: paymentId.trim(),
    });
    setIsVerifying(false);
    if (result.success) {
      setMessage({ type: 'success', text: result.alreadyConfirmed ? 'Payment was already confirmed.' : 'Payment verified and order confirmed.' });
      onReconciled();
    } else {
      setMessage({ type: 'error', text: result.error || 'Could not verify this payment.' });
    }
  };

  const handleMarkComplimentary = async () => {
    if (isMarkingComplimentary) return;
    setIsMarkingComplimentary(true);
    setMessage(null);
    const result = await markOrderComplimentaryAction(order.id);
    setIsMarkingComplimentary(false);
    if (result.success) {
      setMessage({ type: 'success', text: 'Complimentary order recorded.' });
      onReconciled();
    } else {
      setMessage({ type: 'error', text: result.error || 'Could not record this complimentary order.' });
    }
  };

  const statusColor = isSettled ? '#166534' : displayStatus === 'failed' || displayStatus === 'cancelled' ? '#B91C1C' : '#92400E';
  const statusBackground = isSettled ? '#DCFCE7' : displayStatus === 'failed' || displayStatus === 'cancelled' ? '#FEE2E2' : '#FEF3C7';

  return (
    <div style={{ ...cardStyle, borderColor: isSettled ? '#BBF7D0' : '#FDE68A' }}>
      <div style={{ ...sectionLabelStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
        <CreditCard size={13} />
        Payment
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ fontWeight: '700', color: '#111827', textTransform: 'capitalize' }}>
            {isRazorpay ? 'Razorpay' : order.payment_provider || 'Manual'}
          </div>
          <div style={{ color: '#6B7280', fontSize: '12px', marginTop: '2px' }}>
            {isPaid
              ? 'Captured payment verified with Razorpay'
              : isRazorpay
                ? 'Showing Razorpay payment state'
                : isComplimentary
                  ? 'Complimentary order'
                  : 'Derived from the fulfilment workflow'}
          </div>
        </div>
        <span style={{ background: statusBackground, color: statusColor, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>
          {displayStatus}
        </span>
      </div>

      {order.provider_order_id && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '3px' }}>Razorpay Order ID</div>
          <code style={{ display: 'block', color: '#374151', fontSize: '11px', overflowWrap: 'anywhere' }}>{order.provider_order_id}</code>
        </div>
      )}
      {order.provider_payment_id && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '3px' }}>Razorpay Payment ID</div>
          <code style={{ display: 'block', color: '#166534', fontSize: '11px', overflowWrap: 'anywhere' }}>{order.provider_payment_id}</code>
        </div>
      )}
      {order.paid_at && (
        <div style={{ color: '#6B7280', fontSize: '11px', marginTop: '8px' }}>
          Confirmed {new Date(order.paid_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
        </div>
      )}
      {amountCollected != null && (
        <div style={{ borderTop: '1px solid #F3F4F6', marginTop: '12px', paddingTop: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '8px' }}>Payment breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563' }}>
              <span>Order value</span>
              <span style={{ fontWeight: '600' }}>₹{(Number(order.revenue) || 0).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563' }}>
              <span>Online payment charge (2.5%)</span>
              <span style={{ fontWeight: '600' }}>{paymentCharge > 0 ? `+₹${paymentCharge.toLocaleString('en-IN')}` : '₹0'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F3F4F6', paddingTop: '6px', color: '#166534', fontWeight: '800' }}>
              <span>Collected from customer</span>
              <span>₹{amountCollected.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div style={{ color: '#9CA3AF', fontSize: '10px', marginTop: '6px' }}>
            The payment charge is passed to Razorpay and is not revenue.
          </div>
        </div>
      )}

      {paymentAttempts.length > 0 && (
        <div style={{ borderTop: '1px solid #F3F4F6', marginTop: '16px', paddingTop: '14px' }}>
          <div style={{ color: '#6B7280', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>
            Payment attempts ({paymentAttempts.length})
          </div>
          {paymentAttempts.map((attempt) => (
            <div key={attempt.id} style={{ background: '#F9FAFB', borderRadius: '7px', padding: '9px 10px', marginTop: '7px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <code style={{ color: '#374151', overflowWrap: 'anywhere' }}>{attempt.provider_payment_id}</code>
                <strong style={{ color: attempt.status === 'captured' ? '#166534' : attempt.status === 'failed' ? '#B91C1C' : '#92400E', textTransform: 'uppercase' }}>{attempt.status}</strong>
              </div>
              <div style={{ color: '#6B7280', marginTop: '4px' }}>
                {[attempt.method, new Date(attempt.provider_created_at || attempt.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })].filter(Boolean).join(' · ')}
              </div>
              {(attempt.error_description || attempt.error_reason) && (
                <div style={{ color: '#7F1D1D', marginTop: '4px', lineHeight: '1.4' }}>{attempt.error_description || attempt.error_reason}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {order.payment_status === 'failed' && (
        <div style={{ borderTop: '1px solid #FECACA', marginTop: '16px', paddingTop: '14px' }}>
          <div style={{ color: '#991B1B', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '7px' }}>
            Failure diagnostics
          </div>
          <p style={{ margin: '0 0 10px', color: '#7F1D1D', fontSize: '12px', lineHeight: '1.5' }}>
            {order.payment_failure_reason || 'Razorpay reported that the payment was not completed.'}
          </p>
          {failureRows.map(([label, value]) => (
            <div key={label} style={{ display: 'grid', gridTemplateColumns: '105px minmax(0, 1fr)', gap: '8px', marginTop: '6px', fontSize: '11px' }}>
              <span style={{ color: '#9CA3AF', fontWeight: '700' }}>{label}</span>
              <code style={{ color: '#374151', overflowWrap: 'anywhere', textTransform: label === 'Method' ? 'capitalize' : 'none' }}>{value}</code>
            </div>
          ))}
          {order.payment_failed_at && (
            <div style={{ color: '#9CA3AF', fontSize: '10px', marginTop: '10px' }}>
              Recorded {new Date(order.payment_failed_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </div>
          )}
        </div>
      )}

      {canReconcile && (
        <div style={{ borderTop: '1px solid #F3F4F6', marginTop: '16px', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '10px', marginBottom: '12px' }}>
            <ShieldCheck size={16} color="#92400E" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ margin: 0, color: '#78350F', fontSize: '11px', lineHeight: '1.5' }}>
              Use only when Razorpay Dashboard shows the payment as Captured. SoapLedger verifies it directly before changing this order.
            </p>
          </div>
          <label htmlFor={`razorpay-payment-${order.id}`} style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
            Razorpay Payment ID
          </label>
          <input
            id={`razorpay-payment-${order.id}`}
            value={paymentId}
            onChange={(event) => {
              setPaymentId(event.target.value);
              setMessage(null);
            }}
            placeholder="pay_..."
            autoComplete="off"
            spellCheck={false}
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '7px', fontFamily: 'monospace', fontSize: '12px', marginBottom: '10px' }}
          />
          <button
            type="button"
            onClick={handleReconcile}
            disabled={!paymentIdIsValid || isVerifying}
            style={{ width: '100%', border: 'none', borderRadius: '7px', padding: '10px 12px', background: paymentIdIsValid && !isVerifying ? '#1B4332' : '#E5E7EB', color: paymentIdIsValid && !isVerifying ? '#FFFFFF' : '#9CA3AF', fontWeight: '700', fontSize: '12px', cursor: paymentIdIsValid && !isVerifying ? 'pointer' : 'not-allowed' }}
          >
            {isVerifying ? 'Verifying with Razorpay…' : 'Verify & Confirm Paid'}
          </button>
          {message && (
            <p role="status" style={{ margin: '10px 0 0', color: message.type === 'success' ? '#166534' : '#B91C1C', fontSize: '11px', fontWeight: '600', lineHeight: '1.4' }}>
              {message.text}
            </p>
          )}
        </div>
      )}
      {canMarkComplimentary && (
        <div style={{ borderTop: '1px solid #F3F4F6', marginTop: '16px', paddingTop: '16px' }}>
          <p style={{ margin: '0 0 12px', color: '#6B7280', fontSize: '11px', lineHeight: '1.5' }}>
            This zero-value order can be recorded as complimentary, so it no longer needs payment confirmation.
          </p>
          <button
            type="button"
            onClick={handleMarkComplimentary}
            disabled={isMarkingComplimentary}
            style={{ width: '100%', border: 'none', borderRadius: '7px', padding: '10px 12px', background: isMarkingComplimentary ? '#E5E7EB' : '#1B4332', color: isMarkingComplimentary ? '#9CA3AF' : '#FFFFFF', fontWeight: '700', fontSize: '12px', cursor: isMarkingComplimentary ? 'wait' : 'pointer' }}
          >
            {isMarkingComplimentary ? 'Recording…' : 'Mark as Complimentary'}
          </button>
          {message && (
            <p role="status" style={{ margin: '10px 0 0', color: message.type === 'success' ? '#166534' : '#B91C1C', fontSize: '11px', fontWeight: '600', lineHeight: '1.4' }}>
              {message.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const OrderDetailsView = ({ order, items, shipments = [], essentialOils = [], paymentAttempts = [] }) => {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [notifyState, setNotifyState] = useState(null); // null | 'sending' | 'sent' | 'error'

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
  const customization = Number(order.customization_amount) || 0;
  const discount = Math.max(0, subtotal + shipping + customization - revenue);

  // What Razorpay actually took from the customer. The storefront adds an online
  // payment charge on top of the order value and collects the rounded total, but
  // SoapLedger keeps recording the order at its own value — so the real figure
  // only lives on the captured payment attempt.
  const capturedAttempt = paymentAttempts.find(
    (attempt) => attempt.status === 'captured'
      && (attempt.currency == null || attempt.currency === 'INR')
      && Number.isFinite(Number(attempt.amount_paise))
      && Number(attempt.amount_paise) > 0
  );
  const amountCollected = capturedAttempt ? Number(capturedAttempt.amount_paise) / 100 : null;
  const paymentCharge = amountCollected != null
    ? Math.round((amountCollected - revenue) * 100) / 100
    : null;

  const handleUpdateShipmentStatus = async (shipmentId, status) => {
    const result = await updateShipmentStatusAction(shipmentId, status);
    if (result.success) {
      router.refresh();
    }
    return result;
  };

  const handleUpdateOrderStatus = async (status) => {
    setIsUpdatingStatus(true);
    const result = await updateOrderStatusAction(order.id, status);
    setIsUpdatingStatus(false);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error);
    }
  };

  const handleSendWhatsAppNotice = async () => {
    setNotifyState('sending');
    const result = await sendOrderStatusAlertAction(order.id, order.customer_name, order.status);
    setNotifyState(result.success ? 'sent' : 'error');
    setTimeout(() => setNotifyState(null), 3000);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header Row */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center', 
        gap: '20px',
        marginBottom: '40px' 
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          <Link href="/orders" style={{ color: '#6B7280' }}><ArrowLeft size={24} /></Link>
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: isMobile ? '24px' : '28px', color: '#1B4332', margin: 0 }}>
            Order #{order.id.slice(0, 8)}
          </h1>
          
          <div style={{ position: 'relative' }}>
            <select
              value={order.status}
              onChange={(e) => handleUpdateOrderStatus(e.target.value)}
              disabled={isUpdatingStatus}
              style={{
                padding: '6px 32px 6px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                background: '#F3F4F6',
                border: '1px solid #E5E7EB',
                color: '#374151',
                cursor: isUpdatingStatus ? 'wait' : 'pointer',
                appearance: 'none',
                fontFamily: '"Plus Jakarta Sans", sans-serif'
              }}
            >
              {SETTABLE_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown size={12} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
          {isUpdatingStatus && <span style={{ fontSize: '10px', color: '#1B4332', fontWeight: 700 }}>Updating...</span>}

          <button
            type="button"
            onClick={handleSendWhatsAppNotice}
            disabled={notifyState === 'sending'}
            title="Send this order's current status to the founder on WhatsApp"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: notifyState === 'sent' ? '#D8F3DC' : notifyState === 'error' ? '#FEE2E2' : '#FFFFFF',
              color: notifyState === 'sent' ? '#1B4332' : notifyState === 'error' ? '#B91C1C' : '#374151',
              border: '1px solid #E5E7EB',
              cursor: notifyState === 'sending' ? 'wait' : 'pointer',
              fontFamily: '"Plus Jakarta Sans", sans-serif'
            }}
          >
            <MessageCircle size={13} />
            {notifyState === 'sending' ? 'Sending…' : notifyState === 'sent' ? 'Sent' : notifyState === 'error' ? 'Failed' : 'Notify WhatsApp'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', width: isMobile ? '100%' : 'auto' }}>
          {isEditable && (
            <Link 
              href={`/orders/${order.id}/edit`}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#FFFFFF', color: '#374151', border: '1px solid #E5E7EB', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', textDecoration: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '14px' }}
            >
              <Pencil size={18} />
              Edit
            </Link>
          )}
          <a 
            href={`/orders/${order.id}/labels`} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', border: '1px solid #1B4332', borderRadius: '8px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '14px', fontWeight: 600, color: '#1B4332', textDecoration: 'none', background: '#FFFFFF', cursor: 'pointer' }}
          >
            <Printer size={18} />
            Labels
          </a>
        </div>
      </div>

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
            <div style={{ color: '#4B5563' }}>{formatPhoneForDisplay(order.customer_phone)}</div>
            {order.customer_email && (
              <a href={`mailto:${order.customer_email}`} style={{ color: '#1B4332', fontSize: '14px' }}>
                {order.customer_email}
              </a>
            )}
            {order.source && (
              <div style={{ marginTop: '8px' }}>
                <span style={{ background: '#D8F3DC', color: '#1B4332', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                  via {order.source}
                </span>
              </div>
            )}
          </div>

          <div style={sectionLabelStyle}>Shipping & Delivery</div>
          {shipments.map(shipment => (
            <ShipmentCard 
              key={shipment.id} 
              shipment={shipment} 
              items={items.filter(i => i.shipment_id === shipment.id)}
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
              {customization > 0 && (
                <div style={summaryLineStyle}>
                  <span>Customization</span>
                  <span style={{ fontWeight: '600', color: '#1B4332' }}>+₹{customization.toLocaleString()}</span>
                </div>
              )}
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
              {paymentCharge > 0 && (
                <>
                  <div style={{ ...summaryLineStyle, fontSize: '13px', color: '#6B7280' }}>
                    <span>Online payment charge (2.5%)</span>
                    <span>+₹{paymentCharge.toLocaleString()}</span>
                  </div>
                  <div style={summaryLineStyle}>
                    <span style={{ fontWeight: '700', color: '#111827' }}>Collected from customer</span>
                    <span style={{ fontWeight: '700', color: '#111827' }}>₹{amountCollected.toLocaleString()}</span>
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9CA3AF', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    The payment charge is passed to Razorpay and is not revenue.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Order Notes + Essential Oils Checklist */}
        <div>
          <PaymentCard
            order={order}
            paymentAttempts={paymentAttempts}
            amountCollected={amountCollected}
            paymentCharge={paymentCharge}
            onReconciled={() => router.refresh()}
          />

          <div style={cardStyle}>
            <div style={sectionLabelStyle}>Order Notes</div>
            <div style={{ color: '#4B5563', fontSize: '14px', lineHeight: '1.6', minHeight: '100px' }}>
              {order.notes || <em style={{ color: '#9CA3AF' }}>No notes provided for this order.</em>}
            </div>
          </div>

          {essentialOils.length > 0 && (
            <div style={cardStyle}>
              <div style={{ ...sectionLabelStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Droplets size={13} />
                Essential Oils Checklist
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {essentialOils.map((row, idx) => (
                  <div
                    key={row.product_id + idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '14px',
                      padding: '8px 0',
                      borderBottom: idx < essentialOils.length - 1 ? '1px solid #F3F4F6' : 'none',
                    }}
                  >
                    <span style={{ color: '#374151' }}>
                      {row.product_name} <span style={{ color: '#9CA3AF' }}>×{row.soap_qty}</span>
                    </span>
                    {row.oil_name ? (
                      <span style={{ fontWeight: '600', color: '#1B4332', fontSize: '13px' }}>
                        {row.oil_name}
                      </span>
                    ) : (
                      <span style={{ fontWeight: '600', color: '#DC2626', fontSize: '12px' }}>
                        No default oil
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {essentialOils.every(r => r.oil_name) && (
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#9CA3AF', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  All products have a default oil assigned.
                </div>
              )}
            </div>
          )}
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

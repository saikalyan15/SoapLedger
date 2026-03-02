import React from 'react';

const statusStyles = {
  'Order Placed':      { bg: '#F3F4F6', text: '#374151' },
  'Awaiting Payment':  { bg: '#FEF3C7', text: '#92400E' },
  'Payment Confirmed': { bg: '#DBEAFE', text: '#1E40AF' },
  'In Manufacturing':  { bg: '#F3E8FF', text: '#6B21A8' },
  'Ready to Dispatch': { bg: '#CCFBF1', text: '#0F766ED' },
  'Dispatched':        { bg: '#D8F3DC', text: '#1B4332' },
  'Delivered':         { bg: '#1B4332', text: '#FFFFFF' },
  'Cancelled':         { bg: '#FEE2E2', text: '#DC2626' },
};

const StatusBadge = ({ status }) => {
  const style = statusStyles[status] || { bg: '#F3F4F6', text: '#374151' };
  
  return (
    <span
      style={{
        backgroundColor: style.bg,
        color: style.text,
        fontSize: '11px',
        fontWeight: '700',
        padding: '4px 12px',
        borderRadius: '20px',
        display: 'inline-block',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        textTransform: 'uppercase',
        letterSpacing: '0.04em'
      }}
    >
      {status}
    </span>
  );
};

export default StatusBadge;

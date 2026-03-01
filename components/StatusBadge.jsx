import React from 'react';

const statusStyles = {
  'Received': { bg: '#FEF3C7', text: '#92400E' },
  'Payment Confirmed': { bg: '#DBEAFE', text: '#1E40AF' },
  'In Production': { bg: '#F3E8FF', text: '#6B21A8' },
  'Dispatched': { bg: '#CCFBF1', text: '#0F766E' },
  'Delivered': { bg: '#D8F3DC', text: '#1B4332' },
  'Cancelled': { bg: '#FEE2E2', text: '#DC2626' },
};

const StatusBadge = ({ status }) => {
  const style = statusStyles[status] || { bg: '#F3F4F6', text: '#374151' };

  return (
    <span
      style={{
        backgroundColor: style.bg,
        color: style.text,
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        padding: '4px 12px',
        borderRadius: '20px',
        display: 'inline-block',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
      }}
    >
      {status}
    </span>
  );
};

export default StatusBadge;

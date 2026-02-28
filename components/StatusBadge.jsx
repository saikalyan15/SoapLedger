export default function StatusBadge({ status, type = 'status' }) {
  const getColors = () => {
    if (type === 'status') {
      switch (status) {
        case 'Received': return 'bg-[#FEF3C7] text-[#92400E]';
        case 'In Progress': return 'bg-[#DBEAFE] text-[#1E40AF]';
        case 'Dispatched': return 'bg-[#CCFBF1] text-[#0F766E]';
        case 'Delivered': return 'bg-[#D8F3DC] text-[#1B4332]';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
    
    if (type === 'product') {
      switch (status) {
        case 'Active': return 'bg-[var(--color-primary-light)] text-[var(--color-primary)]';
        case 'Seasonal': return 'bg-[var(--color-accent-light)] text-[var(--color-accent)]';
        case 'Archived': return 'bg-gray-200 text-gray-500';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
    
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getColors()}`}>
      {status}
    </span>
  );
}

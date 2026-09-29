// Hover-to-reveal delete button rendered on top of a printed label, so a
// single click removes that exact instance straight from the sheet
// preview. Screen-only (no-print) — never appears in the printed output.
export function RemoveLabelButton({ onRemove }) {
  return (
    <button
      type="button"
      className="no-print remove-label-btn"
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
      title="Remove this label"
      style={{
        position: 'absolute',
        top: '0.6mm',
        right: '0.6mm',
        zIndex: 2,
        width: '3.2mm',
        height: '3.2mm',
        borderRadius: '50%',
        border: 'none',
        background: 'rgba(220,38,38,0.92)',
        color: 'white',
        fontSize: '2.4mm',
        lineHeight: 1,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
      }}
    >
      ×
    </button>
  );
}

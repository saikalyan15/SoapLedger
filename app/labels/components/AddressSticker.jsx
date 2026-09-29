import { COLORS } from '../constants';
import { RemoveLabelButton } from './RemoveLabelButton';

export function AddressSticker({ address, brandName, onRemove }) {
  return (
    <div className="address-sticker">
      {onRemove && <RemoveLabelButton onRemove={onRemove} />}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          padding: '2.5mm 3mm',
          boxSizing: 'border-box',
        }}
      >
        {/* FROM tag + brand name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5mm' }}>
          <span
            style={{
              display: 'inline-block',
              background: COLORS.brand,
              color: 'white',
              fontWeight: 800,
              fontSize: '6.5pt',
              letterSpacing: '0.1em',
              borderRadius: '0.8mm',
              padding: '0.4mm 1.5mm',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            }}
          >
            FROM
          </span>
          <div style={{ flex: 1, borderTop: `0.2mm solid ${COLORS.brand}`, opacity: 0.4 }} />
          <span style={{ fontSize: '6.5pt', fontWeight: 700, color: COLORS.brand, whiteSpace: 'nowrap' }}>
            {brandName}
          </span>
        </div>

        {/* Sender name */}
        <div style={{ fontSize: '11pt', fontWeight: 800, color: COLORS.text, lineHeight: 1.15 }}>
          {address.name}
        </div>

        {/* Address lines */}
        <div style={{ fontSize: '8.5pt', color: COLORS.text, lineHeight: 1.35, fontWeight: 500 }}>
          {address.line1}<br />
          {address.line2}<br />
          {address.line3}<br />
          {address.cityStateZip}
        </div>

        {/* Phone */}
        <div style={{ fontSize: '9pt', fontWeight: 700, color: COLORS.text }}>
          Ph: {address.phone}
        </div>
      </div>
    </div>
  );
}

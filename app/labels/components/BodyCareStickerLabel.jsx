import { COLORS, FONTS } from '../constants';
import { RemoveLabelButton } from './RemoveLabelButton';

// Round sticker for the body-care line, sized for the flat black lid of a
// jar (not wrapped around a side, so no cutout/panel geometry like the
// soap wrapper band). The per-product color fills the full circle as a
// band; a white inner disc keeps the brand mark and name legible against
// it regardless of which product's accent is showing.
export function BodyCareStickerLabel({ item, onRemove }) {
  return (
    <div className="bodycare-sticker" style={{ background: item.color }}>
      {onRemove && <RemoveLabelButton onRemove={onRemove} />}
      <div className="bodycare-sticker-disc">
        <img
          src="/logo/healing-soil-v2.1-transparent.png"
          alt=""
          style={{ width: '9.5mm', height: 'auto', marginBottom: '0.5mm' }}
        />
        <div
          style={{
            fontWeight: 700,
            color: COLORS.brand,
            fontSize: '6pt',
            lineHeight: 1.15,
            textAlign: 'center',
            fontFamily: FONTS.sans,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
          }}
        >
          {item.name}
        </div>
      </div>
    </div>
  );
}

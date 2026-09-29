import { COLORS } from '../constants';
import { stripFragrance } from '../logic';
import { RemoveLabelButton } from './RemoveLabelButton';

// The double-rule frame (dashed cut-guide outside, solid brand-green
// hairline inside) is the main "premium" signal here, at effectively zero
// extra ink — full name + full ingredients, not the 44-char mini-sticker
// blurb, since this label has the room for both.
export function PremiumProductLabel({ label, sizeMm, onRemove }) {
  const ingredientsText = label.fragranceFree ? stripFragrance(label.ingredients) : (label.ingredients || '');
  return (
    <div className="premium-label" style={{ width: `${sizeMm.width}mm`, height: `${sizeMm.height}mm` }}>
      {onRemove && <RemoveLabelButton onRemove={onRemove} />}
      <div className="premium-label-frame">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            width: '100%',
            padding: '1.5mm',
            boxSizing: 'border-box',
            textAlign: 'center',
          }}
        >
          <img
            src="/logo/healing-soil-v2.1-transparent.png"
            alt=""
            style={{ width: '11mm', height: 'auto', marginBottom: '0.6mm' }}
          />
          <div
            style={{
              fontWeight: 800,
              color: COLORS.brand,
              fontSize: '9pt',
              lineHeight: 1.15,
              marginTop: '0.2mm',
            }}
          >
            {label.product_name}
          </div>
          <div
            style={{
              width: '60%',
              borderBottom: `0.12mm solid ${COLORS.brand}`,
              opacity: 0.35,
              margin: '0.8mm 0',
            }}
          />
          <div
            style={{
              fontSize: '6pt',
              fontWeight: 500,
              color: COLORS.muted,
              lineHeight: 1.15,
              overflow: 'hidden',
            }}
          >
            {ingredientsText}
          </div>
          {label.fragranceFree && (
            <div
              style={{
                fontSize: '5pt',
                fontWeight: 800,
                color: COLORS.brand,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginTop: '0.4mm',
              }}
            >
              Fragrance-Free
            </div>
          )}
          <div
            style={{
              fontSize: '5pt',
              fontWeight: 700,
              color: COLORS.muted,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginTop: '0.8mm',
            }}
          >
            {label.weight_grams ? `${label.weight_grams}g · ` : ''}healingsoil.in
          </div>
        </div>
      </div>
    </div>
  );
}

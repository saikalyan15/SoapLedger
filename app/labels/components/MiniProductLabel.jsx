import { COLORS, MINI_TITLE_FONT_SIZE, MINI_INGREDIENT_FONT_SIZE } from '../constants';
import { getDisplayName, getMiniLabelDescription } from '../logic';
import { RemoveLabelButton } from './RemoveLabelButton';

export function MiniProductLabel({ label, license, onRemove }) {
  const ingredientText = getMiniLabelDescription(label);
  const displayName = getDisplayName(label.product_name, label.base_type);
  return (
    <div className="mini-label">
      {onRemove && <RemoveLabelButton onRemove={onRemove} />}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          height: '100%',
          padding: '0.6mm 1.5mm',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            fontWeight: 800,
            color: COLORS.brand,
            lineHeight: 1.05,
            textAlign: 'center',
            fontSize: MINI_TITLE_FONT_SIZE,
          }}
        >
          {displayName}
        </div>

        <div
          style={{
            width: '55%',
            alignSelf: 'center',
            borderBottom: `0.12mm solid ${COLORS.brand}`,
            opacity: 0.3,
            margin: '0.6mm 0',
          }}
        />

        <div
          style={{
            width: '100%',
            textAlign: 'center',
            fontSize: MINI_INGREDIENT_FONT_SIZE,
            fontWeight: 500,
            color: COLORS.text,
            lineHeight: 1.1,
            overflowWrap: 'anywhere',
            overflow: 'hidden',
          }}
        >
          {ingredientText}
        </div>
      </div>
    </div>
  );
}

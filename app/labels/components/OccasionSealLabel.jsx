import { COLORS } from '../constants';
import { RemoveLabelButton } from './RemoveLabelButton';
import { SparkleIcon, OCCASION_PRESETS } from './occasionPresets';

// Seals the "topper wrap" fold of brown paper laid over a bundle of
// already-wrapped bars, on gift/festive orders only — not stuck on the
// box exterior (that's the `address` sticker's territory) and not one
// per bar. Round, like a wax seal, one size regardless of box size.
export function OccasionSealLabel({ seal, onRemove }) {
  const preset = OCCASION_PRESETS.find((p) => p.id === seal.iconId);
  const accent = preset?.color || COLORS.brand;
  const iconEl = preset ? preset.Icon({ size: 11, color: accent }) : SparkleIcon({ size: 11, color: accent });
  return (
    <div className="seal-label">
      {onRemove && <RemoveLabelButton onRemove={onRemove} />}
      <div
        className="seal-label-frame"
        style={{ borderColor: accent, background: `${accent}14` }}
      >
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
            style={{ width: '13mm', height: 'auto', marginBottom: '1.2mm' }}
          />
          {iconEl}
          <div
            style={{
              fontWeight: 800,
              color: accent,
              fontSize: '11pt',
              lineHeight: 1.15,
              marginTop: '1.2mm',
            }}
          >
            {seal.message}
          </div>
        </div>
      </div>
    </div>
  );
}

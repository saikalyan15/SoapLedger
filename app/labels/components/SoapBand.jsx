import { COLORS, BAND_SIZES } from '../constants';

export function SoapBand({ license, size = BAND_SIZES['100g'] }) {
  const [tabL, sideL, front, sideR, tabR] = size.panelWidths;
  const totalWidth = tabL + sideL + front + sideR + tabR;

  return (
    <div className="soap-band-container">
      {/* Cutting guidelines — thin dashed line for print, text for screen */}
      <div className="cutting-guide">
        <div style={{ height: '1px', flex: 1, borderTop: '0.1mm dashed #999' }}></div>
        <span className="no-print" style={{ fontSize: '10px', color: '#999', padding: '0 8px' }}>Cut Line</span>
        <div style={{ height: '1px', flex: 1, borderTop: '0.1mm dashed #999' }}></div>
      </div>

      <div
        className="soap-band"
        style={{ width: `${totalWidth}mm`, height: `${size.height}mm` }}
      >
        {/* Notice: No white background overlay. We want the kraft paper to show through the background image natively */}

        <div
          className="band-grid"
          style={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            gridTemplateColumns: `${tabL}mm ${sideL}mm ${front}mm ${sideR}mm ${tabR}mm`,
          }}
        >
          {/* Panel 1: Left glue tab — overlaps on back */}
          <div
            className="band-panel"
            style={{
              padding: '2mm',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-start',
            }}
          >
            <span style={{ fontSize: '5pt', color: COLORS.muted }}>
              healingsoil.in
            </span>
          </div>

          {/* Panel 2: Left side */}
          <div className="band-panel" />

          {/* Panel 3: Front face */}
          <div
            className="band-panel"
            style={{
              padding: '1.5mm 2mm',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              textAlign: 'center',
              height: '100%',
              boxSizing: 'border-box',
            }}
          >
            {/* Logo at Top — safely away from cut line */}
            <img
              src="/logo/healing-soil-v2.1.png"
              style={{ width: `${size.logoWidth}mm`, height: 'auto' }}
            />

            {/* Clear space for sticker in middle */}
            <div style={{ flex: 1 }}></div>

            {/* Udyam at Bottom — safely away from cut line */}
            <div
              style={{
                fontSize: '5pt',
                fontWeight: 800,
                color: COLORS.text,
                letterSpacing: '0.05em',
                padding: '0.1mm 1mm',
              }}
            >
              {license}
            </div>
          </div>

          {/* Panel 4: Right side */}
          <div className="band-panel" />

          {/* Panel 5: Right glue tab — overlaps on back */}
          <div className="band-panel" />
        </div>
      </div>

      {/* Print-only cutting guides */}
      <div className="print-guide only-print"></div>
    </div>
  );
}

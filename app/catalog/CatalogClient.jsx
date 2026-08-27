'use client';

import { useMemo, useState } from 'react';
import { Download, Check } from 'lucide-react';
import { LANGUAGES, UI } from '@/lib/catalog/catalog-content';

const GREEN = '#1B4332';
const GOLD = '#B8860B';
const CREAM = '#F7F3EA';
const INK = '#3A3A34';

export default function CatalogClient({ sections, brand }) {
  const [lang, setLang] = useState('en');
  const [showPrices, setShowPrices] = useState(false);

  const t = UI[lang];
  const allProducts = useMemo(
    () => sections.flatMap((s) => s.products),
    [sections],
  );
  const hasAnyPrice = allProducts.some((p) => p.price != null);
  const totalCount = allProducts.length;

  return (
    <div className="catalog" data-lang={lang}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Noto+Serif+Devanagari:wght@500;600&family=Noto+Sans+Devanagari:wght@400;500;600&family=Noto+Serif+Kannada:wght@500;600&family=Noto+Sans+Kannada:wght@400;500;600&display=swap');

        .catalog {
          --font-display: 'DM Serif Display', Georgia, serif;
          --font-body: 'Plus Jakarta Sans', system-ui, sans-serif;
          background: ${CREAM};
          min-height: 100vh;
          color: ${INK};
          font-family: var(--font-body);
        }
        .catalog[data-lang='hi'] {
          --font-display: 'Noto Serif Devanagari', Georgia, serif;
          --font-body: 'Noto Sans Devanagari', system-ui, sans-serif;
        }
        .catalog[data-lang='kn'] {
          --font-display: 'Noto Serif Kannada', Georgia, serif;
          --font-body: 'Noto Sans Kannada', system-ui, sans-serif;
        }

        /* ---------- Control bar (screen only) ---------- */
        .cat-bar {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 14px;
          padding: 14px 20px;
          background: rgba(247, 243, 234, 0.92);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid rgba(27, 67, 50, 0.14);
        }
        .cat-seg {
          display: inline-flex;
          background: #fff;
          border: 1px solid rgba(27, 67, 50, 0.18);
          border-radius: 999px;
          padding: 3px;
        }
        .cat-seg button {
          border: none;
          background: transparent;
          padding: 7px 16px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          color: ${GREEN};
          cursor: pointer;
          font-family: inherit;
        }
        .cat-seg button[data-on='true'] {
          background: ${GREEN};
          color: #fff;
        }
        .cat-check {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: ${GREEN};
          cursor: pointer;
          user-select: none;
        }
        .cat-check input { width: 16px; height: 16px; accent-color: ${GREEN}; cursor: pointer; }
        .cat-check[data-disabled='true'] { opacity: 0.4; cursor: not-allowed; }
        .cat-dl {
          margin-left: auto;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: ${GREEN};
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 9px 18px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          box-shadow: 0 2px 10px rgba(27, 67, 50, 0.25);
        }
        .cat-hint { font-size: 12px; color: ${GREEN}; opacity: 0.65; width: 100%; margin: 0; }

        /* ---------- Document ---------- */
        .cat-doc {
          max-width: 900px;
          margin: 28px auto 60px;
          background: #fff;
          box-shadow: 0 6px 40px rgba(27, 67, 50, 0.12);
        }
        .cat-page { padding: 56px 56px 48px; }

        /* ---------- Cover ---------- */
        .cover { text-align: center; }
        .cover-mark {
          width: 190px;
          height: auto;
          margin: 4px auto 30px;
          display: block;
        }
        .cover-kicker {
          font-size: 12px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: ${GOLD};
          font-weight: 700;
          margin: 0 0 14px;
        }
        .cover-title {
          font-family: var(--font-display);
          font-weight: 500;
          color: ${GREEN};
          font-size: 42px;
          line-height: 1.15;
          margin: 0 0 16px;
        }
        .cover-tagline {
          font-size: 14px;
          color: ${INK};
          opacity: 0.8;
          margin: 0 auto 34px;
          max-width: 460px;
        }
        .cover-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin: 0 0 36px;
        }
        .cover-strip img {
          width: 100%;
          aspect-ratio: 3 / 4;
          object-fit: cover;
          border-radius: 12px;
          border: 1px solid rgba(27, 67, 50, 0.12);
        }
        .cover-ethos {
          text-align: left;
          border-top: 1px solid rgba(27, 67, 50, 0.16);
          border-bottom: 1px solid rgba(27, 67, 50, 0.16);
          padding: 26px 0;
          margin: 0 0 24px;
        }
        .cover-ethos h2 {
          font-family: var(--font-display);
          font-weight: 500;
          color: ${GREEN};
          font-size: 22px;
          margin: 0 0 10px;
        }
        .cover-ethos p {
          font-size: 13.5px;
          line-height: 1.7;
          margin: 0;
          color: ${INK};
        }
        .cover-foot {
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: ${GREEN};
          opacity: 0.7;
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
          border-top: 1px solid rgba(27, 67, 50, 0.16);
          padding-top: 22px;
        }
        .cover-foot span:not(:last-child)::after { content: '·'; margin-left: 10px; opacity: 0.5; }

        /* ---------- Sections + soaps ---------- */
        .section { padding-top: 8px; }
        .section + .section { margin-top: 46px; }
        .section-head {
          display: flex;
          align-items: baseline;
          gap: 14px;
          margin: 0 0 24px;
        }
        .section-head h2 {
          font-family: var(--font-display);
          font-weight: 500;
          color: ${GREEN};
          font-size: 26px;
          margin: 0;
          white-space: nowrap;
        }
        .section-head .rule { flex: 1; height: 1px; background: rgba(27, 67, 50, 0.2); }
        .section-head .count { font-size: 12px; color: ${GOLD}; font-weight: 700; }

        .soap {
          display: grid;
          grid-template-columns: 32% 1fr;
          gap: 24px;
          padding: 20px 0;
          align-items: start;
        }
        .soap + .soap { border-top: 1px solid rgba(27, 67, 50, 0.12); }
        .soap-photo {
          width: 100%;
          aspect-ratio: 1 / 1;
          object-fit: cover;
          border-radius: 12px;
          border: 1px solid rgba(27, 67, 50, 0.12);
        }
        .soap-name {
          font-family: var(--font-display);
          font-weight: 500;
          color: ${GREEN};
          font-size: 23px;
          line-height: 1.2;
          margin: 2px 0 8px;
        }
        .soap-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 12px;
          flex-wrap: wrap;
        }
        .chip {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: ${GREEN};
          background: ${CREAM};
          border: 1px solid rgba(27, 67, 50, 0.15);
          border-radius: 999px;
          padding: 4px 10px;
        }
        .soap-price { font-size: 13px; font-weight: 700; color: ${INK}; }
        .soap-desc { font-size: 13.5px; line-height: 1.65; margin: 0 0 14px; color: ${INK}; }
        .soap-divider { height: 1px; background: rgba(27, 67, 50, 0.12); margin: 0 0 12px; }
        .soap-block { margin: 0 0 12px; }
        .soap-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${GOLD};
          margin: 0 0 5px;
        }
        .soap-ing { font-size: 12.5px; line-height: 1.55; margin: 0; color: ${INK}; }

        @media (max-width: 720px) {
          .cat-page { padding: 32px 22px; }
          .cover-title { font-size: 32px; }
          .soap { grid-template-columns: 1fr; gap: 14px; }
          .soap-photo { max-width: 260px; }
        }

        /* ---------- Print ---------- */
        @media print {
          @page { size: A4; margin: 12mm 13mm; }
          .no-print { display: none !important; }
          .catalog { background: #fff; }
          .cat-doc {
            max-width: none;
            margin: 0;
            box-shadow: none;
          }
          .cat-page { padding: 0; }
          .cover {
            min-height: 250mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            break-after: page;
          }
          .cover-strip img, .soap-photo, .cover-mark { break-inside: avoid; }
          .section { break-before: page; padding-top: 0; }
          .section:first-of-type { break-before: auto; }
          .section + .section { margin-top: 0; }
          .soap { break-inside: avoid; }
          .section-head h2, .soap-name, .cover-title, .cover-ethos h2 {
            color: ${GREEN} !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* ---------- Controls ---------- */}
      <div className="cat-bar no-print">
        <div className="cat-seg" role="group" aria-label="Language">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              data-on={lang === l.code}
              onClick={() => setLang(l.code)}
            >
              {l.native}
            </button>
          ))}
        </div>

        <label
          className="cat-check"
          data-disabled={!hasAnyPrice}
          title={
            hasAnyPrice
              ? ''
              : 'Add 50 g prices in lib/catalog/catalog-content.js to enable this'
          }
        >
          <input
            type="checkbox"
            checked={showPrices && hasAnyPrice}
            disabled={!hasAnyPrice}
            onChange={(e) => setShowPrices(e.target.checked)}
          />
          {lang === 'hi' ? 'मूल्य दिखाएँ' : lang === 'kn' ? 'ಬೆಲೆ ತೋರಿಸಿ' : 'Show prices'}
        </label>

        <button className="cat-dl" onClick={() => window.print()}>
          <Download size={15} />
          {lang === 'hi' ? 'PDF डाउनलोड करें' : lang === 'kn' ? 'PDF ಡೌನ್‌ಲೋಡ್' : 'Download PDF'}
        </button>

        <p className="cat-hint">
          {lang === 'hi'
            ? 'प्रिंट डायलॉग में “Save as PDF” चुनें। पृष्ठभूमि ग्राफ़िक्स चालू रखें।'
            : lang === 'kn'
              ? 'ಪ್ರಿಂಟ್ ಡೈಲಾಗ್‌ನಲ್ಲಿ “Save as PDF” ಆಯ್ಕೆಮಾಡಿ. ಬ್ಯಾಕ್‌ಗ್ರೌಂಡ್ ಗ್ರಾಫಿಕ್ಸ್ ಆನ್ ಇರಲಿ.'
              : 'Choose “Save as PDF” as the destination in the print dialog, and keep “Background graphics” on.'}
        </p>
      </div>

      {/* ---------- Document ---------- */}
      <div className="cat-doc">
        <div className="cat-page">
          {/* Cover */}
          <section className="cover">
            <img
              className="cover-mark"
              src="/logo/healing-soil-v2.1-transparent.png"
              alt={brand?.name || 'Healing Soil'}
            />
            <p className="cover-kicker">{t.coverKicker}</p>
            <h1 className="cover-title">{t.title}</h1>
            <p className="cover-tagline">{t.tagline}</p>

            <div className="cover-strip">
              <img src="/50g-soap-squares/images/neem-tulsi-glycerine-50g.png" alt="" />
              <img src="/50g-soap-squares/images/kesar-gulab-sheabutter-50g.png" alt="" />
              <img src="/50g-soap-squares/images/orange-goatmilk-50g.png" alt="" />
            </div>

            <div className="cover-ethos">
              <h2>{t.ethosHeading}</h2>
              <p>{t.ethosBody}</p>
            </div>

            <div className="cover-foot">
              <span>{brand?.website || 'healingsoil.in'}</span>
              <span>{t.madeIn}</span>
              {brand?.license && <span>{brand.license}</span>}
            </div>
          </section>

          {/* Sections */}
          {sections.map((section) => (
            <section className="section" key={section.key}>
              <div className="section-head">
                <h2>{t.base[section.key] || section.key}</h2>
                <div className="rule" />
                <span className="count">
                  {String(section.products.length).padStart(2, '0')}
                </span>
              </div>

              {section.products.map((p) => {
                const c = p.content[lang] || p.content.en;
                return (
                  <article className="soap" key={p.slug}>
                    <img className="soap-photo" src={p.image} alt={c.name} />
                    <div>
                      <h3 className="soap-name">{c.name}</h3>
                      <div className="soap-meta">
                        <span className="chip">{t.weight}</span>
                        {showPrices && hasAnyPrice && p.price != null && (
                          <span className="soap-price">₹{p.price}</span>
                        )}
                      </div>
                      <p className="soap-desc">{c.description}</p>
                      <div className="soap-divider" />
                      <div className="soap-block">
                        <p className="soap-label">{t.ingredients}</p>
                        <p className="soap-ing">{c.ingredients}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          ))}
        </div>
      </div>

      {/* tiny screen-only footer */}
      <p
        className="no-print"
        style={{
          textAlign: 'center',
          fontSize: 12,
          color: GREEN,
          opacity: 0.55,
          margin: '0 0 40px',
        }}
      >
        <Check size={12} style={{ verticalAlign: 'middle' }} /> {totalCount} soaps ·{' '}
        {LANGUAGES.find((l) => l.code === lang)?.label}
      </p>
    </div>
  );
}

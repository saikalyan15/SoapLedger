'use client';

import React, { useMemo, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';

const VIEWBOX_WIDTH = 320;
const VIEWBOX_HEIGHT = 340;

const colorForCount = (count, maxCount) => {
  if (!count) return '#F3F1EA';
  const intensity = maxCount > 0 ? count / maxCount : 0;
  const lightness = 90 - intensity * 58;
  return `hsl(152, 32%, ${lightness}%)`;
};

export default function OrdersMap({ geo, locations }) {
  const [hovered, setHovered] = useState(null);
  const { byState = [], byCity = [] } = locations || {};

  const countByState = useMemo(() => {
    const map = new Map();
    byState.forEach((row) => map.set(row.state, row.order_count));
    return map;
  }, [byState]);

  const maxCount = useMemo(
    () => byState.reduce((max, row) => Math.max(max, row.order_count), 0),
    [byState],
  );

  const { features, pathFor } = useMemo(() => {
    if (!geo) return { features: [], pathFor: null };
    const projection = geoMercator().fitSize([VIEWBOX_WIDTH, VIEWBOX_HEIGHT], geo);
    return { features: geo.features, pathFor: geoPath(projection) };
  }, [geo]);

  const topCities = byCity.slice(0, 6);

  if (byState.length === 0) {
    return (
      <article className="money-panel money-map-panel">
        <div className="money-panel-heading">
          <div>
            <h2>Where orders ship</h2>
            <p>Distinct orders by destination state</p>
          </div>
        </div>
        <div className="money-empty">No shipments have a recorded state yet</div>
      </article>
    );
  }

  return (
    <article className="money-panel money-map-panel">
      <div className="money-panel-heading">
        <div>
          <h2>Where orders ship</h2>
          <p>Distinct orders by destination state</p>
        </div>
      </div>
      <div className="money-map-body">
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className="money-map-svg"
          role="img"
          aria-label="Orders by Indian state"
        >
          {features.map((feature) => {
            const name = feature.properties.st_nm;
            const count = countByState.get(name) || 0;
            return (
              <path
                key={name}
                d={pathFor(feature)}
                fill={colorForCount(count, maxCount)}
                stroke="#fff"
                strokeWidth={0.6}
                onMouseEnter={() => setHovered({ name, count })}
                onMouseLeave={() => setHovered(null)}
              >
                <title>{`${name}: ${count} order${count === 1 ? '' : 's'}`}</title>
              </path>
            );
          })}
        </svg>
        <div className="money-map-side">
          <div className="money-map-hovered">
            {hovered ? (
              <>
                <strong>{hovered.name}</strong>
                <span>{hovered.count} order{hovered.count === 1 ? '' : 's'}</span>
              </>
            ) : (
              <span className="money-map-hint">Hover a state for its order count</span>
            )}
          </div>
          <div className="money-map-cities">
            <h3>Top cities</h3>
            {topCities.map((c) => (
              <div key={`${c.city}-${c.state}`}>
                <span>{c.city}</span>
                <strong>{c.order_count}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

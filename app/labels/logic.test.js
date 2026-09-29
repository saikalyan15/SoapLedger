import { describe, expect, it } from 'vitest';
import {
  getDisplayName,
  getMiniLabelDescription,
  stripFragrance,
  computeWeightedCounts,
  computePagination,
} from './logic';

describe('getDisplayName', () => {
  it('strips the base type when it appears in the product name', () => {
    expect(getDisplayName('Neem Tulsi Glycerine Soap', 'Glycerine')).toBe('Neem Tulsi Soap');
  });

  it('matches "Glycerin" (no trailing e) as well as "Glycerine"', () => {
    expect(getDisplayName('Rose Glycerin Soap', 'Glycerine')).toBe('Rose Soap');
  });

  it('matches "Sheabutter" with no space, same as "Shea Butter"', () => {
    expect(getDisplayName('Lavender Sheabutter Soap', 'Shea Butter')).toBe('Lavender Soap');
  });

  it('returns the name unchanged when the base type has no pattern', () => {
    expect(getDisplayName('Charcoal Detox Soap', 'Charcoal')).toBe('Charcoal Detox Soap');
  });

  it('returns the name unchanged when stripping would leave only "Soap"/"Soaps"', () => {
    expect(getDisplayName('Loofah Soap', 'Loofah')).toBe('Loofah Soap');
    expect(getDisplayName('Loofah Soaps', 'Loofah')).toBe('Loofah Soaps');
  });

  it('returns the name unchanged when productName is falsy', () => {
    expect(getDisplayName('', 'Glycerine')).toBe('');
    expect(getDisplayName(undefined, 'Glycerine')).toBe(undefined);
  });
});

describe('getMiniLabelDescription', () => {
  it('returns the trimmed mini_label_description when present', () => {
    expect(getMiniLabelDescription({ mini_label_description: '  Gentle daily bar  ' })).toBe('Gentle daily bar');
  });

  it('falls back to "Handmade soap" when missing or blank', () => {
    expect(getMiniLabelDescription({})).toBe('Handmade soap');
    expect(getMiniLabelDescription({ mini_label_description: '   ' })).toBe('Handmade soap');
  });
});

describe('stripFragrance', () => {
  it('drops any segment mentioning "essential oil"', () => {
    expect(stripFragrance('Coconut Oil, Tulsi Essential Oil, Shea Butter')).toBe('Coconut Oil, Shea Butter');
  });

  it('is case-insensitive and matches any wording containing the phrase', () => {
    expect(stripFragrance('Neem Oil, ESSENTIAL OIL BLEND, Glycerine')).toBe('Neem Oil, Glycerine');
  });

  it('leaves ingredients unchanged when no segment mentions essential oil', () => {
    expect(stripFragrance('Coconut Oil, Shea Butter, Glycerine')).toBe('Coconut Oil, Shea Butter, Glycerine');
  });

  it('passes through empty/undefined input unchanged', () => {
    expect(stripFragrance('')).toBe('');
    expect(stripFragrance(undefined)).toBe(undefined);
  });
});

describe('computeWeightedCounts', () => {
  it('splits evenly across equal-weight products', () => {
    const products = [{ units_sold: 5 }, { units_sold: 5 }];
    expect(computeWeightedCounts(products, 10)).toEqual([5, 5]);
  });

  it('gives a heavily-sold product a proportionally larger share', () => {
    const products = [{ units_sold: 90 }, { units_sold: 9 }];
    const counts = computeWeightedCounts(products, 10);
    expect(counts[0]).toBeGreaterThan(counts[1]);
    expect(counts[0] + counts[1]).toBe(10);
  });

  it('gives a zero-sales product a share via +1 smoothing, not zero', () => {
    const products = [{ units_sold: 0 }, { units_sold: 0 }, { units_sold: 0 }];
    const counts = computeWeightedCounts(products, 3);
    expect(counts).toEqual([1, 1, 1]);
  });

  it('returns all zeros when target is 0', () => {
    const products = [{ units_sold: 10 }, { units_sold: 5 }];
    expect(computeWeightedCounts(products, 0)).toEqual([0, 0]);
  });

  it('returns all zeros when there are no products', () => {
    expect(computeWeightedCounts([], 10)).toEqual([]);
  });

  it('always sums exactly to target even when division does not divide evenly', () => {
    const products = [{ units_sold: 1 }, { units_sold: 1 }, { units_sold: 1 }];
    const counts = computeWeightedCounts(products, 10);
    expect(counts.reduce((sum, n) => sum + n, 0)).toBe(10);
  });
});

describe('computePagination', () => {
  it('reports zero free slots when the queue is an exact multiple of labelsPerPage', () => {
    const queue = Array.from({ length: 20 }, (_, i) => ({ uid: i }));
    const result = computePagination(queue, 10);
    expect(result.pages).toHaveLength(2);
    expect(result.totalLabels).toBe(20);
    expect(result.lastPageCount).toBe(10);
    expect(result.freeOnLastPage).toBe(0);
  });

  it('reports the remainder on a partially-filled last page', () => {
    const queue = Array.from({ length: 23 }, (_, i) => ({ uid: i }));
    const result = computePagination(queue, 10);
    expect(result.pages).toHaveLength(3);
    expect(result.lastPageCount).toBe(3);
    expect(result.freeOnLastPage).toBe(7);
  });

  it('returns no pages and zero free slots for an empty queue', () => {
    const result = computePagination([], 10);
    expect(result.pages).toHaveLength(0);
    expect(result.totalLabels).toBe(0);
    expect(result.lastPageCount).toBe(0);
    expect(result.freeOnLastPage).toBe(0);
  });
});

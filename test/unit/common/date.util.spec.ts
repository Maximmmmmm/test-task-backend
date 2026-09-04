import {
  fullYearsWorked,
  isDateBefore,
  isValidIsoDate,
} from '../../../src/common/date.util.js';

describe('date util', () => {
  describe('isValidIsoDate', () => {
    it.each([
      ['2020-01-15', true],
      ['2020-02-29', true],
      ['2021-02-29', false],
      ['2020-02-30', false],
      ['2020-13-01', false],
      ['2020-00-10', false],
      ['20-01-01', false],
      ['2020-1-1', false],
      ['2020/01/01', false],
      ['not-a-date', false],
    ])('%s -> %s', (value, expected) => {
      expect(isValidIsoDate(value)).toBe(expected);
    });
  });

  describe('fullYearsWorked', () => {
    it('counts whole calendar years', () => {
      expect(fullYearsWorked('2020-01-01', '2021-01-01')).toBe(1);
      expect(fullYearsWorked('2020-01-15', '2025-01-14')).toBe(4);
      expect(fullYearsWorked('2020-01-15', '2025-01-15')).toBe(5);
      expect(fullYearsWorked('2020-06-30', '2020-12-31')).toBe(0);
      expect(fullYearsWorked('2020-03-01', '2024-02-29')).toBe(3);
    });
  });

  describe('isDateBefore', () => {
    it('compares ISO dates lexicographically', () => {
      expect(isDateBefore('2020-01-01', '2021-01-01')).toBe(true);
      expect(isDateBefore('2021-01-01', '2020-01-01')).toBe(false);
      expect(isDateBefore('2020-01-01', '2020-01-01')).toBe(false);
    });
  });
});
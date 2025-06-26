import { incrementVersion } from './versionUtils';

describe('incrementVersion', () => {
  test('should increment a two-part version number correctly', () => {
    expect(incrementVersion('1.0')).toBe('1.1');
    expect(incrementVersion('1.9')).toBe('1.10');
    expect(incrementVersion('2.5')).toBe('2.6');
  });

  test('should increment a single-part version number by adding .0', () => {
    expect(incrementVersion('1')).toBe('2.0');
    expect(incrementVersion('5')).toBe('6.0');
  });

  test('should handle versions with more than two parts (and not increment them)', () => {
    expect(incrementVersion('1.0.0')).toBe('1.0.0');
    expect(incrementVersion('1.2.3.4')).toBe('1.2.3.4');
  });

  test('should return the same version for invalid formats', () => {
    expect(incrementVersion('abc')).toBe('abc');
    expect(incrementVersion('')).toBe('');
    expect(incrementVersion(null)).toBe(null);
    expect(incrementVersion(undefined)).toBe(undefined);
  });
});
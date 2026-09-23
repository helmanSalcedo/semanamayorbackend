import { parseDurationMs } from './duration.util';

describe('parseDurationMs', () => {
  it('parses seconds, minutes, hours and days', () => {
    expect(parseDurationMs('30s')).toBe(30_000);
    expect(parseDurationMs('15m')).toBe(15 * 60_000);
    expect(parseDurationMs('2h')).toBe(2 * 3_600_000);
    expect(parseDurationMs('7d')).toBe(7 * 86_400_000);
  });

  it('rejects malformed durations', () => {
    expect(() => parseDurationMs('15')).toThrow();
    expect(() => parseDurationMs('15x')).toThrow();
    expect(() => parseDurationMs('m15')).toThrow();
  });
});

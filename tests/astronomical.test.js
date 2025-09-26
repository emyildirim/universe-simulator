const { 
  validateParallax, 
  formatCoordinates, 
  convertDistance, 
  degreesToHMS, 
  degreesToDMS 
} = require('../utils/astronomical');

describe('Astronomical Utilities', () => {
  
  describe('validateParallax', () => {
    test('should validate good parallax measurements', () => {
      const result = validateParallax(10.0, 1.0); // SNR = 10
      expect(result.isValid).toBe(true);
      expect(result.distance).toBeCloseTo(100, 1); // 1000/10 = 100 pc
      expect(result.method).toBe('trigonometric_parallax');
    });

    test('should handle negative parallax', () => {
      const result = validateParallax(-2.0, 1.0);
      expect(result.isValid).toBe(false);
      expect(result.method).toBe('photogeometric_estimate');
      expect(result.distance).toBeGreaterThan(0);
    });

    test('should handle low SNR parallax', () => {
      const result = validateParallax(1.0, 1.0); // SNR = 1
      expect(result.isValid).toBe(false);
      expect(result.method).toBe('photogeometric_estimate');
    });
  });

  describe('formatCoordinates', () => {
    test('should format coordinates correctly', () => {
      const coords = formatCoordinates(101.287, -16.716, 'ICRS');
      expect(coords.ra_deg).toBeCloseTo(101.287, 3);
      expect(coords.dec_deg).toBeCloseTo(-16.716, 3);
      expect(coords.frame).toBe('ICRS');
      expect(coords.ra_hms).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{2}$/);
      expect(coords.dec_dms).toMatch(/^[+-]\d{2}:\d{2}:\d{2}\.\d$/);
    });

    test('should normalize RA to 0-360 range', () => {
      const coords = formatCoordinates(380.5, 10.0);
      expect(coords.ra_deg).toBeCloseTo(20.5, 1);
    });

    test('should clamp declination to valid range', () => {
      const coords = formatCoordinates(0, 95);
      expect(coords.dec_deg).toBe(90);
    });
  });

  describe('convertDistance', () => {
    test('should convert parsecs to astronomical units', () => {
      const au = convertDistance(1, 'pc', 'au');
      expect(au).toBeCloseTo(206264.806, 1);
    });

    test('should convert parsecs to light years', () => {
      const ly = convertDistance(1, 'pc', 'ly');
      expect(ly).toBeCloseTo(3.26156, 4);
    });

    test('should handle same unit conversion', () => {
      const pc = convertDistance(10, 'pc', 'pc');
      expect(pc).toBe(10);
    });

    test('should throw error for unknown units', () => {
      expect(() => convertDistance(1, 'unknown', 'pc')).toThrow();
    });
  });

  describe('coordinate formatting', () => {
    test('degreesToHMS should format correctly', () => {
      const hms = degreesToHMS(101.287);
      expect(hms).toBe('06:45:08.88');
    });

    test('degreesToDMS should format positive declination', () => {
      const dms = degreesToDMS(38.784);
      expect(dms).toBe('+38:47:02.4');
    });

    test('degreesToDMS should format negative declination', () => {
      const dms = degreesToDMS(-16.716);
      expect(dms).toBe('-16:42:57.6');
    });
  });
});
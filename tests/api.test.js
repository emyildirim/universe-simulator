const request = require('supertest');
const app = require('../server');

describe('API Endpoints', () => {
  
  describe('Health Check', () => {
    test('GET /api/health should return status OK', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Gaia API', () => {
    test('GET /api/gaia/stars should return star data', async () => {
      const response = await request(app)
        .get('/api/gaia/stars?limit=5&mag_max=10')
        .expect(200);
      
      expect(response.body.query_info).toBeDefined();
      expect(response.body.query_info.coordinate_frame).toBe('ICRS');
      expect(response.body.query_info.distance_unit).toBe('parsecs');
      expect(response.body.stars).toBeDefined();
      expect(Array.isArray(response.body.stars)).toBe(true);
      expect(response.body.stars.length).toBeLessThanOrEqual(5);
    });

    test('should validate limit parameter', async () => {
      const response = await request(app)
        .get('/api/gaia/stars?limit=50000')
        .expect(400);
      
      expect(response.body.error).toContain('Limit too high');
    });

    test('GET /api/gaia/tiles should return tile data', async () => {
      const response = await request(app)
        .get('/api/gaia/tiles/2/1/1')
        .expect(200);
      
      expect(response.body.tile_info).toBeDefined();
      expect(response.body.tile_info.coordinate_frame).toBe('ICRS');
      expect(response.body.stars).toBeDefined();
      expect(Array.isArray(response.body.stars)).toBe(true);
    });
  });

  describe('Ephemeris API', () => {
    test('GET /api/ephemeris/body/:id should return ephemeris data', async () => {
      const response = await request(app)
        .get('/api/ephemeris/body/Mars')
        .expect(200);
      
      expect(response.body.body_info).toBeDefined();
      expect(response.body.body_info.coordinate_system).toBe('J2000 Ecliptic');
      expect(response.body.ephemeris).toBeDefined();
      expect(Array.isArray(response.body.ephemeris)).toBe(true);
    });

    test('GET /api/ephemeris/current-positions should return current positions', async () => {
      const response = await request(app)
        .get('/api/ephemeris/current-positions')
        .expect(200);
      
      expect(response.body.coordinate_system).toBe('J2000 Ecliptic');
      expect(response.body.bodies).toBeDefined();
      expect(Array.isArray(response.body.bodies)).toBe(true);
      expect(response.body.bodies.length).toBeGreaterThan(0);
    });

    test('GET /api/ephemeris/elements/:id should return orbital elements', async () => {
      const response = await request(app)
        .get('/api/ephemeris/elements/Earth')
        .expect(200);
      
      expect(response.body.reference_frame).toBe('J2000 Ecliptic');
      expect(response.body.elements).toBeDefined();
      expect(response.body.elements.a).toBeDefined(); // Semi-major axis
    });
  });

  describe('Exoplanets API', () => {
    test('GET /api/exoplanets/confirmed should return exoplanet data', async () => {
      const response = await request(app)
        .get('/api/exoplanets/confirmed?limit=10')
        .expect(200);
      
      expect(response.body.query_info).toBeDefined();
      expect(response.body.query_info.coordinate_frame).toBe('ICRS');
      expect(response.body.exoplanets).toBeDefined();
      expect(Array.isArray(response.body.exoplanets)).toBe(true);
    });

    test('GET /api/exoplanets/by-method/:method should filter by discovery method', async () => {
      const response = await request(app)
        .get('/api/exoplanets/by-method/Transit?limit=5')
        .expect(200);
      
      expect(response.body.discovery_method).toBe('Transit');
      expect(response.body.exoplanets).toBeDefined();
      expect(Array.isArray(response.body.exoplanets)).toBe(true);
    });

    test('should validate discovery method', async () => {
      const response = await request(app)
        .get('/api/exoplanets/by-method/InvalidMethod')
        .expect(400);
      
      expect(response.body.error).toContain('Invalid discovery method');
    });

    test('GET /api/exoplanets/habitable-zone should return habitable exoplanets', async () => {
      const response = await request(app)
        .get('/api/exoplanets/habitable-zone?distance_max=50&limit=10')
        .expect(200);
      
      expect(response.body.search_criteria).toBeDefined();
      expect(response.body.exoplanets).toBeDefined();
      expect(Array.isArray(response.body.exoplanets)).toBe(true);
    });
  });

  describe('SIMBAD API', () => {
    test('GET /api/simbad/resolve/:name should resolve known objects', async () => {
      const response = await request(app)
        .get('/api/simbad/resolve/Sirius')
        .expect(200);
      
      expect(response.body.query.resolved_name).toBe('HD 48915');
      expect(response.body.object_data.coordinates.frame).toBe('ICRS');
      expect(response.body.object_data.distance).toBeDefined();
    });

    test('should return 404 for unknown objects', async () => {
      const response = await request(app)
        .get('/api/simbad/resolve/UnknownObject123456')
        .expect(404);
      
      expect(response.body.error).toContain('not found');
    });

    test('GET /api/simbad/cone-search should perform cone search', async () => {
      const response = await request(app)
        .get('/api/simbad/cone-search?ra=101.287&dec=-16.716&radius=5')
        .expect(200);
      
      expect(response.body.search_parameters).toBeDefined();
      expect(response.body.search_parameters.coordinate_frame).toBe('ICRS');
      expect(response.body.results.objects).toBeDefined();
      expect(Array.isArray(response.body.results.objects)).toBe(true);
    });

    test('should validate cone search parameters', async () => {
      const response = await request(app)
        .get('/api/simbad/cone-search')
        .expect(400);
      
      expect(response.body.error).toContain('ra and dec parameters are required');
    });

    test('GET /api/simbad/by-type/:type should search by object type', async () => {
      const response = await request(app)
        .get('/api/simbad/by-type/star?limit=10')
        .expect(200);
      
      expect(response.body.object_type).toBe('Star');
      expect(response.body.objects).toBeDefined();
      expect(Array.isArray(response.body.objects)).toBe(true);
    });
  });
});
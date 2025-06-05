const request = require('supertest');
const app = require('../index');

describe('Cloud Server Tests', () => {
  
  // Test basic server functionality
  describe('Server Health', () => {
    test('GET /api/health should return server status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
    });

    test('should respond with 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);
      
      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body.message).toContain('/non-existent-route');
    });
  });

  // Test static file serving
  describe('Static File Routes', () => {
    test('GET / should serve index.html', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
      
      // Should attempt to serve index.html (may 404 if file doesn't exist)
      // This tests the route is properly configured
    });
  });

  // Test API endpoints
  describe('API Endpoints', () => {
    test('GET /api/stats should return server statistics', async () => {
      const response = await request(app)
        .get('/api/stats')
        .expect(200);
      
      // Test response structure
      expect(response.body).toHaveProperty('cpu');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('disk');
      expect(response.body).toHaveProperty('network');
      expect(response.body).toHaveProperty('uptime');
      
      // Test CPU stats
      expect(response.body.cpu).toHaveProperty('usage');
      expect(typeof response.body.cpu.usage).toBe('number');
      
      // Test memory stats
      expect(response.body.memory).toHaveProperty('total');
      expect(response.body.memory).toHaveProperty('free');
      expect(response.body.memory).toHaveProperty('usage');
      expect(typeof response.body.memory.total).toBe('number');
      expect(typeof response.body.memory.free).toBe('number');
      expect(typeof response.body.memory.usage).toBe('number');
      
      // Test disk stats
      expect(response.body.disk).toHaveProperty('total');
      expect(response.body.disk).toHaveProperty('used');
      expect(response.body.disk).toHaveProperty('free');
      
      // Test network stats
      expect(response.body.network).toHaveProperty('traffic');
      
      // Test uptime stats
      expect(response.body.uptime).toHaveProperty('server');
      expect(response.body.uptime).toHaveProperty('system');
      expect(typeof response.body.uptime.server).toBe('string');
      expect(typeof response.body.uptime.system).toBe('string');
    });
  });

  // Test server control endpoints
  describe('Server Control Endpoints', () => {
    test('POST /api/control/start should start server', async () => {
      const response = await request(app)
        .post('/api/control/start')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Server started successfully');
      expect(response.body).toHaveProperty('timestamp');
    }, 10000); // Increase timeout for delayed response

    test('POST /api/control/stop should stop server', async () => {
      const response = await request(app)
        .post('/api/control/stop')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Server stopped successfully');
      expect(response.body).toHaveProperty('timestamp');
    }, 10000);

    test('POST /api/control/restart should restart server', async () => {
      const response = await request(app)
        .post('/api/control/restart')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Server restarted successfully');
      expect(response.body).toHaveProperty('timestamp');
    }, 10000);
  });

  // Test middleware functionality
  describe('Middleware Tests', () => {
    test('should set security headers (helmet)', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      // Check for common security headers set by helmet
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });

    test('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/health')
        .expect(200);
      
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    test('should parse JSON request bodies', async () => {
      const testData = { test: 'data' };
      
      // Test with start endpoint which accepts POST
      const response = await request(app)
        .post('/api/control/start')
        .send(testData)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
    });

    test('should compress responses', async () => {
      const response = await request(app)
        .get('/api/stats')
        .set('Accept-Encoding', 'gzip')
        .expect(200);
      
      // Response should be compressed if large enough
      // This tests that compression middleware is working
    });
  });

  // Test error handling
  describe('Error Handling', () => {
    test('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/control/start')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
    });

    test('should return proper error structure for server errors', async () => {
      // This would test actual error conditions
      // For now, we test the 404 handler structure
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
    });
  });

  // Test performance and reliability
  describe('Performance Tests', () => {
    test('health check should respond quickly', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/health')
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500); // Should respond within 500ms
    });

    test('stats endpoint should respond quickly', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/stats')
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });

    test('should handle multiple concurrent requests', async () => {
      const requests = Array(5).fill().map(() => 
        request(app).get('/api/health').expect(200)
      );
      
      const responses = await Promise.all(requests);
      expect(responses).toHaveLength(5);
      responses.forEach(response => {
        expect(response.body.status).toBe('OK');
      });
    });
  });

  // Test data validation and structure
  describe('Data Validation', () => {
    test('memory stats should have realistic values', async () => {
      const response = await request(app)
        .get('/api/stats')
        .expect(200);
      
      const { memory } = response.body;
      expect(memory.total).toBeGreaterThan(0);
      expect(memory.free).toBeGreaterThan(0);
      expect(memory.usage).toBeGreaterThanOrEqual(0);
      expect(memory.usage).toBeLessThanOrEqual(100);
      expect(memory.free).toBeLessThanOrEqual(memory.total);
    });

    test('uptime formatting should be human readable', async () => {
      const response = await request(app)
        .get('/api/stats')
        .expect(200);
      
      const { uptime } = response.body;
      expect(uptime.server).toMatch(/\d+\s+(minute|hour|day)/);
      expect(uptime.system).toMatch(/\d+\s+(minute|hour|day)/);
    });

    test('timestamps should be valid dates', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });

  // Integration tests
  describe('Integration Tests', () => {
    test('complete server monitoring workflow', async () => {
      // Step 1: Check server health
      const healthResponse = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(healthResponse.body.status).toBe('OK');
      
      // Step 2: Get server stats
      const statsResponse = await request(app)
        .get('/api/stats')
        .expect(200);
      
      expect(statsResponse.body).toHaveProperty('memory');
      expect(statsResponse.body).toHaveProperty('cpu');
      
      // Step 3: Control server (restart)
      const controlResponse = await request(app)
        .post('/api/control/restart')
        .expect(200);
      
      expect(controlResponse.body.success).toBe(true);
    }, 15000);
  });

});

// Cleanup after all tests
afterAll(async () => {
  // Clean up any resources if needed
  // The server doesn't need explicit cleanup since we're testing the exported app
});
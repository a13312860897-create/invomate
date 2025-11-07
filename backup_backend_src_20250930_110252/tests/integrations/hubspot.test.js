const request = require('supertest');
const app = require('../../server');
const HubSpotService = require('../../services/integrations/hubspotService');
const { Integration, SyncLog } = require('../../models');
const jwt = require('jsonwebtoken');

// Mock HubSpot API responses
jest.mock('axios');
const axios = require('axios');

describe('HubSpot Integration Tests', () => {
  let authToken;
  let userId = 1;
  let integrationId;

  beforeAll(async () => {
    // Create test auth token
    authToken = jwt.sign(
      { userId, email: 'test@example.com' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('API Key Validation', () => {
    test('should validate correct API key', async () => {
      // Mock successful API response
      axios.get.mockResolvedValue({
        data: {
          portalId: 12345,
          accountType: 'DEVELOPER'
        }
      });

      const response = await request(app)
        .post('/api/integrations/hubspot/validate-key')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ apiKey: 'valid-api-key' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.portalId).toBe(12345);
    });

    test('should reject invalid API key', async () => {
      // Mock API error response
      axios.get.mockRejectedValue({
        response: {
          status: 401,
          data: { message: 'Invalid API key' }
        }
      });

      const response = await request(app)
        .post('/api/integrations/hubspot/validate-key')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ apiKey: 'invalid-api-key' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid API key');
    });

    test('should handle network errors', async () => {
      // Mock network error
      axios.get.mockRejectedValue(new Error('Network Error'));

      const response = await request(app)
        .post('/api/integrations/hubspot/validate-key')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ apiKey: 'test-api-key' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Network Error');
    });
  });

  describe('Integration Creation', () => {
    test('should create HubSpot integration successfully', async () => {
      // Mock API validation
      axios.get.mockResolvedValue({
        data: {
          portalId: 12345,
          accountType: 'DEVELOPER'
        }
      });

      const response = await request(app)
        .post('/api/integrations/hubspot')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test HubSpot Integration',
          apiKey: 'valid-api-key',
          syncSettings: {
            contacts: true,
            companies: true,
            deals: false
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.platform).toBe('hubspot');
      integrationId = response.body.data.id;
    });

    test('should prevent duplicate integrations', async () => {
      const response = await request(app)
        .post('/api/integrations/hubspot')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Duplicate Integration',
          apiKey: 'valid-api-key',
          syncSettings: {
            contacts: true,
            companies: true,
            deals: false
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('Connection Testing', () => {
    test('should test connection successfully', async () => {
      // Mock successful connection test
      axios.get.mockResolvedValue({
        data: {
          portalId: 12345,
          accountType: 'DEVELOPER'
        }
      });

      const response = await request(app)
        .post(`/api/integrations/hubspot/${integrationId}/test`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.connected).toBe(true);
    });

    test('should handle connection failures', async () => {
      // Mock connection failure
      axios.get.mockRejectedValue({
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      });

      const response = await request(app)
        .post(`/api/integrations/hubspot/${integrationId}/test`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.connected).toBe(false);
      expect(response.body.data.error).toContain('Unauthorized');
    });
  });

  describe('Data Synchronization', () => {
    test('should sync contacts successfully', async () => {
      // Mock contacts API response
      axios.get.mockResolvedValue({
        data: {
          results: [
            {
              id: '1',
              properties: {
                firstname: 'John',
                lastname: 'Doe',
                email: 'john@example.com',
                phone: '+1234567890'
              }
            }
          ],
          paging: {
            next: null
          }
        }
      });

      const response = await request(app)
        .post(`/api/integrations/hubspot/${integrationId}/sync`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
    });

    test('should handle sync errors gracefully', async () => {
      // Mock API error
      axios.get.mockRejectedValue({
        response: {
          status: 429,
          data: { message: 'Rate limit exceeded' }
        }
      });

      const response = await request(app)
        .post(`/api/integrations/hubspot/${integrationId}/sync`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('failed');
      expect(response.body.data.error).toContain('Rate limit');
    });
  });

  describe('Sync Status Monitoring', () => {
    test('should get sync status', async () => {
      const response = await request(app)
        .get(`/api/integrations/hubspot/${integrationId}/status`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('lastSync');
      expect(response.body.data).toHaveProperty('status');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing integration', async () => {
      const response = await request(app)
        .get('/api/integrations/hubspot/99999/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    test('should handle unauthorized access', async () => {
      const response = await request(app)
        .get(`/api/integrations/hubspot/${integrationId}/status`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('token');
    });

    test('should validate request parameters', async () => {
      const response = await request(app)
        .post('/api/integrations/hubspot')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
          name: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('validation');
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (integrationId) {
      await Integration.destroy({ where: { id: integrationId } });
      await SyncLog.destroy({ where: { integrationId } });
    }
  });
});

// Unit tests for HubSpotService
describe('HubSpotService Unit Tests', () => {
  let service;

  beforeEach(() => {
    service = new HubSpotService();
    jest.clearAllMocks();
  });

  describe('Data Processing', () => {
    test('should process contact data correctly', () => {
      const hubspotContact = {
        id: '1',
        properties: {
          firstname: 'John',
          lastname: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          company: 'Test Company'
        }
      };

      const processed = service.processContactData(hubspotContact);

      expect(processed).toEqual({
        externalId: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        company: 'Test Company',
        source: 'hubspot'
      });
    });

    test('should handle missing contact properties', () => {
      const hubspotContact = {
        id: '1',
        properties: {
          email: 'john@example.com'
        }
      };

      const processed = service.processContactData(hubspotContact);

      expect(processed.firstName).toBe('');
      expect(processed.lastName).toBe('');
      expect(processed.email).toBe('john@example.com');
    });
  });

  describe('Rate Limiting', () => {
    test('should respect rate limits', async () => {
      const startTime = Date.now();
      
      // Simulate multiple rapid calls
      await service.makeRateLimitedRequest(() => Promise.resolve());
      await service.makeRateLimitedRequest(() => Promise.resolve());
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should have some delay due to rate limiting
      expect(duration).toBeGreaterThan(100);
    });
  });

  describe('Error Recovery', () => {
    test('should retry failed requests', async () => {
      let attempts = 0;
      const mockRequest = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary error');
        }
        return Promise.resolve({ data: 'success' });
      });

      const result = await service.retryRequest(mockRequest, 3);
      
      expect(attempts).toBe(3);
      expect(result.data).toBe('success');
    });

    test('should fail after max retries', async () => {
      const mockRequest = jest.fn().mockRejectedValue(new Error('Persistent error'));

      await expect(service.retryRequest(mockRequest, 2))
        .rejects.toThrow('Persistent error');
      
      expect(mockRequest).toHaveBeenCalledTimes(2);
    });
  });
});